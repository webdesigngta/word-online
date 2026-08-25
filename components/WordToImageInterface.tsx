'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileImage, FileUp, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import type { WordImageFormat } from '@/tools/word/to-image/WordToImageProcessor';

type DownloadState = { name: string; url: string; size: number; label: string } | null;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function baseName(name: string) {
  return name.replace(/\.docx$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'document';
}

export function WordToImageInterface({ format, toolId }: { format: WordImageFormat; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(2);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a DOCX file to begin.');
  const [download, setDownload] = useState<DownloadState>(null);

  useEffect(() => () => {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
  }, []);

  function clearDownload() {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = null;
    setDownload(null);
  }

  function chooseFile(files: FileList | null) {
    const next = files?.[0];
    if (!next) return;
    if (!(next.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || /\.docx$/i.test(next.name))) {
      setStatus('Please choose a DOCX Word document.');
      return;
    }
    clearDownload();
    setFile(next);
    setStatus(`${next.name} is ready to convert.`);
    trackToolEvent('tool_start', { toolId, fileType: 'docx', metadata: { format, size: next.size } });
  }

  async function run() {
    if (!file || busy) return;
    setBusy(true);
    clearDownload();
    setStatus(`Rendering Word pages as ${format.toUpperCase()} images…`);
    try {
      const { wordToImageProcessor } = await import('@/tools/word/to-image/WordToImageProcessor');
      const result = await wordToImageProcessor.process(file as never, { format, quality, scale });
      if (!result.success || !result.outputs?.length) throw new Error(result.errors[0]?.message || 'Word to image conversion failed.');

      let blob: Blob;
      let name: string;
      let label: string;
      if (result.outputs.length === 1) {
        blob = result.outputs[0].blob;
        name = result.outputs[0].name;
        label = `Download ${format.toUpperCase()}`;
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        result.outputs.forEach((output) => zip.file(output.name, output.blob));
        blob = await zip.generateAsync({ type: 'blob' });
        name = `${baseName(file.name)}-${format}-pages.zip`;
        label = 'Download pages as ZIP';
      }
      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;
      setDownload({ name, url, size: blob.size, label });
      const warning = result.warnings[0];
      setStatus(warning ? `Converted ${result.pageCount} pages. Note: ${warning}` : `Converted ${result.pageCount} ${result.pageCount === 1 ? 'page' : 'pages'} to ${format.toUpperCase()}.`);
      trackToolEvent('tool_success', { toolId, fileType: 'docx', outputType: format, metadata: { pages: result.pageCount } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Word to image conversion failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'docx', metadata: { format, message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    clearDownload();
    setFile(null);
    setStatus('Choose a DOCX file to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  return <div className="word-image-tool">
    <style>{`
      .word-image-tool{display:grid;gap:15px}.wit-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:26px;text-align:center;background:#f8fafd}.wit-drop>svg{width:44px;height:44px;color:#0b57d0}.wit-drop h2{margin:8px 0 5px}.wit-drop p{margin:0 0 14px;color:#5f6368}.wit-btn{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:9px 14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.wit-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.wit-btn.success{background:#137333;border-color:#137333;color:#fff}.wit-btn:disabled{opacity:.45;cursor:not-allowed}.wit-file,.wit-controls,.wit-output{border:1px solid #e0e3e7;border-radius:13px;padding:12px 14px;background:#fff}.wit-file,.wit-output{display:flex;justify-content:space-between;align-items:center;gap:12px}.wit-file span,.wit-output span{display:block;color:#5f6368;font-size:11px;margin-top:3px}.wit-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.wit-controls label{font-size:12px;font-weight:700}.wit-select{border:1px solid #d4d9e1;border-radius:9px;padding:9px 10px;background:#fff}.wit-status{font-size:13px;color:#5f6368}.wit-output{background:#f4faf6;border-color:#cde3d3}@media(max-width:650px){.wit-drop{padding:20px 12px}.wit-file,.wit-output{align-items:flex-start;flex-direction:column}}
    `}</style>
    <input ref={inputRef} hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event)=>chooseFile(event.target.files)} />
    <div className="wit-drop"><FileImage/><h2>Convert Word to {format.toUpperCase()}</h2><p>Render each DOCX page as a high-quality {format.toUpperCase()} image directly in your browser.</p><button className="wit-btn primary" type="button" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{file?'Choose another DOCX':'Choose DOCX'}</button></div>
    {file?<div className="wit-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div><button className="wit-btn" type="button" disabled={busy} onClick={reset}><Trash2 size={15}/>Reset</button></div>:null}
    {file?<div className="wit-controls"><label htmlFor={`${toolId}-scale`}>Resolution</label><select id={`${toolId}-scale`} className="wit-select" value={scale} disabled={busy} onChange={(event)=>setScale(Number(event.target.value))}><option value={1.5}>Standard</option><option value={2}>High</option><option value={3}>Very high</option></select>{format==='jpg'?<><label htmlFor={`${toolId}-quality`}>JPG quality</label><select id={`${toolId}-quality`} className="wit-select" value={quality} disabled={busy} onChange={(event)=>setQuality(Number(event.target.value))}><option value={0.8}>Good</option><option value={0.92}>High</option><option value={0.98}>Maximum</option></select></>:null}<button className="wit-btn primary" type="button" disabled={busy} onClick={()=>void run()}><FileImage size={16}/>{busy?'Converting…':`Convert to ${format.toUpperCase()}`}</button></div>:null}
    <div className="wit-status" role="status">{status}</div>
    {download?<div className="wit-output"><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div><a className="wit-btn success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:format})}><Download size={16}/>{download.label}</a></div>:null}
  </div>;
}
