'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileOutput, FileUp, RotateCcw, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type PdfPageOperationMode = 'rotate-pdf' | 'delete-pdf-pages' | 'extract-pdf-pages' | 'organize-pdf';

type PageSelection = { pages: number[]; error: string | null };

type DownloadState = { name: string; url: string; size: number } | null;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function parsePageSelection(value: string, pageCount: number, allowAll = false): PageSelection {
  const normalized = value.trim().toLowerCase();
  if (allowAll && normalized === 'all') {
    return { pages: Array.from({ length: pageCount }, (_, index) => index + 1), error: null };
  }
  if (!normalized) return { pages: [], error: 'Enter one or more page numbers.' };
  const pages: number[] = [];
  for (const token of normalized.split(',').map((part) => part.trim()).filter(Boolean)) {
    const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(token);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (start < 1 || end < start || end > pageCount) return { pages: [], error: `Use page numbers between 1 and ${pageCount}.` };
      for (let page = start; page <= end; page += 1) pages.push(page);
      continue;
    }
    if (!/^\d+$/.test(token)) return { pages: [], error: 'Use page numbers such as 1,3,5-7.' };
    const page = Number(token);
    if (page < 1 || page > pageCount) return { pages: [], error: `Use page numbers between 1 and ${pageCount}.` };
    pages.push(page);
  }
  if (new Set(pages).size !== pages.length) return { pages: [], error: 'Do not include the same page more than once.' };
  return { pages, error: pages.length ? null : 'Enter one or more page numbers.' };
}

