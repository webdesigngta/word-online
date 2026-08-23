'use client';

import { useRef, useState } from 'react';
import { FileText, FolderOpen, RefreshCw } from 'lucide-react';
import { docxViewerProcessor } from '@/tools/word';

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
    });
  });
  return template.innerHTML;
}

export function DocxViewerInterface() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState('Choose a DOCX file to view it here.');
  const [busy, setBusy] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function open(file?: File) {
    if (!file) return;
    setBusy(true);
    setStatus(`Opening ${file.name}…`);
    setWarnings([]);
    try {
      const result = await docxViewerProcessor.process(file);
      if (!result.success || !result.output) {
        setHtml('');
        setName('');
        setStatus(result.errors[0]?.message || 'Could not open this DOCX file.');
        return;
      }
      const preview = sanitizePreview(await result.output.blob.text());
      setHtml(preview);
      setName(file.name);
      setWarnings(result.warnings.map((item) => item.message));
      setStatus('DOCX opened in read-only view.');
    } catch {
      setHtml('');
      setName('');
      setStatus('Could not open this DOCX file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="fwo-task-tool">
      <style>{`
        .fwo-task-tool{display:grid;gap:18px}.fwo-task-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.fwo-task-actions-left{display:flex;align-items:center;gap:10px;min-width:0}.fwo-task-icon{width:42px;height:42px;border-radius:12px;background:#e8f0fe;color:#0b57d0;display:grid;place-items:center}.fwo-task-icon svg{width:21px}.fwo-task-copy{min-width:0}.fwo-task-copy strong{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fwo-task-copy span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.fwo-task-button{border:0;border-radius:20px;background:#0b57d0;color:#fff;padding:10px 16px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px}.fwo-task-button:disabled{opacity:.55;cursor:wait}.fwo-task-button svg{width:17px}.fwo-viewer-empty{min-height:360px;border:2px dashed #d5dae2;border-radius:16px;background:#fbfcfe;display:grid;place-items:center;text-align:center;padding:36px;color:#5f6368}.fwo-viewer-empty svg{width:42px;height:42px;color:#0b57d0;margin-bottom:10px}.fwo-viewer-document{background:#eef1f5;border-radius:16px;padding:28px;overflow:auto;max-height:70vh}.fwo-viewer-page{width:min(816px,100%);min-height:600px;margin:0 auto;background:#fff;box-shadow:0 2px 10px rgba(60,64,67,.18);padding:72px 76px;color:#202124;line-height:1.55}.fwo-viewer-page img{max-width:100%;height:auto}.fwo-viewer-page table{border-collapse:collapse;width:100%}.fwo-viewer-page td,.fwo-viewer-page th{border:1px solid #dadce0;padding:7px}.fwo-task-warnings{font-size:12px;color:#7a4f00;background:#fff8e1;border-radius:10px;padding:10px 12px}@media(max-width:700px){.fwo-viewer-document{padding:10px}.fwo-viewer-page{padding:34px 24px;min-height:480px}}
      `}</style>
      <input ref={inputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(event) => void open(event.target.files?.[0])} />
      <div className="fwo-task-actions">
        <div className="fwo-task-actions-left">
          <div className="fwo-task-icon"><FileText /></div>
          <div className="fwo-task-copy"><strong>{name || 'DOCX viewer'}</strong><span>{status}</span></div>
        </div>
        <button className="fwo-task-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <RefreshCw /> : <FolderOpen />}{busy ? 'Opening…' : name ? 'Open another DOCX' : 'Open DOCX'}
        </button>
      </div>
      {warnings.length > 0 ? <div className="fwo-task-warnings">{warnings.slice(0, 3).join(' · ')}</div> : null}
      {html ? <div className="fwo-viewer-document"><article className="fwo-viewer-page" dangerouslySetInnerHTML={{ __html: html }} /></div> : <div className="fwo-viewer-empty"><div><FileText /><strong>Read a Word document without editing it</strong><div>Choose a .docx file from your device. The preview is created in this browser.</div></div></div>}
    </div>
  );
}
