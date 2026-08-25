'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileSignature, FileUp, Hash, RefreshCw, Stamp } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type PdfStampMode = 'sign-pdf' | 'watermark-pdf' | 'number-pdf-pages';
type PageSize = { width: number; height: number };
type DownloadState = { name: string; url: string; size: number } | null;
type Position = 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-center' | 'top-right' | 'center';

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function place(page: PageSize, objectWidth: number, objectHeight: number, position: Position, padding = 36) {
  const centerX = Math.max(padding, (page.width - objectWidth) / 2);
  const centerY = Math.max(padding, (page.height - objectHeight) / 2);
  const left = padding;
  const right = Math.max(padding, page.width - objectWidth - padding);
  const bottom = padding;
  const top = Math.max(padding, page.height - objectHeight - padding);
  switch (position) {
    case 'bottom-left': return { x: left, y: bottom };
    case 'bottom-center': return { x: centerX, y: bottom };
    case 'bottom-right': return { x: right, y: bottom };
    case 'top-left': return { x: left, y: top };
    case 'top-center': return { x: centerX, y: top };
    case 'top-right': return { x: right, y: top };
    default: return { x: centerX, y: centerY };
  }
}

async function imageRatio(file: File): Promise<number> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The signature image could not be decoded.'));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('The signature image has invalid dimensions.');
    return image.naturalWidth / image.naturalHeight;
  } finally { URL.revokeObjectURL(url); }
}

