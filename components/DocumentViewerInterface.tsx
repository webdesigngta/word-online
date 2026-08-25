'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, FolderOpen, RefreshCw, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

type PreviewState =
  | { kind: 'html'; html: string }
  | { kind: 'pdf'; url: string }
  | { kind: 'image'; url: string; alt: string }
  | null;

const ACCEPT = '.docx,.pdf,.txt,.html,.htm,.rtf,.jpg,.jpeg,.png,.csv,.xlsx,application/pdf,text/plain,text/html,text/csv,image/jpeg,image/png,application/rtf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function sanitizePreview(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script,style,iframe,object,embed,form,input,button,textarea,select,meta,link,base').forEach((node) => node.remove());
  template.content.querySelectorAll<HTMLElement>('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on')) element.removeAttribute(attribute.name);
      if (name === 'href' && /^javascript:/i.test(value)) element.removeAttribute(attribute.name);
      if (name === 'src' && value && !/^(data:image\/|blob:)/i.test(value)) element.removeAttribute(attribute.name);
      if (name === 'style' && /(url\s*\(|expression\s*\()/i.test(attribute.value)) element.removeAttribute(attribute.name);
    });
  });
  return template.innerHTML;
}

function plainTextPreview(text: string) {
  const pre = document.createElement('pre');
  pre.style.cssText = 'white-space:pre-wrap;word-break:break-word;font:14px/1.6 Arial,sans-serif;margin:0';
  pre.textContent = text;
  return pre.outerHTML;
}

function extension(name: string) {
  const match = /\.([^.]+)$/.exec(name.toLowerCase());
  return match?.[1] ?? '';
}

