'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, ChevronLeft, ChevronRight, Download, FileSearch, FileUp, Italic, LoaderCircle, RotateCcw, ScanText, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

const DISPLAY_SCALE = 1.35;
const OCR_SCALE = 2.5;
const SAMPLE_SCALE = 1.6;
const FONT_CHOICES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Calibri', 'Verdana', 'Courier New'];

type SourceKind = 'native' | 'ocr';
type TextBox = {
  id: string;
  page: number;
  text: string;
  originalText: string;
  x: number;
  top: number;
  width: number;
  height: number;
  fontFamily: string;
  originalFontFamily: string;
  fontSize: number;
  originalFontSize: number;
  bold: boolean;
  originalBold: boolean;
  italic: boolean;
  originalItalic: boolean;
  color: string;
  originalColor: string;
  background: string;
  source: SourceKind;
  confidence: number | null;
};

type PageModel = { pageNumber: number; width: number; height: number; source: SourceKind; confidence: number | null; boxes: TextBox[] };

type OcrWord = { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } };

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function formatBytes(value: number) { return value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
function hex(r: number, g: number, b: number) { return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`; }
function rgb(hexColor: string) {
  const value = hexColor.replace('#', '').padEnd(6, '0').slice(0, 6);
  return { r: parseInt(value.slice(0, 2), 16) / 255, g: parseInt(value.slice(2, 4), 16) / 255, b: parseInt(value.slice(4, 6), 16) / 255 };
}

function inferFont(fontName = '', family = '') {
  const value = `${fontName} ${family}`.toLowerCase();
  let resolved = 'Arial';
  if (value.includes('calibri')) resolved = 'Calibri';
  else if (value.includes('georgia')) resolved = 'Georgia';
  else if (value.includes('courier') || value.includes('mono')) resolved = 'Courier New';
  else if (value.includes('times') || value.includes('serif')) resolved = 'Times New Roman';
  else if (value.includes('verdana')) resolved = 'Verdana';
  else if (value.includes('helvetica')) resolved = 'Helvetica';
  return { family: resolved, bold: /bold|black|heavy|semibold|demi/.test(value), italic: /italic|oblique/.test(value) };
}

async function renderCanvas(page: any, scale: number) {
  const viewport = page.getViewport({ scale });
  const canvas = window.document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Could not create a PDF canvas.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

function sampleColors(canvas: HTMLCanvasElement, x: number, top: number, width: number, height: number, scale: number) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { color: '#202124', background: '#ffffff' };
  const left = clamp(Math.floor(x * scale), 0, Math.max(0, canvas.width - 1));
  const y = clamp(Math.floor(top * scale), 0, Math.max(0, canvas.height - 1));
  const w = clamp(Math.ceil(width * scale), 1, Math.max(1, canvas.width - left));
  const h = clamp(Math.ceil(height * scale), 1, Math.max(1, canvas.height - y));
  const image = context.getImageData(left, y, w, h).data;
  const pixel = (px: number, py: number) => {
    const index = (py * w + px) * 4;
    return [image[index], image[index + 1], image[index + 2]] as [number, number, number];
  };
  const edges: Array<[number, number, number]> = [];
  for (let px = 0; px < w; px += Math.max(1, Math.floor(w / 10))) edges.push(pixel(px, 0), pixel(px, h - 1));
  for (let py = 0; py < h; py += Math.max(1, Math.floor(h / 5))) edges.push(pixel(0, py), pixel(w - 1, py));
  const background = edges.reduce((sum, item) => [sum[0] + item[0], sum[1] + item[1], sum[2] + item[2]] as [number, number, number], [0, 0, 0] as [number, number, number]).map((v) => v / Math.max(1, edges.length)) as [number, number, number];
  let foreground: [number, number, number] = [32, 33, 36];
  let distance = 0;
  for (let py = 0; py < h; py += Math.max(1, Math.floor(h / 10))) {
    for (let px = 0; px < w; px += Math.max(1, Math.floor(w / 20))) {
      const candidate = pixel(px, py);
      const next = Math.hypot(candidate[0] - background[0], candidate[1] - background[1], candidate[2] - background[2]);
      if (next > distance) { distance = next; foreground = candidate; }
    }
  }
  return { color: distance > 25 ? hex(...foreground) : '#202124', background: hex(...background) };
}

function groupOcrWords(words: OcrWord[]) {
  const valid = words.filter((word) => word.text?.trim() && word.confidence >= 20 && word.bbox.x1 > word.bbox.x0 && word.bbox.y1 > word.bbox.y0);
  const heights = valid.map((word) => word.bbox.y1 - word.bbox.y0).sort((a, b) => a - b);
  const median = heights.length ? heights[Math.floor(heights.length / 2)] : 20;
  const lines: OcrWord[][] = [];
  for (const word of [...valid].sort((a, b) => ((a.bbox.y0 + a.bbox.y1) / 2) - ((b.bbox.y0 + b.bbox.y1) / 2) || a.bbox.x0 - b.bbox.x0)) {
    const center = (word.bbox.y0 + word.bbox.y1) / 2;
    let line = lines.find((candidate) => {
      const lineCenter = candidate.reduce((sum, item) => sum + (item.bbox.y0 + item.bbox.y1) / 2, 0) / candidate.length;
      return Math.abs(lineCenter - center) <= Math.max(median * 0.55, (word.bbox.y1 - word.bbox.y0) * 0.55);
    });
    if (!line) { line = []; lines.push(line); }
    line.push(word);
  }
  return lines.map((line) => {
    line.sort((a, b) => a.bbox.x0 - b.bbox.x0);
    return {
      text: line.map((word) => word.text.trim()).join(' '),
      confidence: line.reduce((sum, word) => sum + word.confidence, 0) / line.length,
      x0: Math.min(...line.map((word) => word.bbox.x0)),
      y0: Math.min(...line.map((word) => word.bbox.y0)),
      x1: Math.max(...line.map((word) => word.bbox.x1)),
      y1: Math.max(...line.map((word) => word.bbox.y1)),
    };
  }).filter((line) => line.text);
}

function changed(box: TextBox) {
  return box.text !== box.originalText || box.fontFamily !== box.originalFontFamily || Math.abs(box.fontSize - box.originalFontSize) > 0.05 || box.bold !== box.originalBold || box.italic !== box.originalItalic || box.color !== box.originalColor;
}

function fontKey(box: TextBox) {
  const family = box.fontFamily.toLowerCase();
  if (family.includes('times') || family.includes('georgia')) return `TimesRoman${box.bold ? 'Bold' : ''}${box.italic ? 'Italic' : ''}`;
  if (family.includes('courier')) return `Courier${box.bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;
  return `Helvetica${box.bold ? 'Bold' : ''}${box.italic ? 'Oblique' : ''}`;
}

function wrapText(text: string, font: any, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const words = raw.split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(''); continue; }
    let line = words[0];
    for (let index = 1; index < words.length; index += 1) {
      const candidate = `${line} ${words[index]}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else { lines.push(line); line = words[index]; }
    }
    lines.push(line);
  }
  return lines;
}

export function PdfSmartEditInterfaceV2({ toolId }: { toolId: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageModel[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState('eng');
  const [status, setStatus] = useState('Choose a PDF. DOC321 will use embedded PDF text first and OCR scanned pages automatically.');

  const page = pages.find((item) => item.pageNumber === pageNumber) || null;
  const selected = useMemo(() => page?.boxes.find((box) => box.id === selectedId) || null, [page, selectedId]);
  const editCount = useMemo(() => pages.reduce((total, item) => total + item.boxes.filter(changed).length, 0), [pages]);

  useEffect(() => () => { pdfRef.current?.destroy?.(); }, []);

  async function drawPage(pageNo: number) {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    const pdfPage = await pdf.getPage(pageNo);
    const viewport = pdfPage.getViewport({ scale: DISPLAY_SCALE });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await pdfPage.render({ canvasContext: context, viewport }).promise;
  }

  useEffect(() => { if (file && page) void drawPage(pageNumber); }, [file, page, pageNumber]);

  function patchBox(id: string, patch: Partial<TextBox>) {
    setPages((current) => current.map((item) => item.pageNumber !== pageNumber ? item : { ...item, boxes: item.boxes.map((box) => box.id === id ? { ...box, ...patch } : box) }));
  }

  function resetSelected() {
    if (!selected) return;
    patchBox(selected.id, { text: selected.originalText, fontFamily: selected.originalFontFamily, fontSize: selected.originalFontSize, bold: selected.originalBold, italic: selected.originalItalic, color: selected.originalColor });
  }

  async function analyze(pdf: any) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const models: PageModel[] = [];
    let worker: any = null;
    try {
      for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        setStatus(`Analyzing page ${pageIndex} of ${pdf.numPages}...`);
        setProgress(Math.round(((pageIndex - 1) / pdf.numPages) * 100));
        const pdfPage = await pdf.getPage(pageIndex);
        const viewport = pdfPage.getViewport({ scale: 1 });
        const textContent = await pdfPage.getTextContent();
        const items = textContent.items.filter((item: any) => typeof item.str === 'string' && item.str.trim());
        const charCount = items.reduce((sum: number, item: any) => sum + item.str.trim().length, 0);
        const sample = await renderCanvas(pdfPage, charCount >= 12 ? SAMPLE_SCALE : OCR_SCALE);

        if (charCount >= 12) {
          const boxes: TextBox[] = items.map((item: any, index: number) => {
            const tx = pdfjs.Util.transform(viewport.transform, item.transform);
            const fontSize = Math.max(4, Math.hypot(tx[2], tx[3]));
            const style = (textContent.styles as Record<string, any>)[item.fontName] || {};
            const meta = inferFont(item.fontName, style.fontFamily);
            const x = clamp(tx[4], 0, viewport.width);
            const top = clamp(tx[5] - fontSize, 0, viewport.height);
            const width = clamp(Math.max(item.width || 0, fontSize * 0.4), 6, Math.max(6, viewport.width - x));
            const height = clamp(fontSize * 1.08, 6, Math.max(6, viewport.height - top));
            const sampled = sampleColors(sample, x, top, width, height, SAMPLE_SCALE);
            return { id: `native-${pageIndex}-${index}`, page: pageIndex, text: item.str, originalText: item.str, x, top, width, height, fontFamily: meta.family, originalFontFamily: meta.family, fontSize, originalFontSize: fontSize, bold: meta.bold, originalBold: meta.bold, italic: meta.italic, originalItalic: meta.italic, color: sampled.color, originalColor: sampled.color, background: sampled.background, source: 'native', confidence: 100 };
          });
          models.push({ pageNumber: pageIndex, width: viewport.width, height: viewport.height, source: 'native', confidence: 100, boxes });
        } else {
          if (!worker) {
            const tesseract = await import('tesseract.js');
            worker = await tesseract.createWorker(language, 1, { logger: (message: { status?: string; progress?: number }) => {
              if (message.status?.includes('recognizing') && typeof message.progress === 'number') setProgress(Math.min(99, Math.round((((pageIndex - 1) + message.progress) / pdf.numPages) * 100)));
            } });
          }
          const recognized = await worker.recognize(sample);
          const lines = groupOcrWords(recognized.data.words || []);
          const boxes: TextBox[] = lines.map((line, index) => {
            const x = line.x0 / OCR_SCALE;
            const top = line.y0 / OCR_SCALE;
            const width = Math.max(8, (line.x1 - line.x0) / OCR_SCALE);
            const height = Math.max(6, (line.y1 - line.y0) / OCR_SCALE);
            const sampled = sampleColors(sample, x, top, width, height, OCR_SCALE);
            const size = clamp(height * 0.9, 6, 72);
            return { id: `ocr-${pageIndex}-${index}`, page: pageIndex, text: line.text, originalText: line.text, x, top, width, height: height * 1.12, fontFamily: 'Arial', originalFontFamily: 'Arial', fontSize: size, originalFontSize: size, bold: false, originalBold: false, italic: false, originalItalic: false, color: sampled.color, originalColor: sampled.color, background: sampled.background, source: 'ocr', confidence: line.confidence };
          });
          models.push({ pageNumber: pageIndex, width: viewport.width, height: viewport.height, source: 'ocr', confidence: typeof recognized.data.confidence === 'number' ? recognized.data.confidence : null, boxes });
        }
        sample.width = 0; sample.height = 0;
      }
      setProgress(100);
      return models;
    } finally {
      await worker?.terminate?.().catch(() => undefined);
    }
  }

  async function chooseFile(files: FileList | null) {
    const next = files?.[0];
    if (!next) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) { setStatus('Please choose a PDF file.'); return; }
    setBusy(true); setPages([]); setSelectedId(null); setPageNumber(1); setProgress(0); setStatus('Opening PDF...');
    try {
      pdfRef.current?.destroy?.();
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await next.arrayBuffer()) }).promise;
      pdfRef.current = pdf; setFile(next);
      const models = await analyze(pdf); setPages(models); await drawPage(1);
      const nativePages = models.filter((item) => item.source === 'native').length;
      const ocrPages = models.length - nativePages;
      setStatus(`Ready. ${nativePages} page${nativePages === 1 ? '' : 's'} used PDF text metadata and ${ocrPages} page${ocrPages === 1 ? '' : 's'} used OCR. Click any recognized text to edit it.`);
      trackToolEvent('tool_start', { toolId, fileType: 'pdf', metadata: { mode: 'smart-edit', pageCount: pdf.numPages, nativePages, ocrPages } });
    } catch (error) { setFile(null); setPages([]); setStatus(error instanceof Error ? error.message : 'Could not analyze this PDF.'); }
    finally { setBusy(false); }
  }

  async function exportPdf() {
    if (!file || busy) return;
    const edits = pages.flatMap((item) => item.boxes.filter(changed));
    if (!edits.length) { setStatus('Make a text edit first.'); return; }
    setBusy(true); setStatus(`Applying ${edits.length} text edit${edits.length === 1 ? '' : 's'}...`);
    try {
      const pdfLib = await import('pdf-lib');
      const pdfDocument = await pdfLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const fonts = new Map<string, any>();
      for (const box of edits) {
        const pdfPage = pdfDocument.getPage(box.page - 1);
        const pageWidth = pdfPage.getWidth(); const pageHeight = pdfPage.getHeight();
        const coverX = clamp(box.x - 1.5, 0, pageWidth); const coverTop = clamp(box.top - 1.5, 0, pageHeight);
        const coverWidth = clamp(box.width + 3, 1, Math.max(1, pageWidth - coverX));
        const coverHeight = clamp(Math.max(box.height + 3, box.fontSize * 1.25), 1, Math.max(1, pageHeight - coverTop));
        const bg = rgb(box.background);
        pdfPage.drawRectangle({ x: coverX, y: pageHeight - coverTop - coverHeight, width: coverWidth, height: coverHeight, color: pdfLib.rgb(bg.r, bg.g, bg.b), borderWidth: 0 });
        if (!box.text.trim()) continue;
        const key = fontKey(box);
        let font = fonts.get(key);
        if (!font) {
          const standard = pdfLib.StandardFonts as unknown as Record<string, string>;
          font = await pdfDocument.embedFont(standard[key] || standard.Helvetica);
          fonts.set(key, font);
        }
        let size = clamp(box.fontSize, 4, 96);
        let lines = wrapText(box.text, font, size, Math.max(8, box.width));
        while (size > 5 && lines.length * size * 1.18 > Math.max(box.height * 2.4, size * 1.3)) { size -= 0.5; lines = wrapText(box.text, font, size, Math.max(8, box.width)); }
        const fg = rgb(box.color); const baseline = pageHeight - box.top - size;
        lines.forEach((line, index) => { if (line) pdfPage.drawText(line, { x: box.x, y: baseline - index * size * 1.18, size, font, color: pdfLib.rgb(fg.r, fg.g, fg.b) }); });
      }
      const bytes = await pdfDocument.save();
      const buffer = new ArrayBuffer(bytes.byteLength); new Uint8Array(buffer).set(bytes);
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      const anchor = window.document.createElement('a'); anchor.href = url; anchor.download = `${file.name.replace(/\.pdf$/i, '') || 'document'}-edited.pdf`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStatus(`Done. Downloaded an edited copy with ${edits.length} text edit${edits.length === 1 ? '' : 's'}.`);
      trackToolEvent('tool_success', { toolId, fileType: 'pdf', outputType: 'pdf', metadata: { mode: 'smart-edit', edits: edits.length } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create the edited PDF.'; setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode: 'smart-edit', message } });
    } finally { setBusy(false); }
  }

  function reset() {
    pdfRef.current?.destroy?.(); pdfRef.current = null; setFile(null); setPages([]); setPageNumber(1); setSelectedId(null); setProgress(0);
    setStatus('Choose a PDF. DOC321 will use embedded PDF text first and OCR scanned pages automatically.');
    if (fileInput.current) fileInput.current.value = '';
  }

  return <div className="smart-pdf-editor">
    <style>{`.smart-pdf-editor{display:grid;gap:14px}.spe-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:24px;text-align:center;background:#f8fafd}.spe-drop>svg{width:44px;height:44px;color:#0b57d0}.spe-drop h2{margin:8px 0 5px}.spe-drop p{margin:0 auto 14px;color:#5f6368;max-width:720px}.spe-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.spe-btn{border:1px solid #d4d9e1;background:#fff;border-radius:10px;padding:9px 13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;color:#202124}.spe-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.spe-btn.success{background:#137333;color:#fff;border-color:#137333}.spe-btn.active{background:#e8f0fe;border-color:#8ab4f8;color:#174ea6}.spe-btn:disabled{opacity:.45;cursor:not-allowed}.spe-select,.spe-number,.spe-color{height:36px;border:1px solid #cfd5dd;border-radius:8px;background:#fff;padding:0 9px}.spe-number{width:72px}.spe-color{width:42px;padding:3px}.spe-file,.spe-nav,.spe-style,.spe-status{display:flex;align-items:center;gap:9px;flex-wrap:wrap;border:1px solid #e0e3e7;border-radius:13px;padding:11px 13px;background:#fff}.spe-file,.spe-nav{justify-content:space-between}.spe-file small{display:block;color:#5f6368;margin-top:2px}.spe-style label{font-size:11px;font-weight:800;color:#5f6368;text-transform:uppercase}.spe-detail{margin-left:auto;color:#5f6368;font-size:12px}.spe-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#f1f3f4;font-size:11px;font-weight:700}.spe-workspace{overflow:auto;max-height:76vh;background:#e9edf3;border:1px solid #dfe3e8;border-radius:14px;padding:20px}.spe-page{position:relative;margin:auto;background:#fff;box-shadow:0 5px 24px rgba(60,64,67,.22)}.spe-page canvas,.spe-layer{position:absolute;inset:0}.spe-box{position:absolute;box-sizing:border-box;padding:0 1px;border:1px solid transparent;outline:0;white-space:pre-wrap;line-height:1.05;cursor:text;overflow:visible}.spe-box:hover{border-color:rgba(11,87,208,.4)}.spe-box[data-selected='true']{border:1.5px solid #0b57d0;box-shadow:0 0 0 2px rgba(11,87,208,.12);z-index:3}.spe-status{font-size:13px;color:#5f6368}.spe-progress{height:7px;border-radius:999px;background:#e8eaed;overflow:hidden;flex:1;min-width:180px}.spe-progress span{display:block;height:100%;background:#0b57d0}.spe-note{font-size:11px;color:#6b7280;margin-top:-4px}@media(max-width:720px){.spe-drop{padding:18px 12px}.spe-file,.spe-nav{align-items:flex-start;flex-direction:column}.spe-style{overflow-x:auto;flex-wrap:nowrap}.spe-detail{margin-left:0;white-space:nowrap}.spe-workspace{padding:8px;max-height:70vh}}`}</style>
    <input ref={fileInput} hidden type="file" accept="application/pdf,.pdf" onChange={(event) => void chooseFile(event.target.files)} />
    <div className="spe-drop"><ScanText/><h2>Smart OCR PDF Editor</h2><p>DOC321 reads real PDF text objects first for the most accurate position, font metadata and size. If a page is scanned, it automatically switches to high-resolution OCR and turns the recognized text into editable regions.</p><div className="spe-actions"><select className="spe-select" value={language} disabled={busy || Boolean(file)} onChange={(event)=>setLanguage(event.target.value)}><option value="eng">English OCR</option><option value="fra">French OCR</option><option value="spa">Spanish OCR</option><option value="deu">German OCR</option><option value="hin">Hindi OCR</option></select><button className="spe-btn primary" type="button" disabled={busy} onClick={()=>fileInput.current?.click()}><FileUp size={16}/>{file?'Choose another PDF':'Choose PDF'}</button></div><div className="spe-note">Digital PDFs preserve font metadata best. On scanned pages, OCR estimates size, position and color; font family and some styling stay editable so you can correct them before export.</div></div>
    {busy && progress < 100 ? <div className="spe-status"><LoaderCircle size={16}/><span>{status}</span><div className="spe-progress"><span style={{width:`${progress}%`}}/></div><strong>{progress}%</strong></div> : null}
    {file ? <><div className="spe-file"><div><strong>{file.name}</strong><small>{formatBytes(file.size)} · {pages.length || '...'} pages · {editCount} edited region{editCount===1?'':'s'}</small></div><div className="spe-actions"><button className="spe-btn" type="button" onClick={reset} disabled={busy}><Trash2 size={15}/>Reset</button><button className="spe-btn success" type="button" onClick={()=>void exportPdf()} disabled={busy||editCount===0}><Download size={15}/>Download edited PDF</button></div></div>
    {page ? <><div className="spe-nav"><div className="spe-actions"><button className="spe-btn" type="button" disabled={busy||pageNumber<=1} onClick={()=>{setSelectedId(null);setPageNumber((n)=>n-1)}}><ChevronLeft size={15}/>Previous</button><strong>Page {pageNumber} of {pages.length}</strong><button className="spe-btn" type="button" disabled={busy||pageNumber>=pages.length} onClick={()=>{setSelectedId(null);setPageNumber((n)=>n+1)}}>Next<ChevronRight size={15}/></button></div><span className="spe-badge"><FileSearch size={14}/>{page.source==='native'?'PDF text metadata':'OCR'}{page.confidence!=null?` · ${Math.round(page.confidence)}%`:''}</span></div>
    <div className="spe-style"><label>Font</label><select className="spe-select" disabled={!selected} value={selected?.fontFamily||'Arial'} onChange={(event)=>selected&&patchBox(selected.id,{fontFamily:event.target.value})}>{FONT_CHOICES.map((font)=><option key={font}>{font}</option>)}</select><label>Size</label><input className="spe-number" disabled={!selected} type="number" min="4" max="96" step="0.5" value={selected?Number(selected.fontSize.toFixed(1)):12} onChange={(event)=>selected&&patchBox(selected.id,{fontSize:clamp(Number(event.target.value)||selected.fontSize,4,96)})}/><button className={`spe-btn ${selected?.bold?'active':''}`} type="button" disabled={!selected} onClick={()=>selected&&patchBox(selected.id,{bold:!selected.bold})}><Bold size={15}/></button><button className={`spe-btn ${selected?.italic?'active':''}`} type="button" disabled={!selected} onClick={()=>selected&&patchBox(selected.id,{italic:!selected.italic})}><Italic size={15}/></button><label>Color</label><input className="spe-color" disabled={!selected} type="color" value={selected?.color||'#202124'} onChange={(event)=>selected&&patchBox(selected.id,{color:event.target.value})}/><button className="spe-btn" type="button" disabled={!selected||!changed(selected)} onClick={resetSelected}><RotateCcw size={15}/>Reset</button><span className="spe-detail">{selected?`${selected.source==='native'?'PDF metadata':'OCR estimate'} · ${selected.confidence!=null?`${Math.round(selected.confidence)}% · `:''}${selected.width.toFixed(1)}×${selected.height.toFixed(1)} pt`:'Click a text region to edit'}</span></div>
    <div className="spe-workspace"><div className="spe-page" style={{width:page.width*DISPLAY_SCALE,height:page.height*DISPLAY_SCALE}}><canvas ref={canvasRef}/><div className="spe-layer">{page.boxes.map((box)=><div key={box.id} className="spe-box" data-selected={selectedId===box.id?'true':'false'} contentEditable suppressContentEditableWarning spellCheck onFocus={()=>setSelectedId(box.id)} onMouseDown={(event)=>{event.stopPropagation();setSelectedId(box.id)}} onInput={(event)=>patchBox(box.id,{text:event.currentTarget.innerText.replace(/\n$/,'')})} style={{left:box.x*DISPLAY_SCALE,top:box.top*DISPLAY_SCALE,width:Math.max(12,box.width*DISPLAY_SCALE),minHeight:Math.max(8,box.height*DISPLAY_SCALE),fontFamily:`${box.fontFamily}, Arial, sans-serif`,fontSize:box.fontSize*DISPLAY_SCALE,fontWeight:box.bold?700:400,fontStyle:box.italic?'italic':'normal',color:box.color,backgroundColor:box.background}}>{box.text}</div>)}</div></div></div></> : null}
    <div className="spe-status"><span>{status}</span></div></> : null}
  </div>;
}
