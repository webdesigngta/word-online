'use client';

import { useEffect, useRef, useState } from 'react';
import { Crop, Download, FileInput, FileUp, Layers, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';
import type { PdfFormValue } from '@/tools/pdf/document';

export type PdfDocumentUtilityMode = 'crop-pdf' | 'pdf-form-filler' | 'flatten-pdf';

type FieldDescriptor = {
  name: string;
  type: 'text' | 'checkbox' | 'select' | 'unsupported';
  options?: string[];
  value: PdfFormValue;
};

type DownloadState = { name: string; url: string; size: number } | null;

const PT_PER_MM = 72 / 25.4;

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function parsePages(value: string, pageCount: number): number[] | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === 'all') return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages: number[] = [];
  for (const token of trimmed.split(',').map((item) => item.trim()).filter(Boolean)) {
    if (/^\d+$/.test(token)) pages.push(Number(token));
    else {
      const match = /^(\d+)\s*-\s*(\d+)$/.exec(token);
      if (!match || Number(match[1]) > Number(match[2])) return null;
      for (let page = Number(match[1]); page <= Number(match[2]); page += 1) pages.push(page);
    }
  }
  if (!pages.length || pages.some((page) => page < 1 || page > pageCount)) return null;
  return [...new Set(pages)];
}

async function inspectPdfForm(file: File): Promise<{ pageCount: number; fields: FieldDescriptor[] }> {
  const pdfLib = await import('pdf-lib');
  const pdf = await pdfLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
  const fields = pdf.getForm().getFields().map((field): FieldDescriptor => {
    if (field instanceof pdfLib.PDFTextField) return { name: field.getName(), type: 'text', value: field.getText() ?? '' };
    if (field instanceof pdfLib.PDFCheckBox) return { name: field.getName(), type: 'checkbox', value: field.isChecked() };
    if (field instanceof pdfLib.PDFRadioGroup) return { name: field.getName(), type: 'select', options: field.getOptions(), value: field.getSelected() ?? '' };
    if (field instanceof pdfLib.PDFDropdown) return { name: field.getName(), type: 'select', options: field.getOptions(), value: field.getSelected()?.[0] ?? '' };
    if (field instanceof pdfLib.PDFOptionList) return { name: field.getName(), type: 'select', options: field.getOptions(), value: field.getSelected()?.[0] ?? '' };
    return { name: field.getName(), type: 'unsupported', value: '' };
  });
  return { pageCount: pdf.getPageCount(), fields };
}

