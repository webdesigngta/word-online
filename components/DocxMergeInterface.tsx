'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Files, Merge, RefreshCw } from 'lucide-react';
import { docxMergeProcessor } from '@/tools/word';

export function DocxMergeInterface() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Select two or more DOCX files in the order you want them combined.');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  function choose(selected: FileList | null) {
    const next = selected ? Array.from(selected) : [];
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');
    setDownloadName('');
    setWarnings([]);
    setFiles(next);
    setStatus(next.length >= 2 ? `${next.length} DOCX files ready to merge.` : 'Choose at least two DOCX files.');
  }

  async function merge() {
    if (files.length < 2) {
      setStatus('Choose at least two DOCX files first.');
      return;
    }
    setBusy(true);
    setStatus('Combining documents…');
    try {
      const result = await docxMergeProcessor.process(files);
      if (!result.success || !result.output) {
        setStatus(result.errors[0]?.message || 'Could not merge these DOCX files.');
        return;
      }
      const url = URL.createObjectURL(result.output.blob);
      setDownloadUrl(url);
      setDownloadName(result.output.name);
      setWarnings(result.warnings.map((item) => item.message));
      setStatus('Merged Word document is ready.');
    } catch {
      setStatus('Could not merge these DOCX files.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fwo-merge-tool">
      <style>{`
        .fwo-merge-tool{display:grid;gap:16px}.fwo-merge-picker{border:2px dashed #d4d9e1;border-radius:18px;padding:28px;text-align:center;background:#fbfcff}.fwo-merge-picker>svg{width:44px;height:44px;color:#0b57d0;margin-bottom:10px}.fwo-merge-picker h2{margin:0 0 7px;font-size:21px}.fwo-merge-picker p{margin:0 0 16px;color:#5f6368}.fwo-merge-button,.fwo-merge-download{border:0;border-radius:22px;padding:10px 17px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;text-decoration:none}.fwo-merge-button{background:#0b57d0;color:#fff}.fwo-merge-button.secondary{background:#edf2fb;color:#174ea6}.fwo-merge-button:disabled{opacity:.55;cursor:wait}.fwo-merge-download{background:#137333;color:#fff}.fwo-merge-list{display:grid;gap:8px}.fwo-merge-file{display:flex;align-items:center;gap:10px;background:#f8fafd;border:1px solid #e1e5eb;border-radius:12px;padding:10px 12px}.fwo-merge-file-index{width:26px;height:26px;border-radius:50%;background:#e8f0fe;color:#0b57d0;display:grid;place-items:center;font-size:12px;font-weight:700}.fwo-merge-file-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.fwo-merge-actions{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.fwo-merge-status{color:#5f6368;font-size:13px}.fwo-merge-warning{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}.fwo-merge-ready{border:1px solid #cce5d3;background:#f1f8f3;border-radius:13px;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.fwo-merge-ready strong{font-size:13px}
      `}</style>
      <input ref={inputRef} hidden multiple type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => choose(event.target.files)} />
      <div className="fwo-merge-picker">
        <Files />
        <h2>Combine DOCX files</h2>
        <p>The files are merged in the same order you select them.</p>
        <button type="button" className="fwo-merge-button secondary" onClick={() => inputRef.current?.click()}>Choose DOCX files</button>
      </div>
      {files.length > 0 ? <div className="fwo-merge-list">{files.map((file, index) => <div className="fwo-merge-file" key={`${file.name}-${file.lastModified}-${index}`}><span className="fwo-merge-file-index">{index + 1}</span><span className="fwo-merge-file-name">{file.name}</span></div>)}</div> : null}
      <div className="fwo-merge-actions">
        <span className="fwo-merge-status">{status}</span>
        <button type="button" className="fwo-merge-button" disabled={busy || files.length < 2} onClick={() => void merge()}>{busy ? <RefreshCw /> : <Merge />}{busy ? 'Merging…' : 'Merge documents'}</button>
      </div>
      {warnings.length > 0 ? <div className="fwo-merge-warning">{warnings.slice(0, 3).join(' · ')}</div> : null}
      {downloadUrl ? <div className="fwo-merge-ready"><strong>{downloadName}</strong><a className="fwo-merge-download" href={downloadUrl} download={downloadName}><Download />Download merged DOCX</a></div> : null}
    </div>
  );
}
