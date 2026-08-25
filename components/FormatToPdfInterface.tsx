'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, FileOutput, FileUp, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type FormatToPdfMode = 'jpg-to-pdf' | 'png-to-pdf' | 'html-to-pdf' | 'excel-to-pdf';

type DownloadState = { name: string; url: string; size: number } | null;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function FormatToPdfInterface({ mode, toolId }: { mode: FormatToPdfMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [htmlText, setHtmlText] = useState('');
  const [pageFormat, setPageFormat] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fit, setFit] = useState<'contain' | 'cover'>('contain');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a source file to begin.');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [download, setDownload] = useState<DownloadState>(null);

  const imageMode = mode === 'jpg-to-pdf' || mode === 'png-to-pdf';
  const htmlMode = mode === 'html-to-pdf';
  const ready = htmlMode ? Boolean(htmlText.trim() || files[0]) : imageMode ? files.length > 0 : files.length === 1;
  const accept = mode === 'jpg-to-pdf' ? 'image/jpeg,.jpg,.jpeg' : mode === 'png-to-pdf' ? 'image/png,.png' : mode === 'html-to-pdf' ? 'text/html,.html,.htm' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx';

  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);

  function setOutput(name: string, blob: Blob) {
    if (download) URL.revokeObjectURL(download.url);
    setDownload({ name, url: URL.createObjectURL(blob), size: blob.size });
  }

  function onFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = Array.from(fileList);
    setFiles(imageMode ? next : next.slice(0, 1));
    setWarnings([]);
    setStatus(next.length ? 'Ready to convert.' : 'Choose a source file to begin.');
    if (download) { URL.revokeObjectURL(download.url); setDownload(null); }
    trackToolEvent('tool_start', { toolId, fileType: mode, metadata: { fileCount: next.length } });
  }

  function reset() {
    if (download) URL.revokeObjectURL(download.url);
    setDownload(null); setFiles([]); setHtmlText(''); setWarnings([]); setStatus('Choose a source file to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    setFiles((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }

  async function run() {
    if (!ready || busy) return;
    setBusy(true); setWarnings([]); setStatus('Converting in your browser…');
    if (download) { URL.revokeObjectURL(download.url); setDownload(null); }
    try {
      const options = { pageFormat, orientation };
      if (mode === 'jpg-to-pdf' || mode === 'png-to-pdf') {
        const imageTools = await import('@/tools/image');
        const processor = mode === 'jpg-to-pdf' ? imageTools.jpgToPdfProcessor : imageTools.pngToPdfProcessor;
        const result = await processor.process(files as never, { ...options, margin: 24, fit });
        if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'Image to PDF conversion failed.');
        setOutput(result.output.name, result.output.blob);
        setWarnings(result.warnings);
        setStatus(`Created a ${result.pageCount}-page PDF from ${result.inputCount} ${result.inputCount === 1 ? 'image' : 'images'}.`);
      } else if (mode === 'html-to-pdf') {
        const htmlTools = await import('@/tools/html');
        const source = htmlText.trim() ? htmlText : files[0] as never;
        const result = await htmlTools.htmlToPdfProcessor.process(source as never, { ...options, margin: 12 });
        if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'HTML to PDF conversion failed.');
        setOutput(result.output.name, result.output.blob);
        setWarnings(result.warnings.map((item) => item.message));
        setStatus(`Created PDF${result.pageCount ? ` with ${result.pageCount} ${result.pageCount === 1 ? 'page' : 'pages'}` : ''}.`);
      } else {
        const spreadsheetTools = await import('@/tools/spreadsheet');
        const result = await spreadsheetTools.excelToPdfProcessor.process(files[0] as never, { ...options, margin: 12 });
        if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'Excel to PDF conversion failed.');
        setOutput(result.output.name, result.output.blob);
        setWarnings(result.warnings.map((item) => item.message));
        setStatus(`Rendered ${result.output.sheetNames.length} ${result.output.sheetNames.length === 1 ? 'sheet' : 'sheets'} to PDF${result.pageCount ? ` (${result.pageCount} pages)` : ''}.`);
      }
      trackToolEvent('tool_success', { toolId, metadata: { mode, fileCount: files.length } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, metadata: { mode, message } });
    } finally { setBusy(false); }
  }

  return <div className="format-pdf-tool">
    <style>{`
      .format-pdf-tool{display:grid;gap:15px}.format-pdf-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:26px;text-align:center;background:#f8fafd}.format-pdf-drop svg{width:44px;height:44px;color:#0b57d0}.format-pdf-drop h2{margin:9px 0 5px;font-size:21px}.format-pdf-drop p{margin:0 0 14px;color:#5f6368;line-height:1.5}.format-pdf-button{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:10px 15px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.format-pdf-button.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.format-pdf-button.success{background:#137333;border-color:#137333;color:#fff}.format-pdf-button:disabled{opacity:.45;cursor:not-allowed}.format-pdf-controls{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:12px;border:1px solid #e0e3e7;border-radius:13px}.format-pdf-controls label{font-size:12px;font-weight:700}.format-pdf-select{border:1px solid #d4d9e1;border-radius:9px;padding:8px 10px}.format-pdf-files{display:grid;gap:7px}.format-pdf-file{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #e0e3e7;border-radius:12px;padding:9px 11px}.format-pdf-file strong{display:block}.format-pdf-file span{font-size:11px;color:#5f6368}.format-pdf-file-actions{display:flex;gap:4px}.format-pdf-icon{border:0;border-radius:8px;width:31px;height:31px;display:grid;place-items:center;cursor:pointer;background:#f1f3f4}.format-pdf-html{width:100%;min-height:220px;box-sizing:border-box;border:1px solid #d4d9e1;border-radius:12px;padding:12px;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}.format-pdf-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.format-pdf-status{font-size:13px;color:#5f6368}.format-pdf-warning{padding:9px 11px;border-radius:9px;background:#fff8e1;color:#7a4f00;font-size:12px}.format-pdf-output{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #cde3d3;background:#f4faf6;border-radius:14px;padding:13px}.format-pdf-output-main{display:flex;gap:9px;align-items:center;min-width:0}.format-pdf-output-main strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.format-pdf-output-main span{display:block;font-size:11px;color:#5f6368;margin-top:2px}@media(max-width:650px){.format-pdf-drop{padding:20px 12px}.format-pdf-output,.format-pdf-file{align-items:flex-start;flex-direction:column}}
    `}</style>
    <input ref={inputRef} hidden type="file" accept={accept} multiple={imageMode} onChange={(event) => onFiles(event.target.files)} />
    <div className="format-pdf-drop"><FileUp /><h2>{imageMode ? 'Choose image files' : `Choose ${htmlMode ? 'an HTML file' : 'an XLSX file'}`}</h2><p>{imageMode ? 'Each selected image becomes one PDF page in the order shown below.' : htmlMode ? 'Upload an HTML file, or paste HTML markup into the editor below.' : 'The workbook is rendered sheet by sheet in your browser.'}</p><button type="button" className="format-pdf-button primary" onClick={() => inputRef.current?.click()} disabled={busy}><FileUp size={16}/>{files.length ? 'Choose again' : 'Choose file'}</button></div>
    {htmlMode ? <textarea className="format-pdf-html" value={htmlText} onChange={(event) => setHtmlText(event.target.value)} placeholder="Or paste HTML markup here…" aria-label="HTML markup" /> : null}
    {files.length ? <div className="format-pdf-files">{files.map((file,index)=><div className="format-pdf-file" key={`${file.name}-${file.lastModified}-${index}`}><div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div>{imageMode ? <div className="format-pdf-file-actions"><button className="format-pdf-icon" type="button" disabled={index===0||busy} onClick={()=>move(index,-1)} aria-label="Move up"><ArrowUp size={15}/></button><button className="format-pdf-icon" type="button" disabled={index===files.length-1||busy} onClick={()=>move(index,1)} aria-label="Move down"><ArrowDown size={15}/></button><button className="format-pdf-icon" type="button" disabled={busy} onClick={()=>setFiles((current)=>current.filter((_,i)=>i!==index))} aria-label="Remove"><Trash2 size={15}/></button></div>:null}</div>)}</div>:null}
    <div className="format-pdf-controls"><label htmlFor={`${toolId}-format`}>Page</label><select id={`${toolId}-format`} className="format-pdf-select" value={pageFormat} onChange={(e)=>setPageFormat(e.target.value as 'a4'|'letter')} disabled={busy}><option value="a4">A4</option><option value="letter">Letter</option></select><label htmlFor={`${toolId}-orientation`}>Orientation</label><select id={`${toolId}-orientation`} className="format-pdf-select" value={orientation} onChange={(e)=>setOrientation(e.target.value as 'portrait'|'landscape')} disabled={busy}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>{imageMode?<><label htmlFor={`${toolId}-fit`}>Image fit</label><select id={`${toolId}-fit`} className="format-pdf-select" value={fit} onChange={(e)=>setFit(e.target.value as 'contain'|'cover')} disabled={busy}><option value="contain">Contain</option><option value="cover">Cover</option></select></>:null}</div>
    <div className="format-pdf-actions"><button type="button" className="format-pdf-button primary" disabled={!ready||busy} onClick={()=>void run()}><FileOutput size={16}/>{busy?'Converting…':'Convert to PDF'}</button>{ready?<button type="button" className="format-pdf-button" disabled={busy} onClick={reset}><Trash2 size={15}/>Clear</button>:null}<span className="format-pdf-status" aria-live="polite">{status}</span></div>
    {warnings.map((warning)=><div className="format-pdf-warning" key={warning}>{warning}</div>)}
    {download?<div className="format-pdf-output"><div className="format-pdf-output-main"><FileOutput size={20}/><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div></div><a className="format-pdf-button success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:'pdf'})}><Download size={16}/>Download PDF</a></div>:null}
  </div>;
}