export function PdfDocumentUtilityInterface({ mode, toolId }: { mode: PdfDocumentUtilityMode; toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [fields, setFields] = useState<FieldDescriptor[]>([]);
  const [values, setValues] = useState<Record<string, PdfFormValue>>({});
  const [pageSelection, setPageSelection] = useState('all');
  const [top, setTop] = useState(5);
  const [right, setRight] = useState(5);
  const [bottom, setBottom] = useState(5);
  const [left, setLeft] = useState(5);
  const [flattenAfterFill, setFlattenAfterFill] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Choose a PDF file to begin.');
  const [download, setDownload] = useState<DownloadState>(null);

  useEffect(() => () => {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
  }, []);

  function clearDownload() {
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    downloadUrlRef.current = null;
    setDownload(null);
  }

  async function chooseFile(files: FileList | null) {
    const next = files?.[0];
    if (!next) return;
    if (!(next.type === 'application/pdf' || /\.pdf$/i.test(next.name))) {
      setStatus('Please choose a PDF file.');
      return;
    }
    setBusy(true);
    clearDownload();
    setStatus('Inspecting PDF…');
    try {
      const inspected = await inspectPdfForm(next);
      setFile(next);
      setPageCount(inspected.pageCount);
      setFields(inspected.fields);
      setValues(Object.fromEntries(inspected.fields.map((field) => [field.name, field.value])));
      setPageSelection('all');
      if (mode === 'pdf-form-filler') {
        const supported = inspected.fields.filter((field) => field.type !== 'unsupported').length;
        setStatus(supported ? `Found ${supported} supported form ${supported === 1 ? 'field' : 'fields'}.` : 'No supported interactive form fields were found.');
      } else if (mode === 'flatten-pdf') {
        setStatus(inspected.fields.length ? `Found ${inspected.fields.length} interactive ${inspected.fields.length === 1 ? 'field' : 'fields'} ready to flatten.` : 'This PDF has no interactive form fields to flatten.');
      } else {
        setStatus(`Ready to crop ${inspected.pageCount} ${inspected.pageCount === 1 ? 'page' : 'pages'}. Margins are measured in millimetres.`);
      }
      trackToolEvent('tool_start', { toolId, fileType: 'pdf', metadata: { mode, pageCount: inspected.pageCount, fieldCount: inspected.fields.length } });
    } catch (error) {
      setFile(null);
      setPageCount(0);
      setFields([]);
      setStatus(error instanceof Error ? error.message : 'The PDF could not be inspected.');
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode } });
    } finally {
      setBusy(false);
    }
  }

  function setFieldValue(name: string, value: PdfFormValue) {
    clearDownload();
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function run() {
    if (!file || busy) return;
    let options: Record<string, unknown>;
    if (mode === 'crop-pdf') {
      const pages = parsePages(pageSelection, pageCount);
      if (!pages) {
        setStatus(`Use “all”, a list like 1,3,5, or a range such as 2-6. Pages must be between 1 and ${pageCount}.`);
        return;
      }
      options = {
        mode: 'crop',
        pages,
        margins: { top: top * PT_PER_MM, right: right * PT_PER_MM, bottom: bottom * PT_PER_MM, left: left * PT_PER_MM },
      };
    } else if (mode === 'pdf-form-filler') {
      options = { mode: 'fill', values, flattenAfterFill };
    } else {
      options = { mode: 'flatten' };
    }

    setBusy(true);
    clearDownload();
    setStatus(mode === 'crop-pdf' ? 'Cropping PDF pages…' : mode === 'pdf-form-filler' ? 'Filling PDF form…' : 'Flattening PDF form fields…');
    try {
      const { pdfDocumentUtilityProcessor } = await import('@/tools/pdf/document');
      const result = await pdfDocumentUtilityProcessor.process(file as never, options);
      if (!result.success || !result.data) throw new Error(result.errors[0]?.message || 'PDF operation failed.');
      const suffix = mode === 'crop-pdf' ? 'cropped' : mode === 'pdf-form-filler' ? 'filled' : 'flattened';
      const name = `${file.name.replace(/\.pdf$/i, '') || 'document'}-${suffix}.pdf`;
      const blob = new Blob([result.data as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;
      setDownload({ name, url, size: blob.size });
      if (mode === 'crop-pdf') setStatus(`Done. Cropped the selected pages and created a new PDF.`);
      else setStatus(`Done. Processed ${result.changedFields} ${result.changedFields === 1 ? 'form field' : 'form fields'}.`);
      trackToolEvent('tool_success', { toolId, fileType: 'pdf', outputType: 'pdf', metadata: { mode, pageCount: result.pageCount, fieldCount: result.fieldCount, changedFields: result.changedFields } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF operation failed.';
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: 'pdf', metadata: { mode, message } });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    clearDownload();
    setFile(null);
    setPageCount(0);
    setFields([]);
    setValues({});
    setPageSelection('all');
    setStatus('Choose a PDF file to begin.');
    if (inputRef.current) inputRef.current.value = '';
  }

  const supportedFields = fields.filter((field) => field.type !== 'unsupported');
  const canRun = Boolean(file) && !busy && (mode === 'crop-pdf' || (mode === 'pdf-form-filler' ? supportedFields.length > 0 : fields.length > 0));
  const Icon = mode === 'crop-pdf' ? Crop : mode === 'pdf-form-filler' ? FileInput : Layers;
  const action = mode === 'crop-pdf' ? 'Crop PDF' : mode === 'pdf-form-filler' ? 'Fill PDF' : 'Flatten PDF';

  return <div className="pdf-doc-tool">
    <style>{`
      .pdf-doc-tool{display:grid;gap:15px}.pdu-drop{border:2px dashed #d4d9e1;border-radius:18px;padding:25px;text-align:center;background:#f8fafd}.pdu-drop>svg{width:44px;height:44px;color:#0b57d0}.pdu-drop h2{margin:8px 0 5px}.pdu-drop p{margin:0 0 14px;color:#5f6368}.pdu-btn{border:1px solid #d4d9e1;background:#fff;color:#202124;border-radius:22px;padding:9px 14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;text-decoration:none}.pdu-btn.primary{background:#0b57d0;border-color:#0b57d0;color:#fff}.pdu-btn.success{background:#137333;border-color:#137333;color:#fff}.pdu-btn:disabled{opacity:.45;cursor:not-allowed}.pdu-file,.pdu-panel,.pdu-output{border:1px solid #e0e3e7;border-radius:13px;padding:12px 14px;background:#fff}.pdu-file,.pdu-output{display:flex;justify-content:space-between;align-items:center;gap:12px}.pdu-file span,.pdu-output span{display:block;color:#5f6368;font-size:11px;margin-top:3px}.pdu-panel{display:grid;gap:12px}.pdu-grid{display:grid;grid-template-columns:repeat(4,minmax(100px,1fr));gap:10px}.pdu-field label{display:block;font-size:12px;font-weight:700;margin-bottom:5px}.pdu-input,.pdu-select{width:100%;box-sizing:border-box;border:1px solid #d4d9e1;border-radius:9px;padding:9px 10px;background:#fff;color:#202124}.pdu-form-list{display:grid;gap:9px}.pdu-form-row{display:grid;grid-template-columns:minmax(150px,.9fr) minmax(180px,1.3fr);align-items:center;gap:12px;border-top:1px solid #eef0f2;padding-top:9px}.pdu-form-row:first-child{border-top:0;padding-top:0}.pdu-name{font-size:12px;font-weight:700;overflow-wrap:anywhere}.pdu-checkbox{display:flex;align-items:center;gap:8px}.pdu-help,.pdu-status{color:#5f6368;font-size:12px;line-height:1.55}.pdu-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.pdu-output{background:#f4faf6;border-color:#cde3d3}@media(max-width:650px){.pdu-drop{padding:20px 12px}.pdu-grid{grid-template-columns:1fr 1fr}.pdu-form-row{grid-template-columns:1fr}.pdu-file,.pdu-output{align-items:flex-start;flex-direction:column}}
    `}</style>
    <input ref={inputRef} hidden type="file" accept="application/pdf,.pdf" onChange={(event)=>void chooseFile(event.target.files)} />
    <div className="pdu-drop"><Icon/><h2>{mode==='crop-pdf'?'Crop PDF pages':mode==='pdf-form-filler'?'Fill a PDF form':'Flatten PDF form fields'}</h2><p>{mode==='crop-pdf'?'Set top, right, bottom, and left crop margins for all or selected PDF pages.':mode==='pdf-form-filler'?'Detect interactive PDF fields, enter values, and create a filled copy in your browser.':'Bake interactive form field appearances into a non-editable PDF copy.'}</p><button className="pdu-btn primary" type="button" disabled={busy} onClick={()=>inputRef.current?.click()}><FileUp size={16}/>{file?'Choose another PDF':'Choose PDF'}</button></div>
    {file?<div className="pdu-file"><div><strong>{file.name}</strong><span>{formatBytes(file.size)} · {pageCount} {pageCount===1?'page':'pages'}{fields.length?` · ${fields.length} form fields`:''}</span></div><button className="pdu-btn" type="button" disabled={busy} onClick={reset}><Trash2 size={15}/>Reset</button></div>:null}
    {file&&mode==='crop-pdf'?<div className="pdu-panel"><div className="pdu-field"><label htmlFor={`${toolId}-pages`}>Pages</label><input id={`${toolId}-pages`} className="pdu-input" value={pageSelection} disabled={busy} onChange={(event)=>setPageSelection(event.target.value)} placeholder="all or 1,3,5-7"/></div><div className="pdu-grid">{([['Top',top,setTop],['Right',right,setRight],['Bottom',bottom,setBottom],['Left',left,setLeft]] as const).map(([label,value,setter])=><div className="pdu-field" key={label}><label>{label} margin (mm)</label><input className="pdu-input" type="number" min="0" step="1" value={value} disabled={busy} onChange={(event)=>setter(Math.max(0,Number(event.target.value)||0))}/></div>)}</div><div className="pdu-help">Cropping changes the visible page crop box; it does not delete underlying PDF content outside that box.</div></div>:null}
    {file&&mode==='pdf-form-filler'?<div className="pdu-panel"><div className="pdu-form-list">{supportedFields.map((field)=><div className="pdu-form-row" key={field.name}><div className="pdu-name">{field.name}</div>{field.type==='checkbox'?<label className="pdu-checkbox"><input type="checkbox" checked={Boolean(values[field.name])} disabled={busy} onChange={(event)=>setFieldValue(field.name,event.target.checked)}/> Checked</label>:field.type==='select'?<select className="pdu-select" value={String(values[field.name]??'')} disabled={busy} onChange={(event)=>setFieldValue(field.name,event.target.value)}><option value="">Select…</option>{field.options?.map((option)=><option key={option} value={option}>{option}</option>)}</select>:<input className="pdu-input" value={String(values[field.name]??'')} disabled={busy} onChange={(event)=>setFieldValue(field.name,event.target.value)}/>}</div>)}</div>{fields.some((field)=>field.type==='unsupported')?<div className="pdu-help">{fields.filter((field)=>field.type==='unsupported').length} unsupported button/signature field(s) are left unchanged.</div>:null}<label className="pdu-checkbox"><input type="checkbox" checked={flattenAfterFill} disabled={busy} onChange={(event)=>setFlattenAfterFill(event.target.checked)}/> Flatten fields after filling</label></div>:null}
    {file&&mode==='flatten-pdf'?<div className="pdu-panel"><strong>{fields.length ? `${fields.length} interactive ${fields.length===1?'field':'fields'} will be flattened.` : 'No interactive fields found.'}</strong><div className="pdu-help">Flattening bakes the current field appearances into the page and removes their interactive form controls. Keep the original if you may need to edit the fields later.</div></div>:null}
    <div className="pdu-actions"><button className="pdu-btn primary" type="button" disabled={!canRun} onClick={()=>void run()}><Icon size={16}/>{busy?'Working…':action}</button><span className="pdu-status" role="status">{status}</span></div>
    {download?<div className="pdu-output"><div><strong>{download.name}</strong><span>{formatBytes(download.size)}</span></div><a className="pdu-btn success" href={download.url} download={download.name} onClick={()=>trackToolEvent('tool_download',{toolId,outputType:'pdf'})}><Download size={16}/>Download PDF</a></div>:null}
  </div>;
}
