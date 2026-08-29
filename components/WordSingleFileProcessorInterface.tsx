'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileOutput, FileUp, RefreshCw } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import {
  docxCompressProcessor,
  docxRemoveMetadataProcessor,
  docxRepairProcessor,
  docxToHtmlProcessor,
  docxToOdtProcessor,
  docxToRtfProcessor,
  docxToTxtProcessor,
  htmlToDocxProcessor,
  odtToDocxProcessor,
  rtfToDocxProcessor,
  txtToDocxProcessor,
} from '@/tools/word';

type ProcessorId =
  | 'docx-to-html'
  | 'html-to-docx'
  | 'docx-to-txt'
  | 'txt-to-docx'
  | 'docx-to-rtf'
  | 'rtf-to-docx'
  | 'docx-to-odt'
  | 'odt-to-docx'
  | 'compress-docx'
  | 'repair-docx'
  | 'remove-word-metadata';

type GenericResult = {
  success: boolean;
  outputSize: number;
  output?: { name: string; blob: Blob; size: number; type: string };
  warnings: Array<{ message: string }>;
  errors: Array<{ message: string }>;
};

type GenericProcessor = {
  process(input: File, options?: Record<string, unknown>): Promise<GenericResult>;
};

const processors: Record<ProcessorId, GenericProcessor> = {
  'docx-to-html': docxToHtmlProcessor as unknown as GenericProcessor,
  'html-to-docx': htmlToDocxProcessor as unknown as GenericProcessor,
  'docx-to-txt': docxToTxtProcessor as unknown as GenericProcessor,
  'txt-to-docx': txtToDocxProcessor as unknown as GenericProcessor,
  'docx-to-rtf': docxToRtfProcessor as unknown as GenericProcessor,
  'rtf-to-docx': rtfToDocxProcessor as unknown as GenericProcessor,
  'docx-to-odt': docxToOdtProcessor as unknown as GenericProcessor,
  'odt-to-docx': odtToDocxProcessor as unknown as GenericProcessor,
  'compress-docx': docxCompressProcessor as unknown as GenericProcessor,
  'repair-docx': docxRepairProcessor as unknown as GenericProcessor,
  'remove-word-metadata': docxRemoveMetadataProcessor as unknown as GenericProcessor,
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function fileMatchesAccept(file: File, accept: string) {
  const tokens = accept.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

function userFacingWarnings(processorId: ProcessorId, warnings: Array<{ message: string }>) {
  const messages = warnings.map((warning) => warning.message).filter(Boolean);
  if (processorId !== 'docx-to-html') return messages;

  const styleWarnings = messages.filter((message) => /unrecognised (paragraph|run) style/i.test(message));
  const otherWarnings = messages.filter((message) => !/unrecognised (paragraph|run) style/i.test(message));

  if (styleWarnings.length > 0) {
    return ['Some Word-specific formatting was simplified for HTML compatibility.', ...otherWarnings];
  }

  return otherWarnings;
}

export function WordSingleFileProcessorInterface({
  processorId,
  accept,
  inputLabel,
  actionLabel,
  downloadLabel,
}: {
  processorId: ProcessorId;
  title: string;
  description: string;
  accept: string;
  inputLabel: string;
  actionLabel: string;
  downloadLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [outputSize, setOutputSize] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  async function process(file?: File) {
    if (!file || busy) return;
    if (!fileMatchesAccept(file, accept)) {
      setFileName(file.name);
      setStatus(`Please choose ${inputLabel}.`);
      return;
    }
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');
    setWarnings([]);
    setBusy(true);
    setFileName(file.name);
    setStatus(processorId === 'docx-to-html' ? 'Converting your DOCX to HTML…' : `${actionLabel}…`);
    trackToolEvent('tool_start', { toolId: processorId, fileType: file.type || file.name.split('.').pop() || 'unknown' });
    try {
      const result = await processors[processorId].process(file);
      if (!result.success || !result.output) {
        setStatus(result.errors[0]?.message || 'The file could not be processed.');
        trackToolEvent('tool_error', { toolId: processorId, fileType: file.type || 'unknown' });
        return;
      }
      const url = URL.createObjectURL(result.output.blob);
      setDownloadUrl(url);
      setDownloadName(result.output.name);
      setOutputSize(result.output.size);
      setWarnings(userFacingWarnings(processorId, result.warnings));
      setStatus(processorId === 'docx-to-html' ? 'Conversion complete. Your HTML file is ready to download.' : 'Your output file is ready.');
      trackToolEvent('tool_success', {
        toolId: processorId,
        fileType: file.type || 'unknown',
        outputType: result.output.type,
        metadata: { outputSize: result.output.size },
      });
    } catch {
      setStatus('The file could not be processed. Please try another file.');
      trackToolEvent('tool_error', { toolId: processorId, fileType: file.type || 'unknown' });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (busy || !event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragging(true);
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (busy || !event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  }

  function onDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (!dragDepthRef.current) setDragging(false);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    const file = event.dataTransfer.files?.[0];
    if (!file || busy) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    void process(file);
  }

  const helperText = busy
    ? 'Working on your file…'
    : dragging
      ? 'Drop your file to start'
      : 'or drag & drop files here';

  return (
    <div className="fwo-single-processor" data-native-upload-ui="true">
      <style>{`
        .fwo-single-processor{display:grid;gap:17px}.fwo-single-drop{min-height:320px;border:1.5px dashed #d4d9e1;border-radius:20px;background:linear-gradient(180deg,#fff,#fbfcfe);display:grid;place-items:center;text-align:center;padding:30px;transition:border-color .16s ease,background .16s ease,box-shadow .16s ease}.fwo-single-drop.is-dragging{border-color:#2563eb;background:#f7fbff;box-shadow:0 0 0 4px rgba(37,99,235,.08)}.fwo-single-drop-inner{position:relative;width:min(560px,100%);min-height:220px}.fwo-single-button,.fwo-single-download{border:0;border-radius:12px;padding:0 24px;min-height:54px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:9px;text-decoration:none}.fwo-single-button{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:204px;background:#2563eb;color:#fff;box-shadow:0 8px 20px rgba(37,99,235,.20)}.fwo-single-button:hover:not(:disabled){transform:translate(-50%,calc(-50% - 1px));box-shadow:0 10px 24px rgba(37,99,235,.24)}.fwo-single-download{background:#137333;color:#fff}.fwo-single-button:disabled{opacity:.9;cursor:wait}.fwo-single-button svg{width:18px;height:18px}.fwo-single-button:disabled svg{animation:fwo-spin .8s linear infinite}.fwo-single-drop-hint{position:absolute;top:calc(50% + 40px);left:50%;transform:translateX(-50%);width:100%;margin:0;color:#64748b;font-size:14px;line-height:1.5}.fwo-single-meta{position:absolute;top:calc(50% + 70px);left:50%;transform:translateX(-50%);width:min(520px,100%);margin:0;color:#5f6368;font-size:13px;line-height:1.5;display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap}.fwo-single-meta strong{color:#202124;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fwo-single-meta.is-busy{color:#2563eb;font-weight:650}.fwo-single-meta-status{display:inline-flex;align-items:center;gap:7px}.fwo-single-meta-spinner{width:15px;height:15px;animation:fwo-spin .8s linear infinite}.fwo-single-result{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border:1px solid #cde3d3;border-radius:14px;padding:14px 16px;background:#f4faf6}.fwo-single-result-main{display:flex;align-items:center;gap:11px;min-width:0}.fwo-single-result-icon{width:40px;height:40px;border-radius:11px;background:#e6f4ea;color:#137333;display:grid;place-items:center}.fwo-single-result-icon svg{width:20px}.fwo-single-result-copy{min-width:0}.fwo-single-result-copy strong{display:block;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fwo-single-result-copy span{display:block;color:#5f6368;font-size:12px;margin-top:4px}.fwo-single-warning{font-size:13px;line-height:1.5;color:#66531b;background:#fffaf0;border:1px solid #f3e3b2;border-radius:10px;padding:10px 12px}@keyframes fwo-spin{to{transform:rotate(360deg)}}@media(max-width:640px){.fwo-single-drop{min-height:300px;padding:22px 14px}.fwo-single-drop-inner{min-height:210px}.fwo-single-button{min-width:190px;min-height:52px;padding:0 20px}.fwo-single-result-copy strong{max-width:230px}.fwo-single-meta{top:calc(50% + 68px);font-size:12px}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept={accept} onChange={(event) => void process(event.target.files?.[0])} />
      <div
        className={`fwo-single-drop${dragging ? ' is-dragging' : ''}`}
        data-uniform-dropzone="true"
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="fwo-single-drop-inner">
          <button
            type="button"
            className="fwo-single-button"
            disabled={busy}
            aria-busy={busy}
            aria-label={busy ? actionLabel : 'Choose Files'}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <RefreshCw aria-hidden="true" /> : <FileUp aria-hidden="true" />}
            <span>{busy ? actionLabel : 'Choose Files'}</span>
          </button>
          <p className="fwo-single-drop-hint">{helperText}</p>
          {(fileName || status) ? (
            <div className={`fwo-single-meta${busy ? ' is-busy' : ''}`} role="status" aria-live="polite">
              {fileName ? <strong>{fileName}</strong> : null}
              {fileName && status ? <span aria-hidden="true">·</span> : null}
              {status ? <span className="fwo-single-meta-status">{busy ? <RefreshCw className="fwo-single-meta-spinner" aria-hidden="true" /> : null}{status}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
      {warnings.length > 0 ? <div className="fwo-single-warning">{warnings.slice(0, 3).join(' · ')}</div> : null}
      {downloadUrl ? (
        <div className="fwo-single-result">
          <div className="fwo-single-result-main">
            <span className="fwo-single-result-icon"><FileOutput /></span>
            <span className="fwo-single-result-copy"><strong>{downloadName}</strong><span>{formatBytes(outputSize)}</span></span>
          </div>
          <a
            className="fwo-single-download"
            href={downloadUrl}
            download={downloadName}
            onClick={() => trackToolEvent('tool_download', { toolId: processorId, outputType: downloadName.split('.').pop() || 'unknown' })}
          >
            <Download />{downloadLabel}
          </a>
        </div>
      ) : null}
    </div>
  );
}