export function PdfPageOperationInterface({ mode, toolId }: { mode: PdfPageOperationMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectionText, setSelectionText] = useState(mode === 'rotate-pdf' ? 'all' : '1');
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a PDF file to begin.');
  const [download, setDownload] = useState<DownloadState>(null);

  const selection = useMemo(
    () => pageCount ? parsePageSelection(selectionText, pageCount, mode === 'rotate-pdf') : { pages: [], error: null },
    [mode, pageCount, selectionText],
  );

  const organizeValid = mode !== 'organize-pdf' || (
    !selection.error && selection.pages.length === pageCount && new Set(selection.pages).size === pageCount
  );

  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);

  function setOutput(name: string, blob: Blob) {
    if (download) URL.revokeObjectURL(download.url);
    setDownload({ name, url: URL.createObjectURL(blob), size: blob.size });
  }

  async function chooseFile(fileList: FileList | null) {
    const next = fileList?.[0];
    if (!next) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) {
      setStatus('Please choose a PDF file.');
      return;
    }
    setBusy(true);
    setStatus('Reading PDF pages…');
    if (download) { URL.revokeObjectURL(download.url); setDownload(null); }
    try {
      const pdfLib = await import('pdf-lib');
      const document = await pdfLib.PDFDocument.load(await next.arrayBuffer());
      const count = document.getPageCount();
      if (!count) throw new Error('The PDF has no pages.');
      setFile(next);
      setPageCount(count);
      if (mode === 'organize-pdf') setSelectionText(Array.from({ length: count }, (_, index) => index + 1).join(','));
      else if (mode === 'rotate-pdf') setSelectionText('all');
      else setSelectionText('1');
      setStatus(`${count} ${count === 1 ? 'page' : 'pages'} ready.`);
      trackToolEvent('tool_start', { toolId, fileType: 'pdf', metadata: { pageCount: count } });
    } catch (error) {
      setFile(null); setPageCount(0);
      setStatus(error instanceof Error ? error.message : 'Could not read this PDF.');
    } finally { setBusy(false); }
  }

  function reset() {
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null); setFile(null); setPageCount(0); setSelectionText(mode === 'rotate-pdf' ? 'all' : '1'); setStatus('Choose a PDF file to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function run() {
    if (!file || !pageCount || selection.error || !organizeValid || busy) return;
    if (mode === 'delete-pdf-pages' && selection.pages.length >= pageCount) {
      setStatus('At least one page must remain after deletion.');
      return;
    }
    setBusy(true); setStatus('Processing pages in your browser…');
    if (download) { URL.revokeObjectURL(download.url); setDownload(null); }
    try {
      const { pdfEditorProcessor } = await import('@/tools/pdf');
      const operation = mode === 'rotate-pdf'
        ? { type: 'rotate-pages' as const, pages: selection.pages, degrees: rotation }
        : mode === 'delete-pdf-pages'
          ? { type: 'delete-pages' as const, pages: selection.pages }
          : mode === 'extract-pdf-pages'
            ? { type: 'extract-pages' as const, pages: selection.pages }
            : { type: 'reorder-pages' as const, pages: selection.pages };
      const result = await pdfEditorProcessor.process(file as never, { operations: [operation] });
      if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'PDF operation failed.');
      const suffix = mode === 'rotate-pdf' ? 'rotated' : mode === 'delete-pdf-pages' ? 'pages-removed' : mode === 'extract-pdf-pages' ? 'extracted' : 'organized';
      const name = `${file.name.replace(/\.pdf$/i, '') || 'document'}-${suffix}.pdf`;
      setOutput(name, result.output.blob);
      setStatus(`Done. The new PDF has ${result.pageCount ?? 'the updated'} ${result.pageCount === 1 ? 'page' : 'pages'}.`);
      trackToolEvent('tool_success', { toolId, fileType: 'pdf', metadata: { mode, pageCount: result.pageCount } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF operation failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode, message } });
    } finally { setBusy(false); }
  }

  const label = mode === 'rotate-pdf' ? 'Rotate pages' : mode === 'delete-pdf-pages' ? 'Delete pages' : mode === 'extract-pdf-pages' ? 'Extract pages' : 'Reorder pages';
  const help = mode === 'organize-pdf'
    ? `Enter every page exactly once in the new order. Example: ${pageCount >= 4 ? '4,1,2,3' : '2,1'}`
    : mode === 'rotate-pdf'
      ? 'Enter all, a page number, or ranges such as 1,3,5-7.'
      : 'Enter page numbers or ranges such as 1,3,5-7.';

  return <div className="pdf-page-op">
    <style>{`
      .pdf-page-op{display:grid;gap:15px}.pdf-page-op-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:26px;text-align:center;background:#f8fafd}.pdf-page-op-drop svg{width:44px;height:44px;color:#0b57d0}.pdf-page-op-drop h2{margin:9px 0 5px;font-size:21px}.pdf-page-op-drop p{margin:0 0 14px;color:#5f6368}.pdf-page-op-button{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:10px 15px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.pdf-page-op-button.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.pdf-page-op-button.success{background:#137333;border-color:#137333;color:#fff}.pdf-page-op-button:disabled{opacity:.45;cursor:not-allowed}.pdf-page-op-file{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid #e0e3e7;border-radius:12px;padding:11px 13px}.pdf-page-op-file strong{display:block}.pdf-page-op-file span{display:block;color:#5f6368;font-size:11px;margin-top:2px}.pdf-page-op-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;border:1px solid #e0e3e7;border-radius:14px;padding:13px}.pdf-page-op-field label{display:block;font-size:12px;font-weight:700;margin-bottom:5px}.pdf-page-op-field input,.pdf-page-op-field select{width:100%;box-sizing:border-box;border:1px solid #d4d9e1;border-radius:10px;padding:9px 11px;background:#fff}.pdf-page-op-help{grid-column:1/-1;color:#5f6368;font-size:12px}.pdf-page-op-error{grid-column:1/-1;color:#b3261e;font-size:12px}.pdf-page-op-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.pdf-page-op-status{color:#5f6368;font-size:13px}.pdf-page-op-output{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid #cde3d3;background:#f4faf6;border-radius:14px;padding:13px}.pdf-page-op-output-main{display:flex;align-items:center;gap:9px;min-width:0}.pdf-page-op-output-main strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pdf-page-op-output-main span{display:block;color:#5f6368;font-size:11px;margin-top:2px}@media(max-width:650px){.pdf-page-op-drop{padding:20px 12px}.pdf-page-op-controls{grid-template-columns:1fr}.pdf-page-op-output,.pdf-page-op-file{align-items:flex-start;flex-direction:column}}
    `}</style>
    <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event)=>void chooseFile(event.target.files)} />
    <div className="pdf-page-op-drop"><FileUp/><h2>Choose a PDF file</h2><p>Read the page count, choose the pages, and create a new PDF without changing the original.</p><button type="button" className="pdf-page-op-button primary" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{file?'Choose again':'Choose PDF'}</button></div>
    {file?<div className="pdf-page-op-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)} · {pageCount} {pageCount===1?'page':'pages'}</span></div><button type="button" className="pdf-page-op-button" disabled={busy} onClick={reset}><Trash2 size={15}/>Clear</button></div>:null}
    {file?<div className="pdf-page-op-controls"><div className="pdf-page-op-field"><label htmlFor={`${toolId}-pages`}>{mode==='organize-pdf'?'New page order':'Pages'}</label><input id={`${toolId}-pages`} value={selectionText} onChange={(event)=>setSelectionText(event.target.value)} disabled={busy} placeholder={mode==='rotate-pdf'?'all or 1,3,5-7':'1,3,5-7'}/></div>{mode==='rotate-pdf'?<div className="pdf-page-op-field"><label htmlFor={`${toolId}-rotation`}>Rotation</label><select id={`${toolId}-rotation`} value={rotation} onChange={(event)=>setRotation(Number(event.target.value) as 90|180|270)} disabled={busy}><option value={90}>90° clockwise</option><option value={180}>180°</option><option value={270}>270° clockwise</option></select></div>:<div/>}<div className="pdf-page-op-help">{help}</div>{selection.error?<div className="pdf-page-op-error">{selection.error}</div>:null}{mode==='organize-pdf'&&!organizeValid&&!selection.error?<div className="pdf-page-op-error">The new order must contain every page exactly once.</div>:null}</div>:null}
    <div className="pdf-page-op-actions"><button type="button" className="pdf-page-op-button primary" disabled={!file||busy||Boolean(selection.error)||!organizeValid} onClick={()=>void run()}>{busy?<RotateCcw size={16}/>:<FileOutput size={16}/>} {busy?'Processing…':label}</button><span className="pdf-page-op-status" aria-live="polite">{status}</span></div>
    {download?<div className="pdf-page-op-output"><div className="pdf-page-op-output-main"><FileOutput size={20}/><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div></div><a className="pdf-page-op-button success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:'pdf'})}><Download size={16}/>Download PDF</a></div>:null}
  </div>;
}
