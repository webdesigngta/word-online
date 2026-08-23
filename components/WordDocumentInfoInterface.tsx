'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileSearch, RefreshCw } from 'lucide-react';
import { wordDocumentInfoProcessor } from '@/tools/word';

type InfoResult = {
  success: boolean;
  output?: { name: string; blob: Blob; size: number; type: string };
  metadata?: Record<string, unknown>;
  warnings: Array<{ message: string }>;
  errors: Array<{ message: string }>;
};

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not set';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}

export function WordDocumentInfoInterface() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('Choose a DOCX file to inspect its document information.');
  const [metadata, setMetadata] = useState<Record<string, unknown> | null>(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  async function inspect(file?: File) {
    if (!file) return;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');
    setMetadata(null);
    setWarnings([]);
    setBusy(true);
    setFileName(file.name);
    setStatus('Reading document information…');
    try {
      const result = await wordDocumentInfoProcessor.process(file) as unknown as InfoResult;
      if (!result.success) {
        setStatus(result.errors[0]?.message || 'Could not inspect this DOCX file.');
        return;
      }
      setMetadata(result.metadata || {});
      setWarnings(result.warnings.map((item) => item.message));
      if (result.output) {
        setDownloadUrl(URL.createObjectURL(result.output.blob));
        setDownloadName(result.output.name);
      }
      setStatus('Document information is ready.');
    } catch {
      setStatus('Could not inspect this DOCX file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const primary = metadata ? [
    ['Words', metadata.wordCount], ['Characters', metadata.characterCount], ['Paragraphs', metadata.paragraphCount],
    ['Headings', metadata.headingCount], ['Tables', metadata.tableCount], ['Images', metadata.imageCount],
  ] : [];
  const properties = metadata ? [
    ['Title', metadata.title], ['Subject', metadata.subject], ['Author', metadata.author], ['Last modified by', metadata.lastModifiedBy],
    ['Created', metadata.created], ['Modified', metadata.modified], ['Keywords', metadata.keywords], ['Application', metadata.application],
  ] : [];

  return (
    <div className="fwo-info-tool">
      <style>{`
        .fwo-info-tool{display:grid;gap:16px}.fwo-info-picker{border:2px dashed #d4d9e1;border-radius:18px;background:#fbfcff;min-height:250px;display:grid;place-items:center;text-align:center;padding:26px}.fwo-info-picker>div>svg{width:46px;height:46px;color:#0b57d0;margin-bottom:10px}.fwo-info-picker h2{margin:0 0 7px;font-size:21px}.fwo-info-picker p{margin:0 0 16px;color:#5f6368}.fwo-info-button,.fwo-info-download{border:0;border-radius:22px;padding:10px 17px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;text-decoration:none}.fwo-info-button{background:#0b57d0;color:#fff}.fwo-info-button:disabled{opacity:.55}.fwo-info-download{background:#edf2fb;color:#174ea6}.fwo-info-status{font-size:12px;color:#5f6368;margin-top:11px}.fwo-info-status strong{color:#202124}.fwo-info-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}.fwo-info-stat{border:1px solid #e2e6ec;border-radius:12px;background:#f8fafd;padding:12px}.fwo-info-stat span{display:block;color:#5f6368;font-size:10px}.fwo-info-stat strong{display:block;font-size:19px;margin-top:4px}.fwo-info-properties{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fwo-info-property{border-bottom:1px solid #e5e8ed;padding:10px 4px}.fwo-info-property span{display:block;color:#5f6368;font-size:10px;margin-bottom:3px}.fwo-info-property strong{display:block;font-size:13px;overflow-wrap:anywhere}.fwo-info-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.fwo-info-warning{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}@media(max-width:900px){.fwo-info-stats{grid-template-columns:repeat(3,1fr)}}@media(max-width:520px){.fwo-info-stats,.fwo-info-properties{grid-template-columns:repeat(2,1fr)}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => void inspect(event.target.files?.[0])} />
      <div className="fwo-info-picker"><div><FileSearch /><h2>Inspect Word document information</h2><p>See document statistics and metadata stored inside a DOCX file.</p><button className="fwo-info-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <RefreshCw /> : <FileSearch />}{busy ? 'Inspecting…' : fileName ? 'Choose another DOCX' : 'Choose DOCX file'}</button><div className="fwo-info-status">{fileName ? <><strong>{fileName}</strong> · </> : null}{status}</div></div></div>
      {warnings.length ? <div className="fwo-info-warning">{warnings.slice(0,3).join(' · ')}</div> : null}
      {metadata ? <><div className="fwo-info-stats">{primary.map(([label,value]) => <div className="fwo-info-stat" key={String(label)}><span>{label}</span><strong>{displayValue(value)}</strong></div>)}</div><div className="fwo-info-properties">{properties.map(([label,value]) => <div className="fwo-info-property" key={String(label)}><span>{label}</span><strong>{displayValue(value)}</strong></div>)}</div><div className="fwo-info-footer"><span className="fwo-info-status">File size: {displayValue(metadata.size)} bytes</span>{downloadUrl ? <a className="fwo-info-download" href={downloadUrl} download={downloadName}><Download />Download info JSON</a> : null}</div></> : null}
    </div>
  );
}
