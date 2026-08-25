'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileUp, Image as ImageIcon, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type PdfReaderImageMode = 'pdf-reader' | 'pdf-to-jpg';

type DownloadItem = { name: string; url: string; size: number; label: string };

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function baseName(name: string) {
  return name.replace(/\.pdf$/i, '') || 'document';
}

function parsePageSelection(value: string, pageCount: number): number[] | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === 'all') return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages: number[] = [];
  for (const token of trimmed.split(',').map((item) => item.trim()).filter(Boolean)) {
    if (/^\d+$/.test(token)) pages.push(Number(token));
    else {
      const match = /^(\d+)\s*-\s*(\d+)$/.exec(token);
      if (!match) return null;
      const start = Number(match[1]);
      const end = Number(match[2]);
      if (start > end) return null;
      for (let page = start; page <= end; page += 1) pages.push(page);
    }
  }
  if (!pages.length || pages.some((page) => page < 1 || page > pageCount)) return null;
  return [...new Set(pages)];
}

export function PdfReaderImageInterface({ mode, toolId }: { mode: PdfReaderImageMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a PDF file to begin.');
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1.25);
  const [pageSelection, setPageSelection] = useState('all');
  const [quality, setQuality] = useState(0.9);
  const [renderScale, setRenderScale] = useState(2);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => () => {
    downloads.forEach((item) => URL.revokeObjectURL(item.url));
    pdfRef.current?.destroy?.();
  }, [downloads]);

  function replaceDownloads(next: Array<{ name: string; blob: Blob; size?: number; label: string }>) {
    downloads.forEach((item) => URL.revokeObjectURL(item.url));
    setDownloads(next.map((item) => ({
      name: item.name,
      url: URL.createObjectURL(item.blob),
      size: item.size ?? item.blob.size,
      label: item.label,
    })));
  }

  async function renderPage(pdf: any, nextPage: number, nextZoom: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const page = await pdf.getPage(nextPage);
    const viewport = page.getViewport({ scale: nextZoom });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not create the PDF preview canvas.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
  }

  async function chooseFile(selected: FileList | null) {
    const next = selected?.[0];
    if (!next) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) {
      setStatus('Please choose a PDF file.');
      return;
    }
    setBusy(true);
    replaceDownloads([]);
    setStatus('Opening PDF in your browser…');
    try {
      pdfRef.current?.destroy?.();
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const data = new Uint8Array(await next.arrayBuffer());
      const pdf = await pdfjs.getDocument({ data }).promise;
      pdfRef.current = pdf;
      setFile(next);
      setPageCount(pdf.numPages);
      setPageNumber(1);
      setPageSelection('all');
      if (mode === 'pdf-reader') await renderPage(pdf, 1, zoom);
      setStatus(mode === 'pdf-reader' ? `Opened ${pdf.numPages} ${pdf.numPages === 1 ? 'page' : 'pages'}.` : `Ready to convert ${pdf.numPages} ${pdf.numPages === 1 ? 'page' : 'pages'} to JPG.`);
      trackToolEvent('tool_start', { toolId, fileType: 'pdf', metadata: { pageCount: pdf.numPages } });
    } catch (error) {
      setFile(null);
      setPageCount(0);
      setStatus(error instanceof Error ? error.message : 'The PDF could not be opened.');
      trackToolEvent('tool_error', { toolId, fileType: 'pdf' });
    } finally {
      setBusy(false);
    }
  }

  async function goToPage(next: number) {
    if (!pdfRef.current || next < 1 || next > pageCount || busy) return;
    setBusy(true);
    try {
      await renderPage(pdfRef.current, next, zoom);
      setPageNumber(next);
      setStatus(`Page ${next} of ${pageCount}.`);
    } finally {
      setBusy(false);
    }
  }

  async function changeZoom(delta: number) {
    if (!pdfRef.current || busy) return;
    const next = Math.min(2.5, Math.max(0.65, Number((zoom + delta).toFixed(2))));
    setBusy(true);
    try {
      await renderPage(pdfRef.current, pageNumber, next);
      setZoom(next);
      setStatus(`Zoom ${Math.round(next * 100)}%.`);
    } finally {
      setBusy(false);
    }
  }

  async function convertToJpg() {
    if (!file || !pageCount || busy) return;
    const pages = parsePageSelection(pageSelection, pageCount);
    if (!pages) {
      setStatus(`Enter “all”, page numbers like 1,3,5, or a range such as 2-6. Pages must be between 1 and ${pageCount}.`);
      return;
    }
    setBusy(true);
    replaceDownloads([]);
    setStatus('Rendering PDF pages as JPG images…');
    try {
      const { pdfToJpgProcessor } = await import('@/tools/pdf');
      const result = await pdfToJpgProcessor.process(file as never, { pages, quality, scale: renderScale });
      if (!result.success || !result.outputs?.length) throw new Error(result.errors[0]?.message || 'PDF to JPG conversion failed.');
      if (result.outputs.length === 1) {
        const output = result.outputs[0];
        replaceDownloads([{ name: output.name, blob: output.blob, size: output.size, label: 'Download JPG' }]);
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        result.outputs.forEach((output) => zip.file(output.name, output.blob));
        const blob = await zip.generateAsync({ type: 'blob' });
        replaceDownloads([{ name: `${baseName(file.name)}-jpg-pages.zip`, blob, label: 'Download JPG pages as ZIP' }]);
      }
      setStatus(`Converted ${result.resultingFileCount} ${result.resultingFileCount === 1 ? 'page' : 'pages'} to JPG.`);
      trackToolEvent('tool_success', { toolId, fileType: 'pdf', outputType: 'jpg', metadata: { pageCount: result.resultingFileCount } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The PDF could not be converted to JPG.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    pdfRef.current?.destroy?.();
    pdfRef.current = null;
    replaceDownloads([]);
    setFile(null);
    setPageCount(0);
    setPageNumber(1);
    setPageSelection('all');
    setStatus('Choose a PDF file to begin.');
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="pdf-reader-image-tool">
      <style>{`
        .pdf-reader-image-tool{display:grid;gap:16px}.pri-drop{border:2px dashed #d4d9e1;border-radius:18px;background:linear-gradient(180deg,#fbfdff,#f6f9fe);padding:28px;text-align:center}.pri-drop svg{width:46px;height:46px;color:#0b57d0;margin-bottom:10px}.pri-drop h2{margin:0;font-size:22px}.pri-drop p{margin:8px auto 17px;color:#5f6368;line-height:1.55;max-width:620px}.pri-btn{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:10px 16px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.pri-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.pri-btn.success{background:#137333;border-color:#137333;color:#fff}.pri-btn:disabled{opacity:.45;cursor:not-allowed}.pri-info{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e0e3e7;border-radius:12px;padding:11px 13px;background:#fff}.pri-info strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pri-info span{color:#5f6368;font-size:12px}.pri-controls{display:flex;align-items:center;gap:9px;flex-wrap:wrap;border:1px solid #e0e3e7;border-radius:14px;background:#fff;padding:13px}.pri-controls label{font-size:13px;font-weight:650}.pri-input,.pri-select{border:1px solid #d4d9e1;border-radius:10px;padding:9px 11px;background:#fff;color:#202124}.pri-input{min-width:220px}.pri-reader{display:grid;gap:12px}.pri-toolbar{display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap}.pri-canvas-wrap{overflow:auto;max-height:72vh;background:#eef1f5;border:1px solid #dfe3e8;border-radius:14px;padding:18px;text-align:center}.pri-canvas-wrap canvas{display:inline-block;max-width:none;background:#fff;box-shadow:0 5px 24px rgba(60,64,67,.18)}.pri-status{color:#5f6368;font-size:13px;line-height:1.5}.pri-download{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #cde3d3;border-radius:14px;padding:13px 15px;background:#f4faf6}.pri-download strong{display:block}.pri-download span{display:block;font-size:11px;color:#5f6368;margin-top:3px}@media(max-width:650px){.pri-drop{padding:22px 13px}.pri-info,.pri-download{align-items:flex-start;flex-direction:column}.pri-input{min-width:0;width:100%}.pri-canvas-wrap{padding:8px}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => chooseFile(event.target.files)} />
      <div className="pri-drop">
        {mode === 'pdf-reader' ? <FileUp /> : <ImageIcon />}
        <h2>{mode === 'pdf-reader' ? 'Open a PDF' : 'Convert PDF pages to JPG'}</h2>
        <p>{mode === 'pdf-reader' ? 'View PDF pages directly in your browser with page navigation and zoom controls.' : 'Choose the pages you need, set JPG quality, and export one image or a ZIP of multiple pages.'}</p>
        <button className="pri-btn primary" type="button" onClick={() => inputRef.current?.click()} disabled={busy}><FileUp size={17} />{file ? 'Choose another PDF' : 'Choose PDF'}</button>
      </div>

      {file ? <div className="pri-info"><div><strong>{file.name}</strong><span>{formatBytes(file.size)} · {pageCount} {pageCount === 1 ? 'page' : 'pages'}</span></div><button className="pri-btn" type="button" onClick={reset} disabled={busy}><RefreshCw size={15} />Reset</button></div> : null}

      {mode === 'pdf-reader' && file ? (
        <div className="pri-reader">
          <div className="pri-toolbar">
            <button className="pri-btn" type="button" onClick={() => goToPage(pageNumber - 1)} disabled={busy || pageNumber <= 1}><ChevronLeft size={16} />Previous</button>
            <span>Page {pageNumber} of {pageCount}</span>
            <button className="pri-btn" type="button" onClick={() => goToPage(pageNumber + 1)} disabled={busy || pageNumber >= pageCount}>Next<ChevronRight size={16} /></button>
            <button className="pri-btn" type="button" onClick={() => changeZoom(-0.15)} disabled={busy || zoom <= 0.65}><ZoomOut size={16} /></button>
            <span>{Math.round(zoom * 100)}%</span>
            <button className="pri-btn" type="button" onClick={() => changeZoom(0.15)} disabled={busy || zoom >= 2.5}><ZoomIn size={16} /></button>
          </div>
          <div className="pri-canvas-wrap"><canvas ref={canvasRef} /></div>
        </div>
      ) : <canvas ref={canvasRef} hidden />}

      {mode === 'pdf-to-jpg' && file ? (
        <div className="pri-controls">
          <label htmlFor="pdf-jpg-pages">Pages</label>
          <input id="pdf-jpg-pages" className="pri-input" value={pageSelection} onChange={(event) => setPageSelection(event.target.value)} placeholder="all or 1,3,5-7" disabled={busy} />
          <label htmlFor="pdf-jpg-quality">Quality</label>
          <select id="pdf-jpg-quality" className="pri-select" value={quality} onChange={(event) => setQuality(Number(event.target.value))} disabled={busy}>
            <option value={0.75}>Good · smaller</option><option value={0.9}>High</option><option value={0.98}>Maximum</option>
          </select>
          <label htmlFor="pdf-jpg-scale">Resolution</label>
          <select id="pdf-jpg-scale" className="pri-select" value={renderScale} onChange={(event) => setRenderScale(Number(event.target.value))} disabled={busy}>
            <option value={1.5}>Standard</option><option value={2}>High</option><option value={3}>Very high</option>
          </select>
          <button className="pri-btn primary" type="button" onClick={convertToJpg} disabled={busy}><ImageIcon size={16} />{busy ? 'Converting…' : 'Convert to JPG'}</button>
        </div>
      ) : null}

      <div className="pri-status" role="status">{status}</div>
      {downloads.map((item) => <div className="pri-download" key={item.url}><div><strong>{item.name}</strong><span>{formatBytes(item.size)}</span></div><a className="pri-btn success" href={item.url} download={item.name} onClick={() => trackToolEvent('tool_download', { toolId, outputType: mode === 'pdf-to-jpg' ? 'jpg' : 'pdf' })}><Download size={16} />{item.label}</a></div>)}
    </div>
  );
}
