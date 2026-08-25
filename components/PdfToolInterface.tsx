'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Clipboard, Download, FileOutput, FileUp, RefreshCw, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type PdfToolMode = 'pdf-to-word' | 'compress-pdf' | 'merge-pdf' | 'split-pdf' | 'pdf-ocr';

type DownloadItem = {
  name: string;
  url: string;
  size: number;
  label: string;
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function baseName(name: string) {
  return name.replace(/\.pdf$/i, '') || 'document';
}

function bytesBlob(data: Uint8Array, type = 'application/pdf') {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return new Blob([buffer], { type });
}

function parseSplitSelection(value: string): { pages: number[]; ranges: string[] } | null {
  const pages: number[] = [];
  const ranges: string[] = [];
  const tokens = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (!tokens.length) return null;
  for (const token of tokens) {
    if (/^\d+$/.test(token)) pages.push(Number(token));
    else if (/^\d+\s*-\s*\d+$/.test(token)) ranges.push(token.replace(/\s+/g, ''));
    else return null;
  }
  return { pages, ranges };
}

export function PdfToolInterface({ mode, toolId }: { mode: PdfToolMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a PDF file to begin.');
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [preservePageBreaks, setPreservePageBreaks] = useState(true);
  const [splitEveryPage, setSplitEveryPage] = useState(false);
  const [splitSelection, setSplitSelection] = useState('1');
  const [ocrText, setOcrText] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

  const multiple = mode === 'merge-pdf';
  const ready = multiple ? files.length >= 2 : files.length === 1;
  const splitParsed = useMemo(() => parseSplitSelection(splitSelection), [splitSelection]);

  useEffect(() => () => {
    downloads.forEach((item) => URL.revokeObjectURL(item.url));
  }, [downloads]);

  function replaceDownloads(next: Array<{ name: string; blob: Blob; size?: number; label: string }>) {
    downloads.forEach((item) => URL.revokeObjectURL(item.url));
    setDownloads(next.map((item) => ({
      name: item.name,
      url: URL.createObjectURL(item.blob),
      size: item.size ?? item.blob.size,
      label: item.label,
    })));
  }

  function onFiles(selected: FileList | null) {
    if (!selected) return;
    const next = Array.from(selected).filter((file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
    if (!next.length) {
      setStatus('Please choose a PDF file.');
      return;
    }
    setFiles(multiple ? next : [next[0]]);
    setStatus(multiple && next.length < 2 ? 'Choose at least two PDF files.' : 'Ready to process.');
    setWarnings([]);
    setOcrText('');
    setOcrConfidence(null);
    replaceDownloads([]);
    trackToolEvent('tool_start', { toolId, fileType: 'pdf', metadata: { fileCount: next.length } });
  }

  function reset() {
    replaceDownloads([]);
    setFiles([]);
    setWarnings([]);
    setOcrText('');
    setOcrConfidence(null);
    setStatus('Choose a PDF file to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  function moveFile(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    setFiles((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function run() {
    if (!ready || busy) return;
    if (mode === 'split-pdf' && !splitEveryPage && !splitParsed) {
      setStatus('Enter pages such as 1,3,5-7 or choose Separate every page.');
      return;
    }

    setBusy(true);
    setWarnings([]);
    setOcrText('');
    setOcrConfidence(null);
    replaceDownloads([]);
    setStatus('Processing in your browser…');

    try {
      const pdfTools = await import('@/tools/pdf');

      if (mode === 'pdf-to-word') {
        const result = await pdfTools.pdfToWordProcessor.process(files[0] as never, { preservePageBreaks });
        if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'PDF to Word conversion failed.');
        replaceDownloads([{ name: result.output.name, blob: result.output.blob, size: result.output.size, label: 'Download Word file' }]);
        setWarnings(result.warnings.map((item) => item.message));
        setStatus(`Converted ${result.originalPageCount ?? ''} ${result.originalPageCount === 1 ? 'page' : 'pages'} to DOCX.`.trim());
      }

      if (mode === 'compress-pdf') {
        const result = await pdfTools.pdfCompressorProcessor.process(files[0] as never, { level: compressionLevel });
        if (!result.success || !result.data) throw new Error(result.errors[0]?.message || 'PDF compression failed.');
        const blob = bytesBlob(result.data);
        replaceDownloads([{ name: `${baseName(files[0].name)}-compressed.pdf`, blob, label: 'Download compressed PDF' }]);
        setStatus(`Saved ${formatBytes(result.bytesSaved)}${result.compressionPercentage === null ? '' : ` (${result.compressionPercentage.toFixed(1)}%)`}.`);
      }

      if (mode === 'merge-pdf') {
        const result = await pdfTools.pdfMergeProcessor.process(files as never, {});
        if (!result.success || !result.data) throw new Error(result.errors[0]?.message || 'PDF merge failed.');
        const blob = bytesBlob(result.data);
        replaceDownloads([{ name: 'merged.pdf', blob, label: 'Download merged PDF' }]);
        setStatus(`Combined ${result.sourceFileCount} PDFs${result.pageCount ? ` into ${result.pageCount} pages` : ''}.`);
      }

      if (mode === 'split-pdf') {
        const options = splitEveryPage
          ? { everyPage: true }
          : { pages: splitParsed?.pages ?? [], ranges: splitParsed?.ranges ?? [] };
        const result = await pdfTools.pdfSplitProcessor.process(files[0] as never, options);
        if (!result.success || !result.outputs?.length) throw new Error(result.errors[0]?.message || 'PDF split failed.');
        if (result.outputs.length === 1) {
          const output = result.outputs[0];
          replaceDownloads([{ name: output.name, blob: bytesBlob(output.data), size: output.size, label: 'Download split PDF' }]);
        } else {
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          result.outputs.forEach((output) => zip.file(output.name, output.data));
          const blob = await zip.generateAsync({ type: 'blob' });
          replaceDownloads([{ name: `${baseName(files[0].name)}-split-pages.zip`, blob, label: 'Download split PDFs' }]);
        }
        setStatus(`Created ${result.resultingFileCount} ${result.resultingFileCount === 1 ? 'PDF' : 'PDF files'}.`);
      }

      if (mode === 'pdf-ocr') {
        const result = await pdfTools.pdfOcrProcessor.process(files[0] as never, { allPages: true, language: 'eng', searchablePdf: true, renderScale: 2 });
        if (!result.success) throw new Error(result.errors[0]?.message || 'PDF OCR failed.');
        setOcrText(result.text);
        setOcrConfidence(result.confidence);
        setWarnings(result.warnings.map((item) => item.message));
        const outputDownloads: Array<{ name: string; blob: Blob; size?: number; label: string }> = [];
        if (result.output) outputDownloads.push({ name: result.output.name, blob: result.output.blob, size: result.output.size, label: 'Download searchable PDF' });
        if (result.text) outputDownloads.push({ name: `${baseName(files[0].name)}-ocr.txt`, blob: new Blob([result.text], { type: 'text/plain;charset=utf-8' }), label: 'Download OCR text' });
        replaceDownloads(outputDownloads);
        setStatus(`OCR completed for ${result.processedPageCount} ${result.processedPageCount === 1 ? 'page' : 'pages'}.`);
      }

      trackToolEvent('tool_success', { toolId, fileType: 'pdf', metadata: { fileCount: files.length } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The PDF could not be processed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { message } });
    } finally {
      setBusy(false);
    }
  }

  async function copyOcrText() {
    if (!ocrText) return;
    await navigator.clipboard.writeText(ocrText);
    setStatus('OCR text copied to clipboard.');
    trackToolEvent('tool_download', { toolId, outputType: 'clipboard' });
  }

  const actionLabel = mode === 'pdf-to-word'
    ? 'Convert to Word'
    : mode === 'compress-pdf'
      ? 'Compress PDF'
      : mode === 'merge-pdf'
        ? 'Merge PDFs'
        : mode === 'split-pdf'
          ? 'Split PDF'
          : 'Run OCR';

  return (
    <div className="pdf-tool-interface">
      <style>{`
        .pdf-tool-interface{display:grid;gap:16px}.pdf-tool-input{border:2px dashed #d4d9e1;border-radius:18px;background:linear-gradient(180deg,#fbfdff,#f6f9fe);padding:28px;text-align:center}.pdf-tool-input svg{width:46px;height:46px;color:#0b57d0;margin-bottom:10px}.pdf-tool-input h2{margin:0;font-size:22px}.pdf-tool-input p{margin:8px auto 17px;color:#5f6368;line-height:1.55;max-width:620px}.pdf-tool-button{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:10px 16px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.pdf-tool-button.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.pdf-tool-button.success{background:#137333;border-color:#137333;color:#fff}.pdf-tool-button:disabled{opacity:.45;cursor:not-allowed}.pdf-tool-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid #e0e3e7;border-radius:14px;background:#fff;padding:13px}.pdf-tool-controls label{font-size:13px;font-weight:650}.pdf-tool-select,.pdf-tool-text{border:1px solid #d4d9e1;border-radius:10px;padding:9px 11px;background:#fff;color:#202124}.pdf-tool-text{min-width:240px}.pdf-tool-file-list{display:grid;gap:8px}.pdf-tool-file{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e0e3e7;border-radius:12px;padding:10px 12px;background:#fff}.pdf-tool-file-main{min-width:0}.pdf-tool-file-main strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pdf-tool-file-main span{color:#5f6368;font-size:11px}.pdf-tool-file-actions{display:flex;gap:4px}.pdf-tool-icon-button{border:0;background:#f1f3f4;border-radius:9px;width:32px;height:32px;display:grid;place-items:center;cursor:pointer}.pdf-tool-icon-button:disabled{opacity:.35}.pdf-tool-action-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.pdf-tool-status{color:#5f6368;font-size:13px;line-height:1.5}.pdf-tool-warning{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}.pdf-tool-downloads{display:grid;gap:8px}.pdf-tool-download{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #cde3d3;border-radius:14px;padding:13px 15px;background:#f4faf6}.pdf-tool-download-main{display:flex;align-items:center;gap:10px;min-width:0}.pdf-tool-download-main svg{color:#137333}.pdf-tool-download-main strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px}.pdf-tool-download-main span{display:block;font-size:11px;color:#5f6368;margin-top:3px}.pdf-tool-ocr{display:grid;gap:8px}.pdf-tool-ocr textarea{width:100%;min-height:220px;resize:vertical;border:1px solid #d4d9e1;border-radius:12px;padding:13px;box-sizing:border-box;font:13px/1.55 Arial,Helvetica,sans-serif}.pdf-tool-confidence{font-size:12px;color:#5f6368}@media(max-width:650px){.pdf-tool-input{padding:22px 13px}.pdf-tool-download,.pdf-tool-file{align-items:flex-start;flex-direction:column}.pdf-tool-download-main strong{max-width:240px}.pdf-tool-text{width:100%;min-width:0}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" multiple={multiple} onChange={(event) => onFiles(event.target.files)} />
      <div className="pdf-tool-input">
        <FileUp />
        <h2>{multiple ? 'Choose PDF files' : 'Choose a PDF file'}</h2>
        <p>{multiple ? 'Select two or more PDFs. Their order below becomes the order in the merged PDF.' : 'Processing is performed by the browser-based PDF engine.'}</p>
        <button type="button" className="pdf-tool-button primary" onClick={() => inputRef.current?.click()} disabled={busy}>
          <FileUp size={17} />{files.length ? 'Choose again' : multiple ? 'Choose PDFs' : 'Choose PDF'}
        </button>
      </div>

      {files.length ? (
        <div className="pdf-tool-file-list">
          {files.map((file, index) => (
            <div className="pdf-tool-file" key={`${file.name}-${file.lastModified}-${index}`}>
              <div className="pdf-tool-file-main"><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div>
              {multiple ? <div className="pdf-tool-file-actions">
                <button className="pdf-tool-icon-button" type="button" disabled={index === 0 || busy} onClick={() => moveFile(index, -1)} aria-label="Move file up"><ArrowUp size={16} /></button>
                <button className="pdf-tool-icon-button" type="button" disabled={index === files.length - 1 || busy} onClick={() => moveFile(index, 1)} aria-label="Move file down"><ArrowDown size={16} /></button>
                <button className="pdf-tool-icon-button" type="button" disabled={busy} onClick={() => removeFile(index)} aria-label="Remove file"><Trash2 size={16} /></button>
              </div> : null}
            </div>
          ))}
        </div>
      ) : null}

      {mode === 'compress-pdf' ? <div className="pdf-tool-controls"><label htmlFor="compression-level">Compression</label><select id="compression-level" className="pdf-tool-select" value={compressionLevel} onChange={(event) => setCompressionLevel(event.target.value as typeof compressionLevel)} disabled={busy}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div> : null}
      {mode === 'pdf-to-word' ? <div className="pdf-tool-controls"><label><input type="checkbox" checked={preservePageBreaks} onChange={(event) => setPreservePageBreaks(event.target.checked)} disabled={busy} /> Preserve PDF page breaks in DOCX</label></div> : null}
      {mode === 'split-pdf' ? <div className="pdf-tool-controls"><label><input type="checkbox" checked={splitEveryPage} onChange={(event) => setSplitEveryPage(event.target.checked)} disabled={busy} /> Separate every page</label>{!splitEveryPage ? <><label htmlFor="split-pages">Pages</label><input id="split-pages" className="pdf-tool-text" value={splitSelection} onChange={(event) => setSplitSelection(event.target.value)} placeholder="1,3,5-7" disabled={busy} /></> : null}</div> : null}
      {mode === 'pdf-ocr' ? <div className="pdf-tool-controls"><span className="pdf-tool-status">English OCR · all pages · creates searchable PDF when possible</span></div> : null}

      <div className="pdf-tool-action-row">
        <button type="button" className="pdf-tool-button primary" disabled={!ready || busy || (mode === 'split-pdf' && !splitEveryPage && !splitParsed)} onClick={() => void run()}>{busy ? <RefreshCw size={17} /> : <FileOutput size={17} />}{busy ? 'Processing…' : actionLabel}</button>
        {files.length ? <button type="button" className="pdf-tool-button" disabled={busy} onClick={reset}><Trash2 size={16} />Clear</button> : null}
        <span className="pdf-tool-status" aria-live="polite">{status}</span>
      </div>

      {warnings.map((item) => <div className="pdf-tool-warning" key={item}>{item}</div>)}

      {ocrText ? <div className="pdf-tool-ocr"><div className="pdf-tool-action-row"><strong>Recognized text</strong>{ocrConfidence !== null ? <span className="pdf-tool-confidence">Average confidence: {ocrConfidence.toFixed(1)}%</span> : null}<button type="button" className="pdf-tool-button" onClick={() => void copyOcrText()}><Clipboard size={16} />Copy text</button></div><textarea readOnly value={ocrText} aria-label="Recognized OCR text" /></div> : null}

      {downloads.length ? <div className="pdf-tool-downloads">{downloads.map((item) => <div className="pdf-tool-download" key={item.url}><div className="pdf-tool-download-main"><FileOutput size={20} /><div><strong>{item.name}</strong><span>{formatBytes(item.size)}</span></div></div><a className="pdf-tool-button success" href={item.url} download={item.name} onClick={() => trackToolEvent('tool_download', { toolId, outputType: item.name.split('.').pop() || 'file' })}><Download size={16} />{item.label}</a></div>)}</div> : null}
    </div>
  );
}
