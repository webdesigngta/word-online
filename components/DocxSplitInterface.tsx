'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileScissors, FileUp, RefreshCw } from 'lucide-react';
import { docxSplitProcessor } from '@/tools/word';

type Output = { name: string; blob: Blob; size: number; type: string };
type DownloadItem = Output & { url: string };

function outputsFrom(metadata: Record<string, unknown> | undefined): Output[] {
  const raw = metadata?.outputs;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is Output => Boolean(item && typeof item === 'object' && 'blob' in item && 'name' in item)) as Output[];
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KB`;
}

export function DocxSplitInterface() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [headingLevel, setHeadingLevel] = useState(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a DOCX file and split it at headings.');
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => () => downloads.forEach((item) => URL.revokeObjectURL(item.url)), [downloads]);

  function choose(next?: File) {
    downloads.forEach((item) => URL.revokeObjectURL(item.url));
    setDownloads([]);
    setWarnings([]);
    setFile(next || null);
    setStatus(next ? `${next.name} is ready to split.` : 'Choose a DOCX file and split it at headings.');
  }

  async function split() {
    if (!file) return;
    setBusy(true);
    setStatus('Splitting document…');
    try {
      const result = await docxSplitProcessor.process(file, { mode: 'heading', headingLevel });
      if (!result.success) {
        setStatus(result.errors[0]?.message || 'Could not split this DOCX file.');
        return;
      }
      const outputs = outputsFrom(result.metadata);
      const next = outputs.map((output) => ({ ...output, url: URL.createObjectURL(output.blob) }));
      setDownloads(next);
      setWarnings(result.warnings.map((item) => item.message));
      setStatus(next.length ? `Created ${next.length} document ${next.length === 1 ? 'section' : 'sections'}.` : 'No split sections were produced.');
    } catch {
      setStatus('Could not split this DOCX file.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fwo-split-tool">
      <style>{`
        .fwo-split-tool{display:grid;gap:16px}.fwo-split-picker{border:2px dashed #d4d9e1;border-radius:18px;background:#fbfcff;padding:26px;text-align:center}.fwo-split-picker>svg{width:44px;height:44px;color:#0b57d0;margin-bottom:10px}.fwo-split-picker h2{margin:0 0 7px;font-size:21px}.fwo-split-picker p{margin:0 0 16px;color:#5f6368}.fwo-split-button,.fwo-split-download{border:0;border-radius:22px;padding:10px 17px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;text-decoration:none}.fwo-split-button{background:#0b57d0;color:#fff}.fwo-split-button.secondary{background:#edf2fb;color:#174ea6}.fwo-split-button:disabled{opacity:.55}.fwo-split-options{display:flex;align-items:center;gap:12px;justify-content:space-between;flex-wrap:wrap;border:1px solid #e1e5eb;border-radius:13px;padding:13px 14px;background:#f8fafd}.fwo-split-options label{font-size:13px;font-weight:600}.fwo-split-options select{margin-left:8px;border:1px solid #cbd3df;border-radius:8px;padding:7px 9px;background:#fff}.fwo-split-status{font-size:12px;color:#5f6368;min-width:0;overflow:hidden;text-overflow:ellipsis}.fwo-split-list{display:grid;gap:8px}.fwo-split-output{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #dce3eb;border-radius:12px;padding:11px 13px}.fwo-split-output-main{min-width:0}.fwo-split-output strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fwo-split-output span{font-size:11px;color:#5f6368}.fwo-split-download{background:#137333;color:#fff;padding:8px 12px;font-size:12px;flex:0 0 auto}.fwo-split-warning{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}
      `}</style>
      <input ref={inputRef} hidden type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => choose(event.target.files?.[0])} />
      <div className="fwo-split-picker"><FileScissors /><h2>Split a Word document by headings</h2><p>Create separate DOCX files at Heading 1, Heading 2 or Heading 3 boundaries.</p><button className="fwo-split-button secondary" type="button" onClick={() => inputRef.current?.click()}><FileUp />{file ? 'Choose another DOCX' : 'Choose DOCX file'}</button></div>
      <div className="fwo-split-options"><div><label>Split at<select value={headingLevel} onChange={(event) => setHeadingLevel(Number(event.target.value))}><option value={1}>Heading 1</option><option value={2}>Heading 1–2</option><option value={3}>Heading 1–3</option></select></label><div className="fwo-split-status">{file ? file.name : status}</div></div><button className="fwo-split-button" disabled={!file || busy} type="button" onClick={() => void split()}>{busy ? <RefreshCw /> : <FileScissors />}{busy ? 'Splitting…' : 'Split document'}</button></div>
      <div className="fwo-split-status">{status}</div>
      {warnings.length ? <div className="fwo-split-warning">{warnings.slice(0,3).join(' · ')}</div> : null}
      {downloads.length ? <div className="fwo-split-list">{downloads.map((item,index) => <div className="fwo-split-output" key={`${item.name}-${index}`}><div className="fwo-split-output-main"><strong>{item.name}</strong><span>{formatBytes(item.size)}</span></div><a className="fwo-split-download" href={item.url} download={item.name}><Download />Download</a></div>)}</div> : null}
    </div>
  );
}
