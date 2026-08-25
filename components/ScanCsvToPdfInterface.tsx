'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Download, FileSpreadsheet, FileUp, Images, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type ScanCsvToPdfMode = 'scan-to-pdf' | 'csv-to-pdf';
type DownloadState = { name: string; url: string; size: number } | null;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function ScanCsvToPdfInterface({ mode, toolId }: { mode: ScanCsvToPdfMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [pageFormat, setPageFormat] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fit, setFit] = useState<'contain' | 'cover'>('contain');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a source file to begin.');
  const [download, setDownload] = useState<DownloadState>(null);

  const scanMode = mode === 'scan-to-pdf';
  const ready = scanMode ? files.length > 0 : files.length === 1;
  const accept = scanMode ? 'image/jpeg,image/png,.jpg,.jpeg,.png' : 'text/csv,.csv';

  useEffect(() => () => { if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current); }, []);

  function clearDownload() {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = null;
    setDownload(null);
  }

  function chooseFiles(list: FileList | null) {
    if (!list) return;
    const selected = Array.from(list);
    const next = scanMode ? selected.filter((file) => /\.(?:jpe?g|png)$/i.test(file.name) || /^image\/(?:jpeg|jpg|png)$/i.test(file.type)) : selected.slice(0, 1);
    clearDownload();
    setFiles(next);
    setStatus(next.length ? (scanMode ? `${next.length} ${next.length === 1 ? 'scan' : 'scans'} ready. Arrange them in PDF page order.` : `${next[0].name} is ready to render.`) : `Choose ${scanMode ? 'JPG or PNG scans' : 'a CSV file'}.`);
    trackToolEvent('tool_start', { toolId, fileType: scanMode ? 'image' : 'csv', metadata: { mode, fileCount: next.length } });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    clearDownload();
    setFiles((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    clearDownload();
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function reset() {
    clearDownload();
    setFiles([]);
    setStatus('Choose a source file to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function run() {
    if (!ready || busy) return;
    setBusy(true);
    clearDownload();
    setStatus(scanMode ? 'Building your scanned PDF…' : 'Rendering CSV table to PDF…');
    try {
      let blob: Blob;
      let name: string;
      let message: string;
      if (scanMode) {
        const { scanToPdfProcessor } = await import('@/tools/image');
        const result = await scanToPdfProcessor.process(files as never, { pageFormat, orientation, margin: 18, fit });
        if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'Scan to PDF conversion failed.');
        blob = result.output.blob;
        name = result.output.name;
        message = `Created a ${result.pageCount}-page PDF from ${result.inputCount} ${result.inputCount === 1 ? 'scan' : 'scans'}.`;
      } else {
        const { csvToPdfProcessor } = await import('@/tools/spreadsheet');
        const result = await csvToPdfProcessor.process(files[0] as never, { pageFormat, orientation, margin: 8 });
        if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'CSV to PDF conversion failed.');
        blob = result.output.blob;
        name = result.output.name;
        message = `Rendered ${result.rowCount} rows × ${result.columnCount} columns${result.pageCount ? ` into ${result.pageCount} PDF ${result.pageCount === 1 ? 'page' : 'pages'}` : ' to PDF'}.`;
      }
      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;
      setDownload({ name, url, size: blob.size });
      setStatus(message);
      trackToolEvent('tool_success', { toolId, fileType: scanMode ? 'image' : 'csv', outputType: 'pdf', metadata: { mode, fileCount: files.length } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: scanMode ? 'image' : 'csv', metadata: { mode, message } });
    } finally {
      setBusy(false);
    }
  }

  const Icon = scanMode ? Images : FileSpreadsheet;
  return <div className="scp-tool">
    <style>{`
      .scp-tool{display:grid;gap:15px}.scp-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:26px;text-align:center;background:#f8fafd}.scp-drop>svg{width:44px;height:44px;color:#0b57d0}.scp-drop h2{margin:9px 0 5px;font-size:21px}.scp-drop p{margin:0 auto 14px;color:#5f6368;line-height:1.5;max-width:650px}.scp-btn{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:10px 15px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.scp-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.scp-btn.success{background:#137333;border-color:#137333;color:#fff}.scp-btn:disabled{opacity:.45;cursor:not-allowed}.scp-files{display:grid;gap:7px}.scp-file{display:flex;justify-content:space-between;align-items:center;gap:10px;border:1px solid #e0e3e7;border-radius:12px;padding:10px 12px}.scp-file strong{display:block}.scp-file span{display:block;font-size:11px;color:#5f6368;margin-top:2px}.scp-file-actions{display:flex;gap:5px}.scp-icon{border:0;border-radius:8px;width:32px;height:32px;display:grid;place-items:center;cursor:pointer;background:#f1f3f4}.scp-controls{display:flex;align-items:center;gap:9px;flex-wrap:wrap;border:1px solid #e0e3e7;border-radius:13px;padding:12px;background:#fff}.scp-controls label{font-size:12px;font-weight:700}.scp-select{border:1px solid #d4d9e1;border-radius:9px;padding:8px 10px;background:#fff}.scp-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.scp-status{font-size:13px;color:#5f6368}.scp-output{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid #cde3d3;background:#f4faf6;border-radius:14px;padding:13px}.scp-output span{display:block;font-size:11px;color:#5f6368;margin-top:2px}@media(max-width:650px){.scp-drop{padding:20px 12px}.scp-file,.scp-output{align-items:flex-start;flex-direction:column}}
    `}</style>
    <input ref={inputRef} hidden type="file" accept={accept} multiple={scanMode} onChange={(event)=>chooseFiles(event.target.files)} />
    <div className="scp-drop"><Icon/><h2>{scanMode?'Turn scans into one PDF':'Convert CSV table to PDF'}</h2><p>{scanMode?'Choose JPG, JPEG, and PNG scans together, arrange their order, and make one clean PDF with one scan per page.':'Choose a CSV file and render its rows and columns as a paginated PDF table.'}</p><button className="scp-btn primary" type="button" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{files.length?'Choose again':scanMode?'Choose scans':'Choose CSV'}</button></div>
    {files.length?<div className="scp-files">{files.map((file,index)=><div className="scp-file" key={`${file.name}-${file.lastModified}-${index}`}><div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div>{scanMode?<div className="scp-file-actions"><button className="scp-icon" type="button" disabled={busy||index===0} onClick={()=>move(index,-1)} aria-label="Move up"><ArrowUp size={15}/></button><button className="scp-icon" type="button" disabled={busy||index===files.length-1} onClick={()=>move(index,1)} aria-label="Move down"><ArrowDown size={15}/></button><button className="scp-icon" type="button" disabled={busy} onClick={()=>remove(index)} aria-label="Remove"><Trash2 size={15}/></button></div>:null}</div>)}</div>:null}
    <div className="scp-controls"><label htmlFor={`${toolId}-page`}>Page</label><select id={`${toolId}-page`} className="scp-select" value={pageFormat} disabled={busy} onChange={(event)=>setPageFormat(event.target.value as 'a4'|'letter')}><option value="a4">A4</option><option value="letter">Letter</option></select><label htmlFor={`${toolId}-orientation`}>Orientation</label><select id={`${toolId}-orientation`} className="scp-select" value={orientation} disabled={busy} onChange={(event)=>setOrientation(event.target.value as 'portrait'|'landscape')}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>{scanMode?<><label htmlFor={`${toolId}-fit`}>Scan fit</label><select id={`${toolId}-fit`} className="scp-select" value={fit} disabled={busy} onChange={(event)=>setFit(event.target.value as 'contain'|'cover')}><option value="contain">Contain whole scan</option><option value="cover">Fill page</option></select></>:null}</div>
    <div className="scp-actions"><button className="scp-btn primary" type="button" disabled={!ready||busy} onClick={()=>void run()}><Icon size={16}/>{busy?'Converting…':'Convert to PDF'}</button>{files.length?<button className="scp-btn" type="button" disabled={busy} onClick={reset}><Trash2 size={15}/>Clear</button>:null}<span className="scp-status" role="status">{status}</span></div>
    {download?<div className="scp-output"><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div><a className="scp-btn success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:'pdf'})}><Download size={16}/>Download PDF</a></div>:null}
  </div>;
}
