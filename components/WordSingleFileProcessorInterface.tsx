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

type BatchOutput = {
  sourceName: string;
  name: string;
  url: string;
  size: number;
  type: string;
};

const MAX_FILES = 50;

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

function invalidFileMessage(accept: string, inputLabel: string) {
  if (accept.toLowerCase().includes('.docx')) return 'Only .docx files are accepted.';
  return `Please choose ${inputLabel}.`;
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
  const outputUrlsRef = useRef<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [outputs, setOutputs] = useState<BatchOutput[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationMessage, setValidationMessage] = useState('');
  const [limitMessage, setLimitMessage] = useState('');

  useEffect(() => () => {
    outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    outputUrlsRef.current = [];
  }, []);

  function clearOutputs() {
    outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    outputUrlsRef.current = [];
    setOutputs([]);
  }

  async function processFiles(selectedFiles: File[]) {
    if (!selectedFiles.length || busy) return;

    const cappedFiles = selectedFiles.slice(0, MAX_FILES);
    const validFiles = cappedFiles.filter((file) => fileMatchesAccept(file, accept));
    const invalidFiles = cappedFiles.filter((file) => !fileMatchesAccept(file, accept));

    setLimitMessage(selectedFiles.length > MAX_FILES
      ? `You can upload up to ${MAX_FILES} files at a time. Only the first ${MAX_FILES} were added.`
      : '');
    setValidationMessage(invalidFiles.length > 0 ? invalidFileMessage(accept, inputLabel) : '');

    if (!validFiles.length) {
      clearOutputs();
      setWarnings([]);
      setFileName(invalidFiles.length === 1 ? invalidFiles[0].name : `${invalidFiles.length} unsupported files`);
      setStatus(invalidFileMessage(accept, inputLabel));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    clearOutputs();
    setWarnings([]);
    setBusy(true);
    setFileName(validFiles.length === 1 ? validFiles[0].name : `${validFiles.length} files`);

    const completed: BatchOutput[] = [];
    const warningSet = new Set<string>();
    let failedCount = 0;

    try {
      for (let index = 0; index < validFiles.length; index += 1) {
        const file = validFiles[index];
        const progress = validFiles.length > 1 ? ` (${index + 1} of ${validFiles.length})` : '';
        setFileName(validFiles.length === 1 ? file.name : `${index + 1} of ${validFiles.length}: ${file.name}`);
        setStatus(processorId === 'docx-to-html'
          ? `Converting your DOCX to HTML${progress}…`
          : `${actionLabel}${progress}…`);

        trackToolEvent('tool_start', {
          toolId: processorId,
          fileType: file.type || file.name.split('.').pop() || 'unknown',
        });

        try {
          const result = await processors[processorId].process(file);
          if (!result.success || !result.output) {
            failedCount += 1;
            trackToolEvent('tool_error', { toolId: processorId, fileType: file.type || 'unknown' });
            continue;
          }

          const url = URL.createObjectURL(result.output.blob);
          outputUrlsRef.current.push(url);
          const output: BatchOutput = {
            sourceName: file.name,
            name: result.output.name,
            url,
            size: result.output.size,
            type: result.output.type,
          };
          completed.push(output);
          setOutputs([...completed]);

          userFacingWarnings(processorId, result.warnings).forEach((warning) => warningSet.add(warning));
          trackToolEvent('tool_success', {
            toolId: processorId,
            fileType: file.type || 'unknown',
            outputType: result.output.type,
            metadata: { outputSize: result.output.size },
          });
        } catch {
          failedCount += 1;
          trackToolEvent('tool_error', { toolId: processorId, fileType: file.type || 'unknown' });
        }
      }

      setWarnings(Array.from(warningSet));
      setFileName(validFiles.length === 1 ? validFiles[0].name : `${validFiles.length} files`);

      if (completed.length === 0) {
        setStatus(validFiles.length === 1
          ? 'The file could not be processed. Please try another file.'
          : `None of the ${validFiles.length} files could be processed.`);
      } else if (failedCount > 0) {
        setStatus(`${completed.length} of ${validFiles.length} files completed. ${failedCount} ${failedCount === 1 ? 'file' : 'files'} could not be processed.`);
      } else if (validFiles.length === 1) {
        setStatus(processorId === 'docx-to-html'
          ? 'Conversion complete. Your HTML file is ready to download.'
          : 'Your output file is ready.');
      } else if (processorId === 'docx-to-html') {
        setStatus(`Conversion complete. ${completed.length} HTML files are ready to download.`);
      } else {
        setStatus(`${completed.length} files are ready to download.`);
      }
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
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragging(false);
    if (busy) return;
    const files = Array.from(event.dataTransfer.files || []);
    if (!files.length) return;
    void processFiles(files);
  }

  const helperText = busy
    ? 'Working on your files…'
    : dragging
      ? `Drop up to ${MAX_FILES} files to start`
      : `or drag & drop up to ${MAX_FILES} files here`;

  return (
    <div className="fwo-single-processor" data-native-upload-ui="true">
      <style>{`
        .fwo-single-processor{display:grid;gap:18px}.fwo-single-drop{min-height:320px;border:1.5px dashed #d6dde8;border-radius:20px;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%);display:flex;align-items:center;justify-content:center;text-align:center;padding:38px 24px;transition:border-color .16s ease,background-color .16s ease,box-shadow .16s ease}.fwo-single-drop.is-dragging{border-color:#2563eb;background:#f7faff;box-shadow:0 0 0 4px rgba(37,99,235,.08)}.fwo-single-drop-inner{width:min(620px,100%);display:flex;flex-direction:column;align-items:center;justify-content:center}.fwo-single-button,.fwo-single-download{border:0;text-decoration:none;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.fwo-single-button{min-width:184px;min-height:52px;padding:0 25px;border-radius:14px;background:#2563eb;color:#fff;font-size:15px;line-height:1;gap:9px;box-shadow:0 7px 18px rgba(37,99,235,.18);transition:background-color .14s ease,box-shadow .14s ease}.fwo-single-button:hover:not(:disabled){background:#1d4ed8;box-shadow:0 9px 22px rgba(37,99,235,.22)}.fwo-single-button:focus-visible{outline:3px solid rgba(37,99,235,.22);outline-offset:3px}.fwo-single-button:disabled{opacity:.88;cursor:wait}.fwo-single-button svg{display:block!important;width:18px!important;height:18px!important;flex:0 0 auto;color:#fff!important;stroke:#fff!important}.fwo-single-button:disabled svg{animation:fwo-spin .8s linear infinite}.fwo-single-drop-hint{display:block!important;visibility:visible!important;opacity:1!important;position:static!important;width:auto!important;height:auto!important;margin:14px 0 0!important;padding:0!important;color:#64748b!important;font-size:14px!important;font-weight:500!important;line-height:1.5!important;transform:none!important}.fwo-single-meta{position:static!important;width:min(580px,100%);margin:18px 0 0!important;padding:0!important;color:#5f6368;font-size:13px;line-height:1.55;display:flex!important;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;transform:none!important}.fwo-single-meta strong{color:#202124;max-width:330px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fwo-single-meta.is-busy{color:#2563eb;font-weight:650}.fwo-single-meta-status{display:inline-flex;align-items:center;gap:7px}.fwo-single-meta-spinner{width:15px;height:15px;animation:fwo-spin .8s linear infinite}.fwo-single-results{display:grid;gap:10px}.fwo-single-result{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border:1px solid #cde3d3;border-radius:14px;padding:14px 16px;background:#f4faf6}.fwo-single-result-main{display:flex;align-items:center;gap:11px;min-width:0}.fwo-single-result-icon{width:40px;height:40px;border-radius:11px;background:#e6f4ea;color:#137333;display:grid;place-items:center;flex:0 0 auto}.fwo-single-result-icon svg{width:20px}.fwo-single-result-copy{min-width:0}.fwo-single-result-copy strong{display:block;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fwo-single-result-copy span{display:block;color:#5f6368;font-size:12px;margin-top:4px}.fwo-single-download{min-height:46px;padding:0 18px;border-radius:11px;background:#137333;color:#fff;gap:8px}.fwo-single-warning,.fwo-single-error,.fwo-single-limit{font-size:13px;line-height:1.5;border-radius:10px;padding:10px 12px}.fwo-single-warning,.fwo-single-limit{color:#66531b;background:#fffaf0;border:1px solid #f3e3b2}.fwo-single-error{color:#9f1239;background:#fff1f2;border:1px solid #fecdd3}@keyframes fwo-spin{to{transform:rotate(360deg)}}@media(max-width:640px){.fwo-single-drop{min-height:290px;padding:30px 16px}.fwo-single-button{min-width:176px;min-height:50px;padding:0 22px}.fwo-single-result-copy strong{max-width:230px}.fwo-single-meta{margin-top:16px!important;font-size:12px}.fwo-single-result{align-items:flex-start}.fwo-single-download{width:100%}}
        .platform-task-page .fwo-single-processor[data-native-upload-ui="true"] .fwo-single-button{gap:9px!important;transform:none!important;}
        .platform-task-page .fwo-single-processor[data-native-upload-ui="true"] .fwo-single-button:hover:not(:disabled){transform:none!important;}
        .platform-task-page .fwo-single-processor[data-native-upload-ui="true"] .fwo-single-button svg{display:block!important;width:18px!important;height:18px!important;color:#fff!important;stroke:#fff!important;}
        .platform-task-page .fwo-single-processor[data-native-upload-ui="true"] .fwo-single-drop-hint{display:block!important;visibility:visible!important;opacity:1!important;position:static!important;top:auto!important;left:auto!important;width:auto!important;height:auto!important;margin:14px 0 0!important;padding:0!important;transform:none!important;}
        .platform-task-page .fwo-single-processor[data-native-upload-ui="true"] .fwo-single-meta{display:flex!important;position:static!important;top:auto!important;left:auto!important;margin:18px 0 0!important;padding:0!important;transform:none!important;}
      `}</style>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={accept}
        multiple
        onChange={(event) => void processFiles(Array.from(event.target.files || []))}
      />
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
            aria-label={busy ? actionLabel : `Choose up to ${MAX_FILES} files`}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <RefreshCw aria-hidden="true" /> : <FileUp aria-hidden="true" />}
            <span>{busy ? actionLabel : 'Choose Files'}</span>
          </button>
          <span className="fwo-single-drop-hint">{helperText}</span>
          {(fileName || status) ? (
            <div className={`fwo-single-meta${busy ? ' is-busy' : ''}`} role="status" aria-live="polite">
              {fileName ? <strong>{fileName}</strong> : null}
              {fileName && status ? <span aria-hidden="true">·</span> : null}
              {status ? <span className="fwo-single-meta-status">{busy ? <RefreshCw className="fwo-single-meta-spinner" aria-hidden="true" /> : null}{status}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
      {validationMessage ? <div className="fwo-single-error" role="alert">{validationMessage}</div> : null}
      {limitMessage ? <div className="fwo-single-limit" role="status">{limitMessage}</div> : null}
      {warnings.length > 0 ? <div className="fwo-single-warning">{warnings.slice(0, 3).join(' · ')}</div> : null}
      {outputs.length > 0 ? (
        <div className="fwo-single-results">
          {outputs.map((output) => (
            <div className="fwo-single-result" key={output.url}>
              <div className="fwo-single-result-main">
                <span className="fwo-single-result-icon"><FileOutput /></span>
                <span className="fwo-single-result-copy">
                  <strong>{output.name}</strong>
                  <span>{output.sourceName} · {formatBytes(output.size)}</span>
                </span>
              </div>
              <a
                className="fwo-single-download"
                href={output.url}
                download={output.name}
                onClick={() => trackToolEvent('tool_download', { toolId: processorId, outputType: output.type || output.name.split('.').pop() || 'unknown' })}
              >
                <Download />{downloadLabel}
              </a>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
