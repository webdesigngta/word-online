'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileArchive, FileSpreadsheet, FileUp, Presentation, RefreshCw } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import { buildSimplePptx } from '@/tools/presentation/simplePptx';

export type OfficeConversionMode = 'pdf-to-excel' | 'pdf-to-ppt' | 'epub-to-pdf';

type DownloadState = { url: string; name: string; label: string; size: number; outputType: string } | null;

function safeBase(name: string) {
  return name.replace(/\.(?:pdf|epub)$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'document';
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizePath(path: string) {
  const parts: string[] = [];
  path.split('/').forEach((part) => {
    if (!part || part === '.') return;
    if (part === '..') parts.pop();
    else parts.push(part);
  });
  return parts.join('/');
}

function resolvePath(baseFile: string, relative: string) {
  if (!relative || /^(?:data:|https?:|#)/i.test(relative)) return relative;
  const clean = relative.split('#')[0].split('?')[0];
  const directory = baseFile.includes('/') ? baseFile.slice(0, baseFile.lastIndexOf('/') + 1) : '';
  return normalizePath(`${directory}${clean}`);
}

function imageMime(path: string) {
  if (/\.png$/i.test(path)) return 'image/png';
  if (/\.gif$/i.test(path)) return 'image/gif';
  if (/\.webp$/i.test(path)) return 'image/webp';
  if (/\.svg$/i.test(path)) return 'image/svg+xml';
  return 'image/jpeg';
}

function bytesToDataUrl(bytes: Uint8Array, mime: string) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunk, bytes.length)));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function pageRows(items: any[]) {
  const lines: Array<{ y: number; items: Array<{ x: number; end: number; text: string }> }> = [];
  items.forEach((item) => {
    const text = String(item.str ?? '').trim();
    if (!text) return;
    const x = Number(item.transform?.[4] ?? 0);
    const y = Number(item.transform?.[5] ?? 0);
    const width = Number(item.width ?? Math.max(8, text.length * 4));
    let line = lines.find((candidate) => Math.abs(candidate.y - y) <= 3);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push({ x, end: x + width, text });
  });
  return lines.sort((a, b) => b.y - a.y).map((line) => {
    const sorted = line.items.sort((a, b) => a.x - b.x);
    const cells: string[] = [];
    let current = '';
    let previousEnd = -Infinity;
    sorted.forEach((item) => {
      const gap = item.x - previousEnd;
      if (current && gap > 28) {
        cells.push(current.trim());
        current = item.text;
      } else {
        current += `${current ? ' ' : ''}${item.text}`;
      }
      previousEnd = Math.max(previousEnd, item.end);
    });
    if (current) cells.push(current.trim());
    return cells;
  }).filter((row) => row.some(Boolean));
}

async function convertPdfToExcel(file: File) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const XLSX = await import('xlsx');
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const workbook = XLSX.utils.book_new();
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const rows = pageRows(content.items as any[]);
      const sheet = XLSX.utils.aoa_to_sheet(rows.length ? rows : [['No extractable text found on this page.']]);
      XLSX.utils.book_append_sheet(workbook, sheet, `Page ${pageNumber}`.slice(0, 31));
    }
    const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    return { blob: new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), pageCount: pdf.numPages };
  } finally {
    await pdf.destroy?.();
  }
}

async function canvasPngBytes(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not render PDF page image.')), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

async function convertPdfToPpt(file: File) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const slides: Array<{ png: Uint8Array }> = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.7 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Could not create a page canvas.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;
      slides.push({ png: await canvasPngBytes(canvas) });
    }
    return { blob: await buildSimplePptx(slides, safeBase(file.name)), pageCount: pdf.numPages };
  } finally {
    await pdf.destroy?.();
  }
}

