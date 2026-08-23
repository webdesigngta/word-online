'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileDown, FileText, RefreshCw } from 'lucide-react';
import { wordToPdfProcessor } from '@/tools/word';

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function WordToPdfInterface({ label = 'Word to PDF' }: { label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a DOCX file to convert to PDF.');
  const [sourceName, setSourceName] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [outputSize, setOutputSize] = useState(0);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  async function convert(file?: File) {
    if (!file) return;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');
    setWarnings([]);
    setBusy(true);
    setSourceName(file.name);
    setStatus(`Converting ${file.name}…`);
    try {
      const result = await wordToPdfProcessor.process(file);
      if (!result.success || !result.output) {
        setStatus(result.errors[0]?.message || 'Could not convert this DOCX file.');
        return;
      }
      const url = URL.createObjectURL(result.output.blob);
      setDownloadUrl(url);
      setDownloadName(result.output.name);
      setOutputSize(result.output.size);
      setPageCount(result.pageCount);
      setWarnings(result.warnings.map((item) => item.message));
      setStatus('PDF is ready to download.');
    } catch {
      setStatus('Could not convert this DOCX file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="fwo-convert-tool">
      <style>{`
        .fwo-convert-tool{display:grid;gap:18px}.fwo-convert-drop{min-height:310px;border:2px dashed #d4d9e1;border-radius:18px;background:linear-gradient(180deg,#fbfdff,#f6f9fe);display:grid;place-items:center;text-align:center;padding:30px}.fwo-convert-drop svg{width:48px;height:48px;color:#0b57d0;margin-bottom:12px}.fwo-convert-drop h2{margin:0;font-size:22px}.fwo-convert-drop p{margin:8px auto 18px;color:#5f6368;max-width:520px;line-height:1.55}.fwo-convert-button,.fwo-download-button{border:0;border-radius:22px;padding:11px 18px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;text-decoration:none}.fwo-convert-button{background:#0b57d0;color:#fff}.fwo-download-button{background:#137333;color:#fff}.fwo-convert-button:disabled{opacity:.55;cursor:wait}.fwo-result{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border:1px solid #dfe4ea;border-radius:14px;padding:15px 16px;background:#fff}.fwo-result-main{display:flex;gap:12px;align-items:center;min-width:0}.fwo-result-icon{width:42px;height:42px;border-radius:11px;background:#e6f4ea;color:#137333;display:grid;place-items:center}.fwo-result-icon svg{width:21px}.fwo-result-copy{min-width:0}.fwo-result-copy strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px}.fwo-result-copy span{display:block;color:#5f6368;font-size:12px;margin-top:4px}.fwo-convert-warning{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}.fwo-convert-status{color:#5f6368;font-size:13px}.fwo-file-name{color:#202124;font-weight:600}@media(max-width:640px){.fwo-convert-drop{min-height:260px;padding:22px 14px}.fwo-result-copy strong{max-width:220px}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => void convert(event.target.files?.[0])} />
      <div className="fwo-convert-drop">
        <div>
          <FileText />
          <h2>{label}</h2>
          <p>Upload a DOCX file. The existing Word conversion engine renders the document and creates the PDF directly in your browser.</p>
          <button type="button" className="fwo-convert-button" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <RefreshCw /> : <FileDown />}{busy ? 'Converting…' : sourceName ? 'Convert another DOCX' : 'Choose DOCX file'}
          </button>
          <div className="fwo-convert-status" style={{ marginTop: 12 }}>{sourceName ? <><span className="fwo-file-name">{sourceName}</span> · </> : null}{status}</div>
        </div>
      </div>
      {warnings.length > 0 ? <div className="fwo-convert-warning">{warnings.slice(0, 3).join(' · ')}</div> : null}
      {downloadUrl ? (
        <div className="fwo-result">
          <div className="fwo-result-main">
            <div className="fwo-result-icon"><FileDown /></div>
            <div className="fwo-result-copy"><strong>{downloadName}</strong><span>{formatBytes(outputSize)}{pageCount ? ` · ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}` : ''}</span></div>
          </div>
          <a className="fwo-download-button" href={downloadUrl} download={downloadName}><Download />Download PDF</a>
        </div>
      ) : null}
    </div>
  );
}