export function PdfStampInterface({ mode, toolId }: { mode: PdfStampMode; toolId: string }) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageSize[]>([]);
  const [signature, setSignature] = useState<File | null>(null);
  const [signatureRatio, setSignatureRatio] = useState(2.5);
  const [signaturePage, setSignaturePage] = useState(1);
  const [signatureWidth, setSignatureWidth] = useState(150);
  const [signaturePosition, setSignaturePosition] = useState<Position>('bottom-right');
  const [watermark, setWatermark] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.18);
  const [watermarkSize, setWatermarkSize] = useState(42);
  const [numberPosition, setNumberPosition] = useState<Position>('bottom-center');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a PDF file to begin.');
  const [download, setDownload] = useState<DownloadState>(null);

  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);

  function setOutput(name: string, blob: Blob) {
    if (download) URL.revokeObjectURL(download.url);
    setDownload({ name, url: URL.createObjectURL(blob), size: blob.size });
  }

  async function choosePdf(list: FileList | null) {
    const next = list?.[0];
    if (!next) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) { setStatus('Please choose a PDF file.'); return; }
    setBusy(true); setStatus('Reading PDF pages…');
    if (download) { URL.revokeObjectURL(download.url); setDownload(null); }
    try {
      const pdfLib = await import('pdf-lib');
      const document = await pdfLib.PDFDocument.load(await next.arrayBuffer());
      const pageSizes = document.getPages().map((page) => ({ width: page.getWidth(), height: page.getHeight() }));
      if (!pageSizes.length) throw new Error('The PDF has no pages.');
      setFile(next); setPages(pageSizes); setSignaturePage(1);
      setStatus(`${pageSizes.length} ${pageSizes.length === 1 ? 'page' : 'pages'} ready.`);
      trackToolEvent('tool_start', { toolId, fileType: 'pdf', metadata: { pageCount: pageSizes.length } });
    } catch (error) {
      setFile(null); setPages([]); setStatus(error instanceof Error ? error.message : 'Could not read this PDF.');
    } finally { setBusy(false); }
  }

  async function chooseSignature(list: FileList | null) {
    const next = list?.[0];
    if (!next) return;
    const valid = next.type === 'image/png' || next.type === 'image/jpeg' || /\.(?:png|jpe?g)$/i.test(next.name);
    if (!valid) { setStatus('Choose a PNG, JPG, or JPEG signature image.'); return; }
    try { setSignatureRatio(await imageRatio(next)); setSignature(next); setStatus('Signature image ready.'); }
    catch (error) { setSignature(null); setStatus(error instanceof Error ? error.message : 'Could not read the signature image.'); }
  }

  function reset() {
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null); setFile(null); setPages([]); setSignature(null); setSignaturePage(1); setStatus('Choose a PDF file to begin.');
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  }

  async function run() {
    if (!file || !pages.length || busy) return;
    if (mode === 'sign-pdf' && !signature) { setStatus('Choose a signature image first.'); return; }
    if (mode === 'watermark-pdf' && !watermark.trim()) { setStatus('Enter watermark text first.'); return; }
    setBusy(true); setStatus('Creating the updated PDF in your browser…');
    if (download) { URL.revokeObjectURL(download.url); setDownload(null); }
    try {
      const { pdfEditorProcessor } = await import('@/tools/pdf');
      let operations: any[] = [];
      let suffix = 'updated';
      if (mode === 'sign-pdf' && signature) {
        const pageIndex = Math.min(pages.length, Math.max(1, signaturePage)) - 1;
        const page = pages[pageIndex];
        const width = Math.min(signatureWidth, Math.max(60, page.width - 72));
        const height = Math.max(24, width / signatureRatio);
        const point = place(page, width, height, signaturePosition);
        operations = [{ type: 'add-signature', page: pageIndex + 1, data: new Uint8Array(await signature.arrayBuffer()), x: point.x, y: point.y, width, height, opacity: 1 }];
        suffix = 'signed';
      } else if (mode === 'watermark-pdf') {
        operations = pages.map((page, index) => {
          const estimatedWidth = Math.min(page.width * 0.7, Math.max(80, watermark.trim().length * watermarkSize * 0.52));
          const point = place(page, estimatedWidth, watermarkSize, 'center');
          return { type: 'add-text', page: index + 1, x: point.x, y: point.y, text: watermark.trim(), fontSize: watermarkSize, opacity: watermarkOpacity, color: { r: 0.35, g: 0.35, b: 0.35 } };
        });
        suffix = 'watermarked';
      } else {
        operations = pages.map((page, index) => {
          const text = String(index + 1);
          const estimatedWidth = Math.max(8, text.length * 7);
          const point = place(page, estimatedWidth, 12, numberPosition, 24);
          return { type: 'add-text', page: index + 1, x: point.x, y: point.y, text, fontSize: 11, opacity: 1, color: { r: 0.2, g: 0.2, b: 0.2 } };
        });
        suffix = 'numbered';
      }
      const result = await pdfEditorProcessor.process(file as never, { operations });
      if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'PDF update failed.');
      const name = `${file.name.replace(/\.pdf$/i, '') || 'document'}-${suffix}.pdf`;
      setOutput(name, result.output.blob);
      setStatus(`Done. Updated ${result.pageCount ?? pages.length} ${pages.length === 1 ? 'page' : 'pages'}.`);
      trackToolEvent('tool_success', { toolId, fileType: 'pdf', outputType: 'pdf', metadata: { mode, pageCount: pages.length } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF update failed.';
      setStatus(message); trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode, message } });
    } finally { setBusy(false); }
  }

  const icon = mode === 'sign-pdf' ? <FileSignature /> : mode === 'watermark-pdf' ? <Stamp /> : <Hash />;
  const actionLabel = mode === 'sign-pdf' ? 'Sign PDF' : mode === 'watermark-pdf' ? 'Add watermark' : 'Add page numbers';

  return <div className="pdf-stamp-tool">
    <style>{`
      .pdf-stamp-tool{display:grid;gap:15px}.pst-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:26px;text-align:center;background:#f8fafd}.pst-drop>svg{width:44px;height:44px;color:#0b57d0}.pst-drop h2{margin:9px 0 5px;font-size:21px}.pst-drop p{margin:0 0 14px;color:#5f6368}.pst-btn{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:10px 15px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.pst-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.pst-btn.success{background:#137333;border-color:#137333;color:#fff}.pst-btn:disabled{opacity:.45;cursor:not-allowed}.pst-file,.pst-output{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e0e3e7;border-radius:13px;padding:12px 14px;background:#fff}.pst-file span,.pst-output span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.pst-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;border:1px solid #e0e3e7;border-radius:14px;padding:14px}.pst-field label{display:block;font-size:12px;font-weight:700;margin-bottom:5px}.pst-field input,.pst-field select{width:100%;box-sizing:border-box;border:1px solid #d4d9e1;border-radius:10px;padding:9px 11px;background:#fff}.pst-field.full{grid-column:1/-1}.pst-status{color:#5f6368;font-size:13px;line-height:1.5}.pst-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.pst-output{border-color:#cde3d3;background:#f4faf6}@media(max-width:650px){.pst-drop{padding:20px 12px}.pst-controls{grid-template-columns:1fr}.pst-field.full{grid-column:auto}.pst-file,.pst-output{align-items:flex-start;flex-direction:column}}
    `}</style>
    <input ref={pdfInputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event)=>void choosePdf(event.target.files)}/>
    <input ref={signatureInputRef} hidden type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" onChange={(event)=>void chooseSignature(event.target.files)}/>
    <div className="pst-drop">{icon}<h2>{actionLabel}</h2><p>Choose a PDF and create a new updated copy in your browser without changing the original.</p><button className="pst-btn primary" type="button" onClick={()=>pdfInputRef.current?.click()} disabled={busy}><FileUp size={16}/>{file?'Choose another PDF':'Choose PDF'}</button></div>
    {file?<div className="pst-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)} · {pages.length} {pages.length===1?'page':'pages'}</span></div><button className="pst-btn" type="button" onClick={reset} disabled={busy}><RefreshCw size={15}/>Reset</button></div>:null}
    {file&&mode==='sign-pdf'?<div className="pst-controls"><div className="pst-field full"><label>Signature image</label><button className="pst-btn" type="button" onClick={()=>signatureInputRef.current?.click()} disabled={busy}><FileSignature size={15}/>{signature?signature.name:'Choose PNG or JPG signature'}</button></div><div className="pst-field"><label htmlFor={`${toolId}-page`}>Page</label><input id={`${toolId}-page`} type="number" min={1} max={pages.length} value={signaturePage} onChange={(event)=>setSignaturePage(Number(event.target.value))}/></div><div className="pst-field"><label htmlFor={`${toolId}-position`}>Position</label><select id={`${toolId}-position`} value={signaturePosition} onChange={(event)=>setSignaturePosition(event.target.value as Position)}><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="top-right">Top right</option><option value="top-left">Top left</option><option value="center">Center</option></select></div><div className="pst-field full"><label htmlFor={`${toolId}-width`}>Signature width: {signatureWidth} pt</label><input id={`${toolId}-width`} type="range" min={80} max={260} value={signatureWidth} onChange={(event)=>setSignatureWidth(Number(event.target.value))}/></div></div>:null}
    {file&&mode==='watermark-pdf'?<div className="pst-controls"><div className="pst-field full"><label htmlFor={`${toolId}-text`}>Watermark text</label><input id={`${toolId}-text`} value={watermark} maxLength={80} onChange={(event)=>setWatermark(event.target.value)}/></div><div className="pst-field"><label htmlFor={`${toolId}-opacity`}>Opacity: {Math.round(watermarkOpacity*100)}%</label><input id={`${toolId}-opacity`} type="range" min={0.08} max={0.5} step={0.02} value={watermarkOpacity} onChange={(event)=>setWatermarkOpacity(Number(event.target.value))}/></div><div className="pst-field"><label htmlFor={`${toolId}-size`}>Text size: {watermarkSize}</label><input id={`${toolId}-size`} type="range" min={20} max={72} value={watermarkSize} onChange={(event)=>setWatermarkSize(Number(event.target.value))}/></div></div>:null}
    {file&&mode==='number-pdf-pages'?<div className="pst-controls"><div className="pst-field full"><label htmlFor={`${toolId}-number-position`}>Page number position</label><select id={`${toolId}-number-position`} value={numberPosition} onChange={(event)=>setNumberPosition(event.target.value as Position)}><option value="bottom-center">Bottom center</option><option value="bottom-right">Bottom right</option><option value="bottom-left">Bottom left</option><option value="top-center">Top center</option><option value="top-right">Top right</option><option value="top-left">Top left</option></select></div></div>:null}
    <div className="pst-actions"><button className="pst-btn primary" type="button" onClick={()=>void run()} disabled={!file||busy||(mode==='sign-pdf'&&!signature)}>{busy?'Processing…':actionLabel}</button><span className="pst-status" aria-live="polite">{status}</span></div>
    {download?<div className="pst-output"><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div><a className="pst-btn success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:'pdf'})}><Download size={16}/>Download PDF</a></div>:null}
  </div>;
}