async function convertEpubToPdf(file: File) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const containerText = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerText) throw new Error('This EPUB does not contain META-INF/container.xml.');
  const containerXml = new DOMParser().parseFromString(containerText, 'application/xml');
  const opfPath = containerXml.querySelector('rootfile')?.getAttribute('full-path');
  if (!opfPath) throw new Error('Could not find the EPUB package document.');
  const opfText = await zip.file(opfPath)?.async('text');
  if (!opfText) throw new Error('Could not read the EPUB package document.');
  const opf = new DOMParser().parseFromString(opfText, 'application/xml');
  const manifest = new Map<string, string>();
  opf.querySelectorAll('manifest > item').forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (id && href) manifest.set(id, resolvePath(opfPath, href));
  });
  const spinePaths = Array.from(opf.querySelectorAll('spine > itemref')).map((item) => manifest.get(item.getAttribute('idref') || '')).filter((value): value is string => Boolean(value));
  if (!spinePaths.length) throw new Error('The EPUB reading order is empty.');
  const chapters: string[] = [];
  for (const chapterPath of spinePaths) {
    const text = await zip.file(chapterPath)?.async('text');
    if (!text) continue;
    const doc = new DOMParser().parseFromString(text, 'text/html');
    doc.querySelectorAll('script,iframe,object,embed,form,link,base,meta').forEach((node) => node.remove());
    doc.querySelectorAll<HTMLElement>('*').forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        if (attribute.name.toLowerCase().startsWith('on')) element.removeAttribute(attribute.name);
      });
    });
    for (const image of Array.from(doc.querySelectorAll<HTMLImageElement>('img[src]'))) {
      const source = image.getAttribute('src') || '';
      const resolved = resolvePath(chapterPath, source);
      if (!resolved || /^(?:data:|https?:)/i.test(resolved)) {
        if (/^https?:/i.test(resolved)) image.removeAttribute('src');
        continue;
      }
      const entry = zip.file(resolved);
      if (!entry) {
        image.removeAttribute('src');
        continue;
      }
      const bytes = await entry.async('uint8array');
      image.src = bytesToDataUrl(bytes, imageMime(resolved));
      image.style.maxWidth = '100%';
      image.style.height = 'auto';
    }
    chapters.push(`<section class="epub-chapter">${doc.body.innerHTML}</section>`);
  }
  if (!chapters.length) throw new Error('No readable EPUB chapters were found.');
  const html = `<style>body{font-family:Georgia,serif;color:#202124;line-height:1.55;font-size:11.5pt}.epub-chapter{page-break-after:always}.epub-chapter:last-child{page-break-after:auto}img{max-width:100%;height:auto}h1,h2,h3{page-break-after:avoid}pre{white-space:pre-wrap}</style>${chapters.join('')}`;
  const { htmlToPdfProcessor } = await import('@/tools/html');
  const result = await htmlToPdfProcessor.process(html, { filename: safeBase(file.name), margin: 14, pageFormat: 'a4', orientation: 'portrait' });
  if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'EPUB to PDF conversion failed.');
  return { blob: result.output.blob, pageCount: result.pageCount };
}

function modeInfo(mode: OfficeConversionMode) {
  if (mode === 'pdf-to-excel') return { accept: '.pdf,application/pdf', action: 'Choose PDF', icon: FileSpreadsheet, intro: 'Extract positioned PDF text into one XLSX worksheet per page.', output: 'xlsx' };
  if (mode === 'pdf-to-ppt') return { accept: '.pdf,application/pdf', action: 'Choose PDF', icon: Presentation, intro: 'Turn every PDF page into a visual PowerPoint slide.', output: 'pptx' };
  return { accept: '.epub,application/epub+zip', action: 'Choose EPUB', icon: FileArchive, intro: 'Convert a reflowable EPUB reading order into a paginated PDF.', output: 'pdf' };
}

