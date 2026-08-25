'use client';

import { useEffect, useRef, useState } from 'react';
import { Clipboard, Download, FileUp, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type ImageToWordMode = 'image-to-word' | 'jpg-to-word' | 'png-to-word';

type DownloadItem = { name: string; url: string; size: number; label: string; outputType: string };

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function accepted(mode: ImageToWordMode) {
  if (mode === 'jpg-to-word') return { accept: 'image/jpeg,.jpg,.jpeg', expectedFormat: 'jpg' as const, label: 'JPG or JPEG' };
  if (mode === 'png-to-word') return { accept: 'image/png,.png', expectedFormat: 'png' as const, label: 'PNG' };
  return { accept: 'image/jpeg,image/png,.jpg,.jpeg,.png', expectedFormat: 'image' as const, label: 'JPG, JPEG, or PNG' };
}

export function ImageToWordInterface({ mode, toolId }: { mode: ImageToWordMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose an image to begin.');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const config = accepted(mode);

  useEffect(() => () => downloads.forEach((item) => URL.revokeObjectURL(item.url)), [downloads]);

  function replaceDownloads(next: Array<{ name: string; blob: Blob; label: string; outputType: string }>) {
    downloads.forEach((item) => URL.revokeObjectURL(item.url));
    setDownloads(next.map((item) => ({ name: item.name, url: URL.createObjectURL(item.blob), size: item.blob.size, label: item.label, outputType: item.outputType })));
  }

  function choose(selected: FileList | null) {
    const next = selected?.[0];
    if (!next) return;
    const isJpg = next.type === 'image/jpeg' || /\.jpe?g$/i.test(next.name);
    const isPng = next.type === 'image/png' || /\.png$/i.test(next.name);
    const valid = config.expectedFormat === 'image' ? isJpg || isPng : config.expectedFormat === 'jpg' ? isJpg : isPng;
    if (!valid) {
      setStatus(`Choose a ${config.label} image.`);
      return;
    }
    replaceDownloads([]);
    setFile(next);
    setText('');
    setConfidence(null);
    setWarnings([]);
    setStatus('Ready to recognize text and create a Word document.');
    trackToolEvent('tool_start', { toolId, fileType: isPng ? 'png' : 'jpg', metadata: { size: next.size } });
  }

  async function run() {
    if (!file || busy) return;
    setBusy(true);
    setText('');
    setConfidence(null);
    setWarnings([]);
    replaceDownloads([]);
    setStatus('Recognizing text in your browser…');
    try {
      const { imageToWordProcessor } = await import('@/tools/image');
      const result = await imageToWordProcessor.process(file as never, { expectedFormat: config.expectedFormat, language: 'eng' });
      if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'Image to Word conversion failed.');
      setText(result.text);
      setConfidence(result.confidence);
      setWarnings(result.warnings.map((item) => item.message));
      replaceDownloads([
        { name: result.output.name, blob: result.output.blob, label: 'Download Word file', outputType: 'docx' },
        { name: result.output.name.replace(/\.docx$/i, '.txt'), blob: new Blob([result.text], { type: 'text/plain;charset=utf-8' }), label: 'Download recognized text', outputType: 'txt' },
      ]);
      setStatus(`Recognized text and created an editable DOCX${result.confidence === null ? '' : ` · ${result.confidence.toFixed(0)}% OCR confidence`}.`);
      trackToolEvent('tool_success', { toolId, fileType: result.detectedFormat ?? 'image', outputType: 'docx', metadata: { confidence: result.confidence ?? 0 } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The image could not be converted to Word.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'image', metadata: { message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    replaceDownloads([]);
    setFile(null);
    setText('');
    setConfidence(null);
    setWarnings([]);
    setStatus('Choose an image to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function copyText() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setStatus('Recognized text copied to clipboard.');
    trackToolEvent('tool_download', { toolId, outputType: 'clipboard' });
  }

  return (
    <div className="image-word-tool">
      <style>{`
        .image-word-tool{display:grid;gap:16px}.iwt-drop{border:2px dashed #d4d9e1;border-radius:18px;background:linear-gradient(180deg,#fbfdff,#f6f9fe);padding:28px;text-align:center}.iwt-drop svg{width:46px;height:46px;color:#0b57d0;margin-bottom:10px}.iwt-drop h2{margin:0;font-size:22px}.iwt-drop p{margin:8px auto 17px;color:#5f6368;line-height:1.55;max-width:620px}.iwt-btn{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:10px 16px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.iwt-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.iwt-btn.success{background:#137333;border-color:#137333;color:#fff}.iwt-btn:disabled{opacity:.45;cursor:not-allowed}.iwt-file{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e0e3e7;border-radius:12px;padding:11px 13px;background:#fff}.iwt-file strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.iwt-file span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.iwt-actions{display:flex;gap:8px;flex-wrap:wrap}.iwt-status{color:#5f6368;font-size:13px;line-height:1.5}.iwt-warning{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}.iwt-result{display:grid;gap:9px}.iwt-result-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.iwt-result textarea{width:100%;min-height:220px;resize:vertical;box-sizing:border-box;border:1px solid #d4d9e1;border-radius:12px;padding:13px;font:13px/1.55 Arial,Helvetica,sans-serif}.iwt-confidence{font-size:12px;color:#5f6368}.iwt-downloads{display:grid;gap:8px}.iwt-download{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #cde3d3;border-radius:14px;padding:13px 15px;background:#f4faf6}.iwt-download strong{display:block}.iwt-download span{display:block;color:#5f6368;font-size:11px;margin-top:3px}@media(max-width:650px){.iwt-drop{padding:22px 13px}.iwt-file,.iwt-download,.iwt-result-head{align-items:flex-start;flex-direction:column}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept={config.accept} onChange={(event) => choose(event.target.files)} />
      <div className="iwt-drop"><ImageIcon /><h2>Convert {config.label} image to Word</h2><p>OCR reads visible text from the image and creates an editable DOCX document. Clear, high-resolution text produces the best result.</p><button className="iwt-btn primary" type="button" onClick={() => inputRef.current?.click()} disabled={busy}><FileUp size={17} />{file ? 'Choose another image' : 'Choose image'}</button></div>
      {file ? <div className="iwt-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div><button className="iwt-btn" type="button" onClick={reset} disabled={busy}><RefreshCw size={15} />Reset</button></div> : null}
      {file ? <div className="iwt-actions"><button className="iwt-btn primary" type="button" onClick={run} disabled={busy}>{busy ? 'Recognizing text…' : 'Convert to Word'}</button></div> : null}
      <div className="iwt-status" role="status">{status}</div>
      {warnings.map((warning) => <div className="iwt-warning" key={warning}>{warning}</div>)}
      {text ? <div className="iwt-result"><div className="iwt-result-head"><div><strong>Recognized text</strong>{confidence !== null ? <div className="iwt-confidence">OCR confidence: {confidence.toFixed(0)}%</div> : null}</div><button className="iwt-btn" type="button" onClick={copyText}><Clipboard size={15} />Copy text</button></div><textarea readOnly value={text} aria-label="Recognized text" /></div> : null}
      <div className="iwt-downloads">{downloads.map((item) => <div className="iwt-download" key={item.url}><div><strong>{item.name}</strong><span>{formatBytes(item.size)}</span></div><a className="iwt-btn success" href={item.url} download={item.name} onClick={() => trackToolEvent('tool_download', { toolId, outputType: item.outputType })}><Download size={16} />{item.label}</a></div>)}</div>
    </div>
  );
}