export function DocumentViewerInterface({ toolId }: { toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [name, setName] = useState('');
  const [preview, setPreview] = useState<PreviewState>(null);
  const [status, setStatus] = useState('Choose a supported document to view it here.');
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  function clearObjectUrl() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }

  function reset() {
    clearObjectUrl();
    setName('');
    setPreview(null);
    setWarnings([]);
    setStatus('Choose a supported document to view it here.');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function open(file?: File) {
    if (!file) return;
    setBusy(true);
    clearObjectUrl();
    setPreview(null);
    setWarnings([]);
    setName(file.name);
    setStatus(`Opening ${file.name}…`);
    const ext = extension(file.name);
    trackToolEvent('tool_start', { toolId, fileType: ext || file.type, metadata: { size: file.size } });

    try {
      if (file.size <= 0 || file.size > 50 * 1024 * 1024) throw new Error('Files must be between 1 byte and 50 MB.');

      if (ext === 'docx') {
        const { docxViewerProcessor } = await import('@/tools/word');
        const result = await docxViewerProcessor.process(file as never);
        if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'Could not open this DOCX file.');
        setPreview({ kind: 'html', html: sanitizePreview(await result.output.blob.text()) });
        setWarnings(result.warnings.map((item) => item.message));
        setStatus('DOCX opened in read-only view.');
      } else if (ext === 'pdf' || file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;
        setPreview({ kind: 'pdf', url });
        setStatus('PDF opened in read-only view.');
      } else if (ext === 'txt' || file.type === 'text/plain') {
        setPreview({ kind: 'html', html: plainTextPreview(await file.text()) });
        setStatus('Text file opened in read-only view.');
      } else if (ext === 'html' || ext === 'htm' || file.type === 'text/html') {
        setPreview({ kind: 'html', html: sanitizePreview(await file.text()) });
        setStatus('HTML opened with active scripts and remote embeds removed.');
      } else if (ext === 'rtf' || /rtf/i.test(file.type)) {
        const { rtfToHtml } = await import('@/tools/word/shared/batchHelpers');
        const converted = rtfToHtml(await file.text());
        setPreview({ kind: 'html', html: sanitizePreview(converted.html) });
        setWarnings(converted.warnings.map((item) => typeof item === 'string' ? item : item.message));
        setStatus('RTF opened in read-only view.');
      } else if (['jpg', 'jpeg', 'png'].includes(ext) || /^image\/(jpeg|png)$/i.test(file.type)) {
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;
        setPreview({ kind: 'image', url, alt: file.name });
        setStatus('Image opened in read-only view.');
      } else if (ext === 'csv' || ext === 'xlsx') {
        const xlsx = await import('xlsx');
        const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array', raw: false });
        const firstSheet = workbook.SheetNames[0];
        if (!firstSheet) throw new Error('The spreadsheet does not contain a readable sheet.');
        const html = xlsx.utils.sheet_to_html(workbook.Sheets[firstSheet], { header: '', footer: '' });
        setPreview({ kind: 'html', html: sanitizePreview(`<h2>${firstSheet}</h2>${html}`) });
        if (workbook.SheetNames.length > 1) setWarnings([`Showing the first sheet, ${firstSheet}. This workbook contains ${workbook.SheetNames.length} sheets.`]);
        setStatus(`${ext.toUpperCase()} opened in read-only table view.`);
      } else {
        throw new Error('Supported formats are DOCX, PDF, TXT, HTML, RTF, JPG, PNG, CSV, and XLSX.');
      }
      trackToolEvent('tool_success', { toolId, fileType: ext || file.type, outputType: 'preview' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not open this document.';
      setPreview(null);
      setStatus(message);
      trackToolEvent('tool_error', { toolId, fileType: ext || file.type, metadata: { message } });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="document-viewer-tool">
      <style>{`
        .document-viewer-tool{display:grid;gap:18px}.document-viewer-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.document-viewer-file{display:flex;align-items:center;gap:10px;min-width:0}.document-viewer-icon{width:42px;height:42px;border-radius:12px;background:#e8f0fe;color:#0b57d0;display:grid;place-items:center}.document-viewer-icon svg{width:21px}.document-viewer-copy{min-width:0}.document-viewer-copy strong{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.document-viewer-copy span{display:block;color:#5f6368;font-size:12px;margin-top:3px;max-width:650px}.document-viewer-buttons{display:flex;gap:8px;flex-wrap:wrap}.document-viewer-button{border:0;border-radius:20px;background:#0b57d0;color:#fff;padding:10px 16px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px}.document-viewer-button.secondary{background:#f1f3f4;color:#3c4043}.document-viewer-button:disabled{opacity:.55;cursor:wait}.document-viewer-button svg{width:17px}.document-viewer-empty{min-height:380px;border:2px dashed #d5dae2;border-radius:16px;background:#fbfcfe;display:grid;place-items:center;text-align:center;padding:36px;color:#5f6368}.document-viewer-empty svg{width:42px;height:42px;color:#0b57d0;margin-bottom:10px}.document-viewer-frame{background:#eef1f5;border-radius:16px;padding:18px;overflow:auto;min-height:420px;max-height:72vh}.document-viewer-page{width:min(900px,100%);min-height:560px;margin:0 auto;background:#fff;box-shadow:0 2px 10px rgba(60,64,67,.18);padding:54px 60px;color:#202124;line-height:1.55;overflow:auto}.document-viewer-page img{max-width:100%;height:auto}.document-viewer-page table{border-collapse:collapse;width:100%;font-size:13px}.document-viewer-page td,.document-viewer-page th{border:1px solid #dadce0;padding:7px;vertical-align:top}.document-viewer-pdf{width:100%;height:66vh;border:0;background:#fff;border-radius:10px}.document-viewer-image{display:block;max-width:100%;max-height:66vh;margin:auto}.document-viewer-warnings{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}@media(max-width:700px){.document-viewer-frame{padding:8px}.document-viewer-page{padding:28px 20px;min-height:460px}.document-viewer-pdf{height:58vh}}
      `}</style>
      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(event) => void open(event.target.files?.[0])} />
      <div className="document-viewer-actions">
        <div className="document-viewer-file">
          <div className="document-viewer-icon"><FileText /></div>
          <div className="document-viewer-copy"><strong>{name || 'Document Viewer'}</strong><span>{status}</span></div>
        </div>
        <div className="document-viewer-buttons">
          <button className="document-viewer-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <RefreshCw /> : <FolderOpen />}{busy ? 'Opening…' : name ? 'Open another' : 'Open document'}</button>
          {name ? <button className="document-viewer-button secondary" type="button" onClick={reset}><Trash2 />Clear</button> : null}
        </div>
      </div>
      {warnings.length ? <div className="document-viewer-warnings">{warnings.slice(0, 3).join(' · ')}</div> : null}
      {preview?.kind === 'html' ? <div className="document-viewer-frame"><article className="document-viewer-page" dangerouslySetInnerHTML={{ __html: preview.html }} /></div> : null}
      {preview?.kind === 'pdf' ? <div className="document-viewer-frame"><iframe className="document-viewer-pdf" title={name || 'PDF preview'} src={preview.url} /></div> : null}
      {preview?.kind === 'image' ? <div className="document-viewer-frame"><img className="document-viewer-image" src={preview.url} alt={preview.alt} /></div> : null}
      {!preview ? <button className="document-viewer-empty" type="button" onClick={() => inputRef.current?.click()}><div><FileText /><strong>Open common document formats in one place</strong><div>DOCX, PDF, TXT, HTML, RTF, JPG, PNG, CSV, and XLSX are supported.</div></div></button> : null}
    </div>
  );
}
