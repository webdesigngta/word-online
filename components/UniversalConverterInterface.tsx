'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Download, FileUp, RefreshCw } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export type UniversalConverterMode = 'document-converter' | 'pdf-converter';
type SourceFormat = 'pdf' | 'docx' | 'jpg' | 'png' | 'html' | 'xlsx' | 'csv';
type TargetFormat = 'pdf' | 'docx' | 'jpg';
type DownloadState = { name: string; url: string; size: number; outputType: string } | null;

const formatLabels: Record<SourceFormat | TargetFormat, string> = {
  pdf: 'PDF', docx: 'Word DOCX', jpg: 'JPG', png: 'PNG', html: 'HTML', xlsx: 'Excel XLSX', csv: 'CSV',
};

const accepted = '.pdf,.docx,.jpg,.jpeg,.png,.html,.htm,.xlsx,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,text/html,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function sourceFormat(file: File): SourceFormat | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) return 'docx';
  if (file.type === 'image/jpeg' || /\.jpe?g$/.test(name)) return 'jpg';
  if (file.type === 'image/png' || name.endsWith('.png')) return 'png';
  if (file.type === 'text/html' || /\.html?$/.test(name)) return 'html';
  if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || name.endsWith('.xlsx')) return 'xlsx';
  if (file.type === 'text/csv' || name.endsWith('.csv')) return 'csv';
  return null;
}

function targetsFor(format: SourceFormat | null): TargetFormat[] {
  if (!format) return [];
  if (format === 'pdf') return ['docx', 'jpg'];
  return ['pdf'];
}

function firstError(result: any, fallback: string) {
  return result?.errors?.[0]?.message || fallback;
}

function warningText(result: any): string | null {
  const first = result?.warnings?.[0];
  if (!first) return null;
  return typeof first === 'string' ? first : first.message ?? null;
}

async function convert(file: File, input: SourceFormat, target: TargetFormat): Promise<{ blob: Blob; name: string; outputType: string; note?: string }> {
  if (input === 'pdf' && target === 'docx') {
    const { pdfToWordProcessor } = await import('@/tools/pdf');
    const result: any = await pdfToWordProcessor.process(file as never, { preservePageBreaks: true });
    if (!result.success || !result.output) throw new Error(firstError(result, 'PDF to Word conversion failed.'));
    return { blob: result.output.blob, name: result.output.name, outputType: 'docx', note: warningText(result) ?? undefined };
  }

  if (input === 'pdf' && target === 'jpg') {
    const { pdfToJpgProcessor } = await import('@/tools/pdf');
    const result: any = await pdfToJpgProcessor.process(file as never, { quality: 0.92, scale: 2 });
    if (!result.success || !result.outputs?.length) throw new Error(firstError(result, 'PDF to JPG conversion failed.'));
    if (result.outputs.length === 1) {
      return { blob: result.outputs[0].blob, name: result.outputs[0].name, outputType: 'jpg', note: warningText(result) ?? undefined };
    }
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    result.outputs.forEach((output: any) => zip.file(output.name, output.blob));
    const blob = await zip.generateAsync({ type: 'blob' });
    return { blob, name: `${file.name.replace(/\.pdf$/i, '') || 'document'}-jpg-pages.zip`, outputType: 'zip', note: warningText(result) ?? undefined };
  }

  if (input === 'docx' && target === 'pdf') {
    const { wordToPdfProcessor } = await import('@/tools/word/to-pdf/WordToPdfProcessor');
    const result: any = await wordToPdfProcessor.process(file as never, { pageFormat: 'a4', margin: 12 });
    if (!result.success || !result.output) throw new Error(firstError(result, 'Word to PDF conversion failed.'));
    return { blob: result.output.blob, name: result.output.name, outputType: 'pdf', note: warningText(result) ?? undefined };
  }

  if ((input === 'jpg' || input === 'png') && target === 'pdf') {
    const imageTools = await import('@/tools/image');
    const processor = input === 'jpg' ? imageTools.jpgToPdfProcessor : imageTools.pngToPdfProcessor;
    const result: any = await processor.process([file] as never, { pageFormat: 'a4', orientation: 'portrait', margin: 24, fit: 'contain' });
    if (!result.success || !result.output) throw new Error(firstError(result, `${formatLabels[input]} to PDF conversion failed.`));
    return { blob: result.output.blob, name: result.output.name, outputType: 'pdf', note: warningText(result) ?? undefined };
  }

  if (input === 'html' && target === 'pdf') {
    const { htmlToPdfProcessor } = await import('@/tools/html');
    const result: any = await htmlToPdfProcessor.process(file as never, { pageFormat: 'a4', orientation: 'portrait', margin: 12 });
    if (!result.success || !result.output) throw new Error(firstError(result, 'HTML to PDF conversion failed.'));
    return { blob: result.output.blob, name: result.output.name, outputType: 'pdf', note: warningText(result) ?? undefined };
  }

  if (input === 'xlsx' && target === 'pdf') {
    const { excelToPdfProcessor } = await import('@/tools/spreadsheet');
    const result: any = await excelToPdfProcessor.process(file as never, { pageFormat: 'a4', orientation: 'landscape', margin: 10 });
    if (!result.success || !result.output) throw new Error(firstError(result, 'Excel to PDF conversion failed.'));
    return { blob: result.output.blob, name: result.output.name, outputType: 'pdf', note: warningText(result) ?? undefined };
  }

  if (input === 'csv' && target === 'pdf') {
    const { csvToPdfProcessor } = await import('@/tools/spreadsheet');
    const result: any = await csvToPdfProcessor.process(file as never, { pageFormat: 'a4', margin: 8 });
    if (!result.success || !result.output) throw new Error(firstError(result, 'CSV to PDF conversion failed.'));
    return { blob: result.output.blob, name: result.output.name, outputType: 'pdf' };
  }

  throw new Error(`${formatLabels[input]} to ${formatLabels[target]} is not supported yet.`);
}

