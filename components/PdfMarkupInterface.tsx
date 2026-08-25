'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileUp, Highlighter, Redo2, Square, TextCursorInput, Trash2, Undo2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import type { PdfEditorOperation } from '@/tools/pdf';

export type PdfMarkupMode = 'edit-pdf' | 'pdf-annotator';
type ToolMode = 'text' | 'highlight' | 'rectangle';
type DownloadState = { name: string; url: string; size: number } | null;
type DragState = { x: number; y: number } | null;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function PdfMarkupInterface({ mode, toolId }: { mode: PdfMarkupMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const renderScaleRef = useRef(1.2);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [tool, setTool] = useState<ToolMode>(mode === 'pdf-annotator' ? 'highlight' : 'text');
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [operations, setOperations] = useState<PdfEditorOperation[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a PDF file to begin.');
  const [download, setDownload] = useState<DownloadState>(null);
  const [drag, setDrag] = useState<DragState>(null);

  useEffect(() => () => {
    if (download) URL.revokeObjectURL(download.url);
    pdfRef.current?.destroy?.();
  }, [download]);

  function clearDownload() {
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null);
  }

  async function drawPreview(pdf: any, pageNo: number, ops = operations) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const page = await pdf.getPage(pageNo);
    const scale = renderScaleRef.current;
    const viewport = page.getViewport({ scale });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not create PDF preview canvas.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;

    for (const op of ops) {
      if (!('page' in op) || op.page !== pageNo) continue;
      if (op.type === 'add-text') {
        context.save();
        context.fillStyle = '#1f1f1f';
        context.font = `${(op.fontSize ?? 12) * scale}px Arial`;
        context.fillText(op.text, op.x * scale, canvas.height - op.y * scale);
        context.restore();
      } else if (op.type === 'highlight') {
        context.save();
        context.fillStyle = 'rgba(255,235,59,.35)';
        context.fillRect(op.x * scale, canvas.height - (op.y + op.height) * scale, op.width * scale, op.height * scale);
        context.restore();
      } else if (op.type === 'add-shape' && op.shape === 'rectangle') {
        context.save();
        context.strokeStyle = '#1a73e8';
        context.lineWidth = Math.max(1, (op.borderWidth ?? 2) * scale);
        context.strokeRect(op.x * scale, canvas.height - (op.y + (op.height ?? 0)) * scale, (op.width ?? 0) * scale, (op.height ?? 0) * scale);
        context.restore();
      }
    }
  }

  async function chooseFile(files: FileList | null) {
    const next = files?.[0];
    if (!next) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) {
      setStatus('Please choose a PDF file.');
      return;
    }
    setBusy(true);
    clearDownload();
    setStatus('Opening PDF…');
    try {
      pdfRef.current?.destroy?.();
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await next.arrayBuffer()) }).promise;
      pdfRef.current = pdf;
      setFile(next);
      setPageCount(pdf.numPages);
      setPageNumber(1);
      setOperations([]);
      await drawPreview(pdf, 1, []);
      setStatus(`Opened ${pdf.numPages} ${pdf.numPages === 1 ? 'page' : 'pages'}. Choose a markup tool.`);
      trackToolEvent('tool_start', { toolId, fileType: 'pdf', metadata: { mode, pageCount: pdf.numPages } });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not open the PDF.');
      setFile(null);
      setPageCount(0);
    } finally {
      setBusy(false);
    }
  }

  async function changePage(next: number) {
    if (!pdfRef.current || next < 1 || next > pageCount || busy) return;
    setBusy(true);
    try {
      setPageNumber(next);
      await drawPreview(pdfRef.current, next);
      setStatus(`Page ${next} of ${pageCount}.`);
    } finally {
      setBusy(false);
    }
  }

  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  async function appendOperation(op: PdfEditorOperation) {
    const next = [...operations, op];
    setOperations(next);
    clearDownload();
    if (pdfRef.current) await drawPreview(pdfRef.current, pageNumber, next);
    setStatus(`${next.length} ${next.length === 1 ? 'change' : 'changes'} queued. Use Undo or export the PDF.`);
  }

  async function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!file || busy) return;
    const point = canvasPoint(event);
    if (tool === 'text') {
      if (!text.trim()) {
        setStatus('Enter text first, then click the page where it should appear.');
        return;
      }
      const scale = renderScaleRef.current;
      await appendOperation({ type: 'add-text', page: pageNumber, x: point.x / scale, y: (canvasRef.current!.height - point.y) / scale, text: text.trim(), fontSize });
      return;
    }
    setDrag(point);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  async function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag || tool === 'text') return;
    const end = canvasPoint(event);
    setDrag(null);
    const canvas = canvasRef.current!;
    const scale = renderScaleRef.current;
    const left = Math.min(drag.x, end.x);
    const right = Math.max(drag.x, end.x);
    const top = Math.min(drag.y, end.y);
    const bottom = Math.max(drag.y, end.y);
    const width = (right - left) / scale;
    const height = (bottom - top) / scale;
    if (width < 4 || height < 4) {
      setStatus('Drag across a larger area.');
      return;
    }
    const x = left / scale;
    const y = (canvas.height - bottom) / scale;
    if (tool === 'highlight') {
      await appendOperation({ type: 'highlight', page: pageNumber, x, y, width, height, opacity: 0.35 });
    } else {
      await appendOperation({ type: 'add-shape', shape: 'rectangle', page: pageNumber, x, y, width, height, borderWidth: 2, color: { r: 0.1, g: 0.45, b: 0.9 }, opacity: 1 });
    }
  }

  async function undo() {
    if (!operations.length || busy) return;
    const next = operations.slice(0, -1);
    setOperations(next);
    clearDownload();
    if (pdfRef.current) await drawPreview(pdfRef.current, pageNumber, next);
    setStatus(next.length ? `${next.length} changes remain.` : 'All queued changes removed.');
  }

  async function clearAll() {
    setOperations([]);
    clearDownload();
    if (pdfRef.current) await drawPreview(pdfRef.current, pageNumber, []);
    setStatus('All queued changes removed.');
  }

  async function exportPdf() {
    if (!file || !operations.length || busy) return;
    setBusy(true);
    clearDownload();
    setStatus('Applying changes to a new PDF…');
    try {
      const { pdfEditorProcessor } = await import('@/tools/pdf');
      const result = await pdfEditorProcessor.process(file as never, { operations });
      if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'PDF editing failed.');
      const name = `${file.name.replace(/\.pdf$/i, '') || 'document'}-${mode === 'pdf-annotator' ? 'annotated' : 'edited'}.pdf`;
      const url = URL.createObjectURL(result.output.blob);
      setDownload({ name, url, size: result.output.size });
      setStatus(`Done. Applied ${result.operationsApplied} ${result.operationsApplied === 1 ? 'change' : 'changes'}.`);
      trackToolEvent('tool_success', { toolId, fileType: 'pdf', outputType: 'pdf', metadata: { mode, operations: result.operationsApplied } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF editing failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode, message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    clearDownload();
    pdfRef.current?.destroy?.();
    pdfRef.current = null;
    setFile(null);
    setPageCount(0);
    setPageNumber(1);
    setOperations([]);
    setStatus('Choose a PDF file to begin.');
    const canvas = canvasRef.current;
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    if (inputRef.current) inputRef.current.value = '';
  }

  return <div className="pdf-markup-tool">
    <style>{`
      .pdf-markup-tool{display:grid;gap:14px}.pm-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:24px;text-align:center;background:#f8fafd}.pm-drop svg{width:44px;height:44px;color:#0b57d0}.pm-drop h2{margin:8px 0 5px}.pm-drop p{margin:0 0 14px;color:#5f6368}.pm-btn{border:1px solid #d4d9e1;background:#fff;border-radius:22px;padding:9px 14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none;color:#202124}.pm-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.pm-btn.success{background:#137333;color:#fff;border-color:#137333}.pm-btn.active{background:#e8f0fe;border-color:#8ab4f8;color:#174ea6}.pm-btn:disabled{opacity:.45;cursor:not-allowed}.pm-file,.pm-toolbar,.pm-actions,.pm-output{display:flex;align-items:center;gap:9px;flex-wrap:wrap;border:1px solid #e0e3e7;border-radius:13px;padding:11px 13px;background:#fff}.pm-file{justify-content:space-between}.pm-file span{display:block;color:#5f6368;font-size:12px}.pm-toolbar label{font-size:12px;font-weight:700}.pm-text{border:1px solid #d4d9e1;border-radius:9px;padding:8px 10px;min-width:220px}.pm-number{width:72px;border:1px solid #d4d9e1;border-radius:9px;padding:8px}.pm-canvas-wrap{overflow:auto;max-height:72vh;background:#eef1f5;border:1px solid #dfe3e8;border-radius:14px;padding:16px;text-align:center}.pm-canvas-wrap canvas{display:inline-block;background:#fff;box-shadow:0 5px 24px rgba(60,64,67,.18);cursor:crosshair;touch-action:none}.pm-pagebar{display:flex;justify-content:center;align-items:center;gap:8px}.pm-status{font-size:13px;color:#5f6368}.pm-output{justify-content:space-between;background:#f4faf6;border-color:#cde3d3}.pm-output span{display:block;font-size:11px;color:#5f6368}@media(max-width:650px){.pm-drop{padding:19px 12px}.pm-file,.pm-output{align-items:flex-start;flex-direction:column}.pm-text{min-width:0;width:100%}.pm-canvas-wrap{padding:7px}}
    `}</style>
    <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event)=>void chooseFile(event.target.files)} />
    <div className="pm-drop"><FileUp/><h2>{mode==='pdf-annotator'?'Annotate a PDF':'Edit a PDF'}</h2><p>{mode==='pdf-annotator'?'Highlight passages, add text notes, and draw boxes directly on PDF pages.':'Add text, highlights, and rectangle overlays to a PDF while previewing each page.'}</p><button className="pm-btn primary" type="button" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{file?'Choose another PDF':'Choose PDF'}</button></div>
    {file?<><div className="pm-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)} · {pageCount} pages</span></div><button className="pm-btn" type="button" onClick={reset} disabled={busy}><Trash2 size={15}/>Reset</button></div>
    <div className="pm-toolbar">
      <button className={`pm-btn ${tool==='text'?'active':''}`} type="button" onClick={()=>setTool('text')}><TextCursorInput size={15}/>Text</button>
      <button className={`pm-btn ${tool==='highlight'?'active':''}`} type="button" onClick={()=>setTool('highlight')}><Highlighter size={15}/>Highlight</button>
      <button className={`pm-btn ${tool==='rectangle'?'active':''}`} type="button" onClick={()=>setTool('rectangle')}><Square size={15}/>Box</button>
      {tool==='text'?<><label htmlFor={`${toolId}-text`}>Text</label><input id={`${toolId}-text`} className="pm-text" value={text} onChange={(event)=>setText(event.target.value)} placeholder="Type text, then click the page"/><label htmlFor={`${toolId}-size`}>Size</label><input id={`${toolId}-size`} className="pm-number" type="number" min="8" max="72" value={fontSize} onChange={(event)=>setFontSize(Math.min(72,Math.max(8,Number(event.target.value)||16)))}/></>:null}
      <button className="pm-btn" type="button" disabled={!operations.length||busy} onClick={()=>void undo()}><Undo2 size={15}/>Undo</button>
      <button className="pm-btn" type="button" disabled={!operations.length||busy} onClick={()=>void clearAll()}><Redo2 size={15}/>Clear changes</button>
    </div>
    <div className="pm-pagebar"><button className="pm-btn" type="button" disabled={busy||pageNumber<=1} onClick={()=>void changePage(pageNumber-1)}><ChevronLeft size={15}/>Previous</button><span>Page {pageNumber} of {pageCount}</span><button className="pm-btn" type="button" disabled={busy||pageNumber>=pageCount} onClick={()=>void changePage(pageNumber+1)}>Next<ChevronRight size={15}/></button></div>
    <div className="pm-canvas-wrap"><canvas ref={canvasRef} onPointerDown={(event)=>void onPointerDown(event)} onPointerUp={(event)=>void onPointerUp(event)} /></div>
    <div className="pm-actions"><button className="pm-btn primary" type="button" disabled={busy||!operations.length} onClick={()=>void exportPdf()}>{busy?'Creating PDF…':mode==='pdf-annotator'?'Create Annotated PDF':'Create Edited PDF'}</button><span>{operations.length} queued {operations.length===1?'change':'changes'}</span></div></>:<canvas ref={canvasRef} hidden/>}
    <div className="pm-status" role="status">{status}</div>
    {download?<div className="pm-output"><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div><a className="pm-btn success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:'pdf'})}><Download size={16}/>Download PDF</a></div>:null}
  </div>;
}
