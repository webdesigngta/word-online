'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FilePlus2, Images, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

type DownloadState = { name: string; url: string; size: number; pageCount: number } | null;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function ScanToPdfInterface({ toolId }: { toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [pageFormat, setPageFormat] = useState<'a4' | 'letter'>('a4');
  const [marginMm, setMarginMm] = useState(6);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose JPG or PNG scans to begin.');
  const [download, setDownload] = useState<DownloadState>(null);

  useEffect(() => () => {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
  }, []);

  function clearDownload() {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = null;
    setDownload(null);
  }

  function chooseFiles(list: FileList | null) {
    const next = Array.from(list ?? []);
    if (!next.length) return;
    const valid = next.filter((file) => /^image\/(?:jpeg|png)$/i.test(file.type) || /\.(?:jpe?g|png)$/i.test(file.name));
    if (!valid.length) {
      setStatus('Please choose JPG, JPEG, or PNG image files.');
      return;
    }
    clearDownload();
    setFiles(valid);
    setStatus(`${valid.length} ${valid.length === 1 ? 'scan' : 'scans'} ready. Upload order becomes PDF page order.`);
    trackToolEvent('tool_start', { toolId, fileType: 'image', metadata: { count: valid.length } });
  }

  async function run() {
    if (!files.length || busy) return;
    setBusy(true);
    clearDownload();
    setStatus('Creating PDF from scans…');
    try {
      const { scanToPdfProcessor } = await import('@/tools/image/scan-to-pdf/ScanToPdfProcessor');
      const result = await scanToPdfProcessor.process(files as never, { pageFormat, marginMm });
      if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'Scan to PDF conversion failed.');
      const url = URL.createObjectURL(result.output.blob);
      downloadUrlRef.current = url;
      setDownload({ name: result.output.name, url, size: result.output.size, pageCount: result.output.pageCount });
      setStatus(`Created a ${result.output.pageCount}-page PDF from ${result.inputCount} ${result.inputCount === 1 ? 'scan' : 'scans'}.`);
      trackToolEvent('tool_success', { toolId, fileType: 'image', outputType: 'pdf', metadata: { count: result.inputCount, pageCount: result.output.pageCount } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan to PDF conversion failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'image', metadata: { message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    clearDownload();
    setFiles([]);
    setStatus('Choose JPG or PNG scans to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  return <div className="scan-pdf-tool">
    <style>{`
      .scan-pdf-tool{display:grid;gap:15px}.spt-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:26px;text-align:center;background:#f8fafd}.spt-drop>svg{width:44px;height:44px;color:#0b57d0}.spt-drop h2{margin:8px 0 5px}.spt-drop p{margin:0 0 14px;color:#5f6368}.spt-btn{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:9px 14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.spt-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.spt-btn.success{background:#137333;border-color:#137333;color:#fff}.spt-btn:disabled{opacity:.45;cursor:not-allowed}.spt-file,.spt-controls,.spt-output{border:1px solid #e0e3e7;border-radius:13px;padding:12px 14px;background:#fff}.spt-file,.spt-output{display:flex;justify-content:space-between;align-items:center;gap:12px}.spt-files{display:grid;gap:4px}.spt-files span,.spt-output span{color:#5f6368;font-size:11px}.spt-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.spt-controls label{font-size:12px;font-weight:700}.spt-select{border:1px solid #d4d9e1;border-radius:9px;padding:9px 10px;background:#fff}.spt-status{font-size:13px;color:#5f6368}.spt-output{background:#f4faf6;border-color:#cde3d3}@media(max-width:650px){.spt-drop{padding:20px 12px}.spt-file,.spt-output{align-items:flex-start;flex-direction:column}}
    `}</style>
    <input ref={inputRef} hidden type="file" multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event)=>chooseFiles(event.target.files)} />
    <div className="spt-drop"><Images/><h2>Turn scans into one PDF</h2><p>Choose one or more JPG or PNG scans. Each image becomes one PDF page in the order selected.</p><button className="spt-btn primary" type="button" disabled={busy} onClick={()=>inputRef.current?.click()}><FilePlus2 size={16}/>{files.length?'Choose scans again':'Choose scans'}</button></div>
    {files.length?<div className="spt-file"><div className="spt-files"><strong>{files.length} {files.length===1?'image':'images'} selected</strong><span>{formatBytes(files.reduce((total,file)=>total+file.size,0))} total</span><span>{files.slice(0,3).map((file)=>file.name).join(' · ')}{files.length>3?` · +${files.length-3} more`:''}</span></div><button className="spt-btn" type="button" disabled={busy} onClick={reset}><Trash2 size={15}/>Reset</button></div>:null}
    {files.length?<div className="spt-controls"><label htmlFor={`${toolId}-format`}>Page size</label><select id={`${toolId}-format`} className="spt-select" value={pageFormat} disabled={busy} onChange={(event)=>setPageFormat(event.target.value as 'a4'|'letter')}><option value="a4">A4</option><option value="letter">US Letter</option></select><label htmlFor={`${toolId}-margin`}>Margin</label><select id={`${toolId}-margin`} className="spt-select" value={marginMm} disabled={busy} onChange={(event)=>setMarginMm(Number(event.target.value))}><option value={0}>None</option><option value={6}>6 mm</option><option value={12}>12 mm</option></select><button className="spt-btn primary" type="button" disabled={busy} onClick={()=>void run()}><Images size={16}/>{busy?'Creating PDF…':'Create PDF'}</button></div>:null}
    <div className="spt-status" role="status">{status}</div>
    {download?<div className="spt-output"><div><strong>{download.name}</strong><span>{download.pageCount} pages · {formatBytes(download.size)}</span></div><a className="spt-btn success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:'pdf'})}><Download size={16}/>Download PDF</a></div>:null}
  </div>;
}
