'use client';

import { useEffect, useRef, useState } from 'react';
import { Clipboard, Download, FileUp, RefreshCw, ScanText } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

type DownloadItem = { name: string; url: string; size: number; label: string; outputType: string };

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function ScanToWordInterface({ toolId }: { toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a scanned PDF or image to begin.');
  const [text, setText] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => () => downloads.forEach((item) => URL.revokeObjectURL(item.url)), [downloads]);

  function replaceDownloads(next: Array<{ name: string; blob: Blob; label: string; outputType: string }>) {
    downloads.forEach((item) => URL.revokeObjectURL(item.url));
    setDownloads(next.map((item) => ({ name: item.name, url: URL.createObjectURL(item.blob), size: item.blob.size, label: item.label, outputType: item.outputType })));
  }

  function choose(selected: FileList | null) {
    const next = selected?.[0];
    if (!next) return;
    const valid = next.type === 'application/pdf' || next.type === 'image/png' || next.type === 'image/jpeg' || /\.(?:pdf|png|jpe?g)$/i.test(next.name);
    if (!valid) { setStatus('Choose a PDF, JPG, JPEG, or PNG scan.'); return; }
    replaceDownloads([]);
    setFile(next);
    setText('');
    setConfidence(null);
    setPageCount(null);
    setWarnings([]);
    setStatus('Ready to recognize the scan and create an editable Word document.');
    trackToolEvent('tool_start', { toolId, fileType: next.type === 'application/pdf' || /\.pdf$/i.test(next.name) ? 'pdf' : 'image', metadata: { size: next.size } });
  }

  async function run() {
    if (!file || busy) return;
    setBusy(true);
    setText('');
    setConfidence(null);
    setPageCount(null);
    setWarnings([]);
    replaceDownloads([]);
    setStatus(/\.pdf$/i.test(file.name) || file.type === 'application/pdf' ? 'Running OCR across scanned PDF pages…' : 'Recognizing text in the scanned image…');
    try {
      const { scanToWordProcessor } = await import('@/tools/ocr/scan-to-word');
      const result = await scanToWordProcessor.process(file as never, { language: 'eng' });
      if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'Scan to Word conversion failed.');
      setText(result.text);
      setConfidence(result.confidence);
      setPageCount(result.pageCount);
      setWarnings(result.warnings.map((item) => item.message));
      replaceDownloads([
        { name: result.output.name, blob: result.output.blob, label: 'Download Word file', outputType: 'docx' },
        { name: result.output.name.replace(/\.docx$/i, '.txt'), blob: new Blob([result.text], { type: 'text/plain;charset=utf-8' }), label: 'Download recognized text', outputType: 'txt' },
      ]);
      setStatus(`Created editable Word text${result.pageCount ? ` from ${result.pageCount} ${result.pageCount === 1 ? 'page' : 'pages'}` : ''}${result.confidence === null ? '' : ` · ${result.confidence.toFixed(0)}% OCR confidence`}.`);
      trackToolEvent('tool_success', { toolId, fileType: result.sourceKind ?? 'scan', outputType: 'docx', metadata: { pageCount: result.pageCount ?? 0, confidence: result.confidence ?? 0 } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The scan could not be converted to Word.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'scan', metadata: { message } });
    } finally { setBusy(false); }
  }

  function reset() {
    replaceDownloads([]); setFile(null); setText(''); setConfidence(null); setPageCount(null); setWarnings([]); setStatus('Choose a scanned PDF or image to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatus('Recognized text copied to clipboard.');
    trackToolEvent('tool_download', { toolId, outputType: 'clipboard' });
  }

  return (
    <div className="scan-word-tool">
      <style>{`
        .scan-word-tool{display:grid;gap:16px}.swt-drop{border:2px dashed #d4d9e1;border-radius:18px;background:linear-gradient(180deg,#fbfdff,#f6f9fe);padding:28px;text-align:center}.swt-drop svg{width:46px;height:46px;color:#0b57d0;margin-bottom:10px}.swt-drop h2{margin:0;font-size:22px}.swt-drop p{margin:8px auto 17px;color:#5f6368;line-height:1.55;max-width:650px}.swt-btn{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:10px 16px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.swt-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.swt-btn.success{background:#137333;border-color:#137333;color:#fff}.swt-btn:disabled{opacity:.45;cursor:not-allowed}.swt-file,.swt-download{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e0e3e7;border-radius:13px;padding:12px 14px;background:#fff}.swt-file span,.swt-download span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.swt-status{color:#5f6368;font-size:13px;line-height:1.55}.swt-warning{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}.swt-result{display:grid;gap:9px}.swt-result-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.swt-result textarea{width:100%;min-height:240px;resize:vertical;box-sizing:border-box;border:1px solid #d4d9e1;border-radius:12px;padding:13px;font:13px/1.55 Arial,Helvetica,sans-serif}.swt-meta{font-size:12px;color:#5f6368}.swt-downloads{display:grid;gap:8px}@media(max-width:650px){.swt-drop{padding:22px 13px}.swt-file,.swt-download,.swt-result-head{align-items:flex-start;flex-direction:column}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" onChange={(event) => choose(event.target.files)} />
      <div className="swt-drop"><ScanText /><h2>Convert a scan to Word</h2><p>Upload a scanned PDF, JPG, JPEG, or PNG. OCR extracts readable text and creates an editable DOCX document in your browser.</p><button className="swt-btn primary" type="button" onClick={() => inputRef.current?.click()} disabled={busy}><FileUp size={17} />{file ? 'Choose another scan' : 'Choose scan'}</button></div>
      {file ? <div className="swt-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div><button className="swt-btn" type="button" onClick={reset} disabled={busy}><RefreshCw size={15} />Reset</button></div> : null}
      {file ? <button className="swt-btn primary" type="button" onClick={run} disabled={busy}>{busy ? 'Running OCR…' : 'Convert scan to Word'}</button> : null}
      <div className="swt-status" role="status">{status}</div>
      {warnings.map((warning) => <div className="swt-warning" key={warning}>{warning}</div>)}
      {text ? <div className="swt-result"><div className="swt-result-head"><div><strong>Recognized text</strong><div className="swt-meta">{pageCount ? `${pageCount} ${pageCount === 1 ? 'page' : 'pages'}` : ''}{pageCount && confidence !== null ? ' · ' : ''}{confidence !== null ? `${confidence.toFixed(0)}% OCR confidence` : ''}</div></div><button className="swt-btn" type="button" onClick={copyText}><Clipboard size={15} />Copy text</button></div><textarea readOnly value={text} aria-label="Recognized scan text" /></div> : null}
      <div className="swt-downloads">{downloads.map((item) => <div className="swt-download" key={item.url}><div><strong>{item.name}</strong><span>{formatBytes(item.size)}</span></div><a className="swt-btn success" href={item.url} download={item.name} onClick={() => trackToolEvent('tool_download', { toolId, outputType: item.outputType })}><Download size={16} />{item.label}</a></div>)}</div>
    </div>
  );
}