export function OfficeConversionInterface({ mode, toolId }: { mode: OfficeConversionMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a file to begin.');
  const [download, setDownload] = useState<DownloadState>(null);
  const info = modeInfo(mode);
  const Icon = info.icon;

  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);

  function replaceDownload(blob: Blob, name: string, label: string, outputType: string) {
    if (download) URL.revokeObjectURL(download.url);
    setDownload({ url: URL.createObjectURL(blob), name, label, size: blob.size, outputType });
  }

  async function choose(selected?: File) {
    if (!selected) return;
    const valid = mode === 'epub-to-pdf' ? /\.epub$/i.test(selected.name) : /\.pdf$/i.test(selected.name);
    if (!valid) {
      setStatus(`Choose a ${mode === 'epub-to-pdf' ? 'EPUB' : 'PDF'} file.`);
      return;
    }
    if (selected.size <= 0 || selected.size > 50 * 1024 * 1024) {
      setStatus('Files must be between 1 byte and 50 MB.');
      return;
    }
    setFile(selected);
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null);
    setStatus(`${selected.name} is ready.`);
    trackToolEvent('tool_start', { toolId, fileType: mode === 'epub-to-pdf' ? 'epub' : 'pdf' });
  }

  async function convert() {
    if (!file || busy) return;
    setBusy(true);
    setStatus('Converting locally in your browser…');
    try {
      const base = safeBase(file.name);
      if (mode === 'pdf-to-excel') {
        const result = await convertPdfToExcel(file);
        replaceDownload(result.blob, `${base}.xlsx`, 'Download XLSX', 'xlsx');
        setStatus(`Created an Excel workbook with ${result.pageCount} page worksheet${result.pageCount === 1 ? '' : 's'}.`);
      } else if (mode === 'pdf-to-ppt') {
        const result = await convertPdfToPpt(file);
        replaceDownload(result.blob, `${base}.pptx`, 'Download PPTX', 'pptx');
        setStatus(`Created ${result.pageCount} PowerPoint slide${result.pageCount === 1 ? '' : 's'}.`);
      } else {
        const result = await convertEpubToPdf(file);
        replaceDownload(result.blob, `${base}.pdf`, 'Download PDF', 'pdf');
        setStatus(`EPUB converted to PDF${result.pageCount ? ` · ${result.pageCount} pages` : ''}.`);
      }
      trackToolEvent('tool_success', { toolId, fileType: mode === 'epub-to-pdf' ? 'epub' : 'pdf', outputType: info.output });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, metadata: { message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null);
    setFile(null);
    setStatus('Choose a file to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  return <div className="office-converter">
    <style>{`.office-converter{display:grid;gap:16px}.oc-drop{border:2px dashed #d5dae2;border-radius:18px;background:#fbfcfe;padding:32px;text-align:center}.oc-drop svg{width:46px;height:46px;color:#0b57d0;margin-bottom:10px}.oc-drop h2{margin:0;font-size:22px}.oc-drop p{color:#5f6368;max-width:620px;margin:8px auto 18px;line-height:1.55}.oc-btn{border:1px solid #dadce0;border-radius:22px;background:#fff;color:#202124;padding:10px 16px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.oc-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.oc-btn.success{background:#137333;border-color:#137333;color:#fff}.oc-btn:disabled{opacity:.5;cursor:not-allowed}.oc-file,.oc-output{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border:1px solid #e0e3e7;border-radius:14px;background:#fff}.oc-file strong,.oc-output strong{display:block;overflow:hidden;text-overflow:ellipsis}.oc-file span,.oc-output span,.oc-status{display:block;color:#5f6368;font-size:12px;margin-top:3px}.oc-actions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:650px){.oc-drop{padding:24px 14px}.oc-file,.oc-output{align-items:flex-start;flex-direction:column}}`}</style>
    <input ref={inputRef} hidden type="file" accept={info.accept} onChange={(event) => void choose(event.target.files?.[0])} />
    <div className="oc-drop"><Icon /><h2>{mode === 'pdf-to-excel' ? 'Convert PDF to Excel' : mode === 'pdf-to-ppt' ? 'Convert PDF to PowerPoint' : 'Convert EPUB to PDF'}</h2><p>{info.intro}</p><button className="oc-btn primary" type="button" disabled={busy} onClick={() => inputRef.current?.click()}><FileUp size={17} />{file ? 'Choose another file' : info.action}</button></div>
    {file ? <div className="oc-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div><div className="oc-actions"><button className="oc-btn" type="button" onClick={reset} disabled={busy}><RefreshCw size={16}/>Reset</button><button className="oc-btn primary" type="button" onClick={convert} disabled={busy}>{busy ? <RefreshCw size={16}/> : <Download size={16}/>} {busy ? 'Converting…' : `Convert to ${info.output.toUpperCase()}`}</button></div></div> : null}
    <div className="oc-status" role="status">{status}</div>
    {download ? <div className="oc-output"><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div><a className="oc-btn success" href={download.url} download={download.name} onClick={() => trackToolEvent('tool_download', { toolId, outputType: download.outputType })}><Download size={16}/>{download.label}</a></div> : null}
  </div>;
}