export function UniversalConverterInterface({ mode, toolId }: { mode: UniversalConverterMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inputFormat, setInputFormat] = useState<SourceFormat | null>(null);
  const [target, setTarget] = useState<TargetFormat | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a supported file to begin.');
  const [download, setDownload] = useState<DownloadState>(null);
  const targetOptions = useMemo(() => targetsFor(inputFormat), [inputFormat]);

  useEffect(() => () => {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
  }, []);

  function clearDownload() {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = null;
    setDownload(null);
  }

  function chooseFile(files: FileList | null) {
    const next = files?.[0];
    if (!next) return;
    const detected = sourceFormat(next);
    if (!detected) {
      setStatus('Supported files: PDF, DOCX, JPG, PNG, HTML, XLSX, and CSV.');
      return;
    }
    clearDownload();
    const targets = targetsFor(detected);
    setFile(next);
    setInputFormat(detected);
    setTarget(targets[0] ?? null);
    setStatus(`${formatLabels[detected]} detected. Choose the output format and convert.`);
    trackToolEvent('tool_start', { toolId, fileType: detected, metadata: { mode, size: next.size } });
  }

  async function run() {
    if (!file || !inputFormat || !target || busy) return;
    setBusy(true);
    clearDownload();
    setStatus(`Converting ${formatLabels[inputFormat]} to ${formatLabels[target]}…`);
    try {
      const output = await convert(file, inputFormat, target);
      const url = URL.createObjectURL(output.blob);
      downloadUrlRef.current = url;
      setDownload({ name: output.name, url, size: output.blob.size, outputType: output.outputType });
      setStatus(output.note ? `Done. ${output.note}` : `Done. Created ${formatBytes(output.blob.size)} ${output.outputType.toUpperCase()} output.`);
      trackToolEvent('tool_success', { toolId, fileType: inputFormat, outputType: output.outputType, metadata: { mode, target, size: output.blob.size } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: inputFormat, metadata: { mode, target, message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    clearDownload();
    setFile(null);
    setInputFormat(null);
    setTarget(null);
    setStatus('Choose a supported file to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  const title = mode === 'pdf-converter' ? 'Convert files to or from PDF' : 'Convert document files';
  const help = mode === 'pdf-converter'
    ? 'Convert DOCX, JPG, PNG, HTML, XLSX, or CSV to PDF, or convert PDF to Word DOCX or JPG.'
    : 'Choose PDF, DOCX, JPG, PNG, HTML, XLSX, or CSV and convert it using the available output formats.';

  return <div className="universal-converter">
    <style>{`
      .universal-converter{display:grid;gap:15px}.uc-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:27px;text-align:center;background:#f8fafd}.uc-drop>svg{width:45px;height:45px;color:#0b57d0}.uc-drop h2{margin:8px 0 5px}.uc-drop p{margin:0 auto 15px;color:#5f6368;max-width:680px;line-height:1.55}.uc-btn{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:9px 14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.uc-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.uc-btn.success{background:#137333;border-color:#137333;color:#fff}.uc-btn:disabled{opacity:.45;cursor:not-allowed}.uc-file,.uc-convert,.uc-output{border:1px solid #e0e3e7;border-radius:13px;padding:13px 14px;background:#fff}.uc-file,.uc-output{display:flex;justify-content:space-between;align-items:center;gap:12px}.uc-file span,.uc-output span{display:block;color:#5f6368;font-size:11px;margin-top:3px}.uc-convert{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.uc-format{border:1px solid #d4d9e1;border-radius:10px;padding:9px 11px;background:#f8fafd;font-weight:700}.uc-select{border:1px solid #d4d9e1;border-radius:10px;padding:9px 11px;background:#fff;min-width:150px}.uc-status{font-size:13px;color:#5f6368;line-height:1.5}.uc-output{background:#f4faf6;border-color:#cde3d3}@media(max-width:650px){.uc-drop{padding:21px 12px}.uc-file,.uc-output{align-items:flex-start;flex-direction:column}.uc-convert{align-items:stretch}.uc-select{flex:1}}
    `}</style>
    <input ref={inputRef} hidden type="file" accept={accepted} onChange={(event)=>chooseFile(event.target.files)} />
    <div className="uc-drop"><FileUp/><h2>{title}</h2><p>{help}</p><button className="uc-btn primary" type="button" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{file?'Choose another file':'Choose file'}</button></div>
    {file&&inputFormat?<div className="uc-file"><div><strong>{file.name}</strong><span>{formatLabels[inputFormat]} · {formatBytes(file.size)}</span></div><button className="uc-btn" type="button" disabled={busy} onClick={reset}><RefreshCw size={15}/>Reset</button></div>:null}
    {file&&inputFormat&&target?<div className="uc-convert"><span className="uc-format">{formatLabels[inputFormat]}</span><ArrowRight size={17}/><select className="uc-select" value={target} disabled={busy} onChange={(event)=>setTarget(event.target.value as TargetFormat)}>{targetOptions.map((option)=><option key={option} value={option}>{formatLabels[option]}</option>)}</select><button className="uc-btn primary" type="button" disabled={busy} onClick={()=>void run()}>{busy?'Converting…':'Convert'}</button></div>:null}
    <div className="uc-status" role="status">{status}</div>
    {download?<div className="uc-output"><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div><a className="uc-btn success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:download.outputType})}><Download size={16}/>Download</a></div>:null}
  </div>;
}
