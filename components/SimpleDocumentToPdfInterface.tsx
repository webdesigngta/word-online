'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileText, FileUp, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import type { SimpleDocumentPdfMode } from '@/tools/word/to-simple-pdf/SimpleDocumentToPdfProcessor';

type DownloadState = { name: string; url: string; size: number } | null;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function SimpleDocumentToPdfInterface({ mode, toolId }: { mode: SimpleDocumentPdfMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageFormat, setPageFormat] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(`Choose a ${mode.toUpperCase()} file to begin.`);
  const [download, setDownload] = useState<DownloadState>(null);

  useEffect(() => () => {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
  }, []);

  function clearDownload() {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = null;
    setDownload(null);
  }

  function chooseFile(list: FileList | null) {
    const next = list?.[0];
    if (!next) return;
    const valid = mode === 'txt' ? /\.txt$/i.test(next.name) || next.type === 'text/plain' : /\.rtf$/i.test(next.name) || /rtf/i.test(next.type);
    if (!valid) {
      setStatus(`Please choose a ${mode.toUpperCase()} file.`);
      return;
    }
    clearDownload();
    setFile(next);
    setStatus(`${next.name} is ready to convert.`);
    trackToolEvent('tool_start', { toolId, fileType: mode, metadata: { size: next.size } });
  }

  function reset() {
    clearDownload();
    setFile(null);
    setStatus(`Choose a ${mode.toUpperCase()} file to begin.`);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function run() {
    if (!file || busy) return;
    setBusy(true);
    clearDownload();
    setStatus('Rendering PDF in your browser…');
    try {
      const { simpleDocumentToPdfProcessor } = await import('@/tools/word/to-simple-pdf/SimpleDocumentToPdfProcessor');
      const result = await simpleDocumentToPdfProcessor.process(file as never, { mode, pageFormat, orientation, margin: 12 });
      if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'Conversion failed.');
      const url = URL.createObjectURL(result.output.blob);
      downloadUrlRef.current = url;
      setDownload({ name: result.output.name, url, size: result.output.size });
      const warning = result.warnings[0];
      setStatus(warning ? `PDF created. Note: ${warning}` : `PDF created${result.pageCount ? ` with ${result.pageCount} ${result.pageCount === 1 ? 'page' : 'pages'}` : ''}.`);
      trackToolEvent('tool_success', { toolId, fileType: mode, outputType: 'pdf', metadata: { pages: result.pageCount } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: mode, metadata: { message } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="simple-pdf-tool">
      <style>{`
        .simple-pdf-tool{display:grid;gap:18px}.simple-pdf-row{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}.simple-pdf-file{display:flex;align-items:center;gap:11px;min-width:0}.simple-pdf-icon{width:42px;height:42px;border-radius:12px;background:#e8f0fe;color:#0b57d0;display:grid;place-items:center}.simple-pdf-icon svg{width:20px}.simple-pdf-copy{min-width:0}.simple-pdf-copy strong{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.simple-pdf-copy span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.simple-pdf-actions{display:flex;gap:8px;flex-wrap:wrap}.simple-pdf-button{border:0;border-radius:20px;background:#0b57d0;color:#fff;padding:10px 16px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.simple-pdf-button.secondary{background:#f1f3f4;color:#3c4043}.simple-pdf-button:disabled{opacity:.55;cursor:not-allowed}.simple-pdf-button svg{width:17px}.simple-pdf-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.simple-pdf-options label{display:grid;gap:6px;font-size:12px;font-weight:600;color:#3c4043}.simple-pdf-options select{border:1px solid #dadce0;border-radius:10px;padding:10px;background:#fff;color:#202124}.simple-pdf-drop{border:2px dashed #d7dce2;border-radius:16px;padding:28px;text-align:center;background:#fbfcfe;color:#5f6368}.simple-pdf-download{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;background:#f7fbff;border:1px solid #d7e7ff;border-radius:14px;padding:14px}.simple-pdf-download a{text-decoration:none}@media(max-width:680px){.simple-pdf-options{grid-template-columns:1fr}.simple-pdf-row{align-items:flex-start}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept={mode === 'txt' ? '.txt,text/plain' : '.rtf,application/rtf,text/rtf'} onChange={(event) => chooseFile(event.target.files)} />
      <div className="simple-pdf-row">
        <div className="simple-pdf-file">
          <div className="simple-pdf-icon"><FileText /></div>
          <div className="simple-pdf-copy"><strong>{file?.name || `${mode.toUpperCase()} to PDF`}</strong><span>{status}</span></div>
        </div>
        <div className="simple-pdf-actions">
          <button className="simple-pdf-button secondary" type="button" onClick={() => inputRef.current?.click()}><FileUp />{file ? 'Choose another' : `Choose ${mode.toUpperCase()}`}</button>
          {file ? <button className="simple-pdf-button secondary" type="button" onClick={reset}><Trash2 />Clear</button> : null}
        </div>
      </div>
      {!file ? <button className="simple-pdf-drop" type="button" onClick={() => inputRef.current?.click()}>Choose a {mode.toUpperCase()} document from your device. Processing stays in this browser.</button> : null}
      <div className="simple-pdf-options">
        <label>Page size<select value={pageFormat} onChange={(event) => setPageFormat(event.target.value as 'a4' | 'letter')}><option value="a4">A4</option><option value="letter">US Letter</option></select></label>
        <label>Orientation<select value={orientation} onChange={(event) => setOrientation(event.target.value as 'portrait' | 'landscape')}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label>
      </div>
      <button className="simple-pdf-button" type="button" disabled={!file || busy} onClick={() => void run()}>{busy ? 'Converting…' : `Convert ${mode.toUpperCase()} to PDF`}</button>
      {download ? <div className="simple-pdf-download"><div><strong>{download.name}</strong><div>{formatBytes(download.size)}</div></div><a className="simple-pdf-button" href={download.url} download={download.name}><Download />Download PDF</a></div> : null}
    </div>
  );
}
