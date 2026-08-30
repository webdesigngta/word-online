'use client';

import { useRef, useState } from 'react';
import { FileDiff, Files, RefreshCw } from 'lucide-react';
import { docxCompareProcessor } from '@/tools/word';

type Change = { before?: string; after?: string; index?: number };
type CompareSummary = { added: number; removed: number; changed: number };

function summaryFrom(metadata: Record<string, unknown> | undefined): CompareSummary {
  const raw = metadata?.summary;
  if (!raw || typeof raw !== 'object') return { added: 0, removed: 0, changed: 0 };
  const value = raw as Record<string, unknown>;
  return {
    added: typeof value.added === 'number' ? value.added : 0,
    removed: typeof value.removed === 'number' ? value.removed : 0,
    changed: typeof value.changed === 'number' ? value.changed : 0,
  };
}

function changesFrom(metadata: Record<string, unknown> | undefined) {
  const raw = metadata?.changed;
  if (!Array.isArray(raw)) return [] as Change[];
  return raw.filter((item): item is Change => Boolean(item && typeof item === 'object'));
}

export function DocxCompareInterface() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose exactly two DOCX files to compare.');
  const [summary, setSummary] = useState<CompareSummary | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  function choose(list: FileList | null) {
    const next = list ? Array.from(list).slice(0, 2) : [];
    setFiles(next);
    setSummary(null);
    setChanges([]);
    setWarnings([]);
    setStatus(next.length === 2 ? 'Two DOCX files ready to compare.' : 'Choose exactly two DOCX files.');
  }

  async function compare() {
    if (files.length !== 2) return;
    setBusy(true);
    setStatus('Comparing documents…');
    try {
      const result = await docxCompareProcessor.process(files);
      if (!result.success) {
        setStatus(result.errors[0]?.message || 'Could not compare these files.');
        return;
      }
      setSummary(summaryFrom(result.metadata));
      setChanges(changesFrom(result.metadata));
      setWarnings(result.warnings.map((item) => item.message));
      setStatus('Comparison complete.');
    } catch {
      setStatus('Could not compare these files.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fwo-compare-tool">
      <style>{`
        .fwo-compare-tool{display:grid;gap:16px}.fwo-compare-picker{border:2px dashed #d4d9e1;border-radius:18px;background:#fbfcff;padding:26px;text-align:center}.fwo-compare-picker>svg{width:44px;height:44px;color:#0b57d0;margin-bottom:10px}.fwo-compare-picker h2{margin:0 0 7px;font-size:21px}.fwo-compare-picker p{margin:0 0 16px;color:#5f6368}.fwo-compare-button{border:0;border-radius:22px;padding:10px 17px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;background:#0b57d0;color:#fff}.fwo-compare-button.secondary{background:#edf2fb;color:#174ea6}.fwo-compare-button:disabled{opacity:.55;cursor:wait}.fwo-compare-files{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fwo-compare-file{border:1px solid #e1e5eb;border-radius:12px;padding:12px;background:#f8fafd;min-width:0}.fwo-compare-file span{display:block;color:#5f6368;font-size:11px;margin-bottom:4px}.fwo-compare-file strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.fwo-compare-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.fwo-compare-status{color:#5f6368;font-size:13px}.fwo-compare-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.fwo-compare-stat{border-radius:13px;padding:14px;background:#f7f9fc;border:1px solid #e1e5eb}.fwo-compare-stat span{display:block;color:#5f6368;font-size:11px}.fwo-compare-stat strong{display:block;font-size:23px;margin-top:4px}.fwo-change-list{display:grid;gap:10px}.fwo-change{border:1px solid #e3e7ed;border-radius:13px;padding:12px}.fwo-change-head{font-size:11px;color:#5f6368;margin-bottom:8px}.fwo-change-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fwo-change-before,.fwo-change-after{border-radius:9px;padding:10px;font-size:12px;line-height:1.5;white-space:pre-wrap}.fwo-change-before{background:#fce8e6}.fwo-change-after{background:#e6f4ea}.fwo-compare-warning{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}@media(max-width:650px){.fwo-compare-files,.fwo-change-grid{grid-template-columns:1fr}}
      `}</style>
      <input ref={inputRef} hidden multiple type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => choose(event.target.files)} />
      <div className="fwo-compare-picker">
        <Files />
        <h2>Compare two Word documents</h2>
        <p>The comparison checks paragraph and heading content in the two DOCX files.</p>
        <button className="fwo-compare-button secondary" type="button" onClick={() => inputRef.current?.click()}>Choose Files</button>
      </div>
      {files.length ? <div className="fwo-compare-files">{[0,1].map((index) => <div className="fwo-compare-file" key={index}><span>{index === 0 ? 'Original' : 'Compared version'}</span><strong>{files[index]?.name || 'Not selected'}</strong></div>)}</div> : null}
      <div className="fwo-compare-actions"><span className="fwo-compare-status">{status}</span><button className="fwo-compare-button" type="button" disabled={busy || files.length !== 2} onClick={() => void compare()}>{busy ? <RefreshCw /> : <FileDiff />}{busy ? 'Comparing…' : 'Compare documents'}</button></div>
      {warnings.length ? <div className="fwo-compare-warning">{warnings.slice(0,3).join(' · ')}</div> : null}
      {summary ? <><div className="fwo-compare-summary"><div className="fwo-compare-stat"><span>Changed blocks</span><strong>{summary.changed}</strong></div><div className="fwo-compare-stat"><span>Added / different</span><strong>{summary.added}</strong></div><div className="fwo-compare-stat"><span>Removed / different</span><strong>{summary.removed}</strong></div></div>{changes.length ? <div className="fwo-change-list">{changes.slice(0,50).map((change,index) => <div className="fwo-change" key={`${change.index ?? index}-${index}`}><div className="fwo-change-head">Change {index + 1}</div><div className="fwo-change-grid"><div className="fwo-change-before">{change.before || '—'}</div><div className="fwo-change-after">{change.after || '—'}</div></div></div>)}</div> : <div className="fwo-compare-status">No paragraph-level differences were detected.</div>}</> : null}
    </div>
  );
}
