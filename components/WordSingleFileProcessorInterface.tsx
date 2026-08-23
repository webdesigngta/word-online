'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileOutput, FileUp, RefreshCw } from 'lucide-react';
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

export function WordSingleFileProcessorInterface({
  processorId,
  title,
  description,
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
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState(`Choose ${inputLabel}.`);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [outputSize, setOutputSize] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  async function process(file?: File) {
    if (!file) return;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl('');
    setWarnings([]);
    setBusy(true);
    setFileName(file.name);
    setStatus(`${actionLabel}…`);
    try {
      const result = await processors[processorId].process(file);
      if (!result.success || !result.output) {
        setStatus(result.errors[0]?.message || 'The file could not be processed.');
        return;
      }
      const url = URL.createObjectURL(result.output.blob);
      setDownloadUrl(url);
      setDownloadName(result.output.name);
      setOutputSize(result.output.size);
      setWarnings(result.warnings.map((warning) => warning.message));
      setStatus('Your output file is ready.');
    } catch {
      setStatus('The file could not be processed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="fwo-single-processor">
      <style>{`
        .fwo-single-processor{display:grid;gap:17px}.fwo-single-drop{min-height:300px;border:2px dashed #d4d9e1;border-radius:18px;background:linear-gradient(180deg,#fbfdff,#f6f9fe);display:grid;place-items:center;text-align:center;padding:30px}.fwo-single-drop>div>svg{width:48px;height:48px;color:#0b57d0;margin-bottom:12px}.fwo-single-drop h2{margin:0;font-size:22px}.fwo-single-drop p{margin:8px auto 18px;color:#5f6368;line-height:1.55;max-width:560px}.fwo-single-button,.fwo-single-download{border:0;border-radius:22px;padding:11px 18px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;text-decoration:none}.fwo-single-button{background:#0b57d0;color:#fff}.fwo-single-download{background:#137333;color:#fff}.fwo-single-button:disabled{opacity:.55;cursor:wait}.fwo-single-meta{margin-top:12px;color:#5f6368;font-size:12px}.fwo-single-meta strong{color:#202124}.fwo-single-result{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border:1px solid #cde3d3;border-radius:14px;padding:14px 16px;background:#f4faf6}.fwo-single-result-main{display:flex;align-items:center;gap:11px;min-width:0}.fwo-single-result-icon{width:40px;height:40px;border-radius:11px;background:#e6f4ea;color:#137333;display:grid;place-items:center}.fwo-single-result-icon svg{width:20px}.fwo-single-result-copy{min-width:0}.fwo-single-result-copy strong{display:block;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fwo-single-result-copy span{display:block;color:#5f6368;font-size:12px;margin-top:4px}.fwo-single-warning{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}@media(max-width:640px){.fwo-single-drop{min-height:250px;padding:22px 14px}.fwo-single-result-copy strong{max-width:230px}}
      `}</style>
      <input ref={inputRef} hidden type="file" accept={accept} onChange={(event) => void process(event.target.files?.[0])} />
      <div className="fwo-single-drop">
        <div>
          <FileUp />
          <h2>{title}</h2>
          <p>{description}</p>
          <button type="button" className="fwo-single-button" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <RefreshCw /> : <FileUp />}{busy ? actionLabel : fileName ? `Choose another ${inputLabel}` : `Choose ${inputLabel}`}
          </button>
          <div className="fwo-single-meta">{fileName ? <><strong>{fileName}</strong> · </> : null}{status}</div>
        </div>
      </div>
      {warnings.length > 0 ? <div className="fwo-single-warning">{warnings.slice(0, 3).join(' · ')}</div> : null}
      {downloadUrl ? (
        <div className="fwo-single-result">
          <div className="fwo-single-result-main">
            <span className="fwo-single-result-icon"><FileOutput /></span>
            <span className="fwo-single-result-copy"><strong>{downloadName}</strong><span>{formatBytes(outputSize)}</span></span>
          </div>
          <a className="fwo-single-download" href={downloadUrl} download={downloadName}><Download />{downloadLabel}</a>
        </div>
      ) : null}
    </div>
  );
}
