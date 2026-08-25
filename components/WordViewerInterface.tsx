'use client';

import { useRef, useState } from 'react';
import { FileText, FolderOpen, RefreshCw, Trash2 } from 'lucide-react';
import { trackToolEvent } from '@/lib/toolAnalytics';

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

function extension(name: string) {
  return /\.([^.]+)$/.exec(name.toLowerCase())?.[1] ?? '';
}

export function WordViewerInterface({ toolId }: { toolId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState('Open a DOCX, RTF, or ODT document in read-only view.');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function reset() {
    setName('');
    setHtml('');
    setWarnings([]);
    setStatus('Open a DOCX, RTF, or ODT document in read-only view.');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function open(file?: File) {
    if (!file) return;
    const ext = extension(file.name);
    setBusy(true);
    setHtml('');
    setWarnings([]);
    setName(file.name);
    setStatus(`Opening ${file.name}…`);
    trackToolEvent('tool_start', { toolId, fileType: ext || file.type, metadata: { size: file.size } });
    try {
      if (!['docx', 'rtf', 'odt'].includes(ext)) throw new Error('Supported Word-compatible formats are DOCX, RTF, and ODT.');
      if (file.size <= 0 || file.size > 50 * 1024 * 1024) throw new Error('Files must be between 1 byte and 50 MB.');

      if (ext === 'docx') {
        const { docxViewerProcessor } = await import('@/tools/word');
        const result = await docxViewerProcessor.process(file as never);
        if (!result.success || !result.output) throw new Error(result.errors[0]?.message || 'Could not open this DOCX file.');
        setHtml(sanitizePreview(await result.output.blob.text()));
        setWarnings(result.warnings.map((warning) => warning.message));
        setStatus('DOCX opened in read-only Word view.');
      } else if (ext === 'rtf') {
        const { rtfToHtml } = await import('@/tools/word/shared/batchHelpers');
        const result = rtfToHtml(await file.text());
        setHtml(sanitizePreview(result.html));
        setWarnings(result.warnings.map((warning) => warning.message));
        setStatus('RTF opened in read-only Word-compatible view.');
      } else {
        const { odtHtml } = await import('@/tools/word/shared/batchHelpers');
        const result = await odtHtml(file as never) as any;
        if (!result?.html) throw new Error(result?.errors?.[0]?.message || 'Could not open this ODT file.');
        setHtml(sanitizePreview(result.html));
        setWarnings((result.warnings || []).map((warning: any) => warning.message || String(warning)));
        setStatus('ODT opened in read-only Word-compatible view.');
      }
      trackToolEvent('tool_success', { toolId, fileType: ext, outputType: 'preview' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not open this document.';
      setStatus(message);
      setHtml('');
      trackToolEvent('tool_error', { toolId, fileType: ext || file.type, metadata: { message } });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return <div className="word-viewer-tool">
    <style>{`.word-viewer-tool{display:grid;gap:17px}.wvt-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.wvt-file{display:flex;align-items:center;gap:10px;min-width:0}.wvt-icon{width:42px;height:42px;border-radius:12px;background:#e8f0fe;color:#0b57d0;display:grid;place-items:center}.wvt-copy{min-width:0}.wvt-copy strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:560px}.wvt-copy span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.wvt-actions{display:flex;gap:8px}.wvt-btn{border:0;border-radius:20px;background:#0b57d0;color:#fff;padding:9px 14px;font-weight:650;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.wvt-btn.secondary{background:#f1f3f4;color:#3c4043}.wvt-btn:disabled{opacity:.55;cursor:wait}.wvt-empty{min-height:360px;border:2px dashed #d5dae2;border-radius:16px;background:#fbfcfe;display:grid;place-items:center;text-align:center;padding:32px;color:#5f6368}.wvt-empty svg{width:42px;height:42px;color:#0b57d0;margin-bottom:9px}.wvt-frame{background:#eef1f5;border-radius:16px;padding:18px;overflow:auto;max-height:72vh}.wvt-page{width:min(860px,100%);min-height:560px;margin:0 auto;background:#fff;box-shadow:0 2px 10px rgba(60,64,67,.18);padding:54px 60px;line-height:1.58;color:#202124;overflow:auto}.wvt-page img{max-width:100%;height:auto}.wvt-page table{width:100%;border-collapse:collapse}.wvt-page td,.wvt-page th{border:1px solid #dadce0;padding:7px}.wvt-warning{padding:10px 12px;border-radius:10px;background:#fef7e0;color:#5f4b00;font-size:12px}@media(max-width:700px){.wvt-frame{padding:8px}.wvt-page{padding:28px 20px;min-height:440px}.wvt-copy strong{max-width:230px}}`}</style>
    <input ref={inputRef} type="file" hidden accept=".docx,.rtf,.odt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,application/vnd.oasis.opendocument.text" onChange={(event) => void open(event.target.files?.[0])} />
    <div className="wvt-top"><div className="wvt-file"><div className="wvt-icon"><FileText/></div><div className="wvt-copy"><strong>{name || 'Word Viewer'}</strong><span>{status}</span></div></div><div className="wvt-actions"><button className="wvt-btn" disabled={busy} type="button" onClick={() => inputRef.current?.click()}>{busy ? <RefreshCw size={16}/> : <FolderOpen size={16}/>} {busy ? 'Opening…' : name ? 'Open another' : 'Open document'}</button>{name ? <button className="wvt-btn secondary" type="button" onClick={reset}><Trash2 size={16}/>Clear</button> : null}</div></div>
    {warnings.length ? <div className="wvt-warning">{warnings.slice(0,3).join(' · ')}</div> : null}
    {html ? <div className="wvt-frame"><article className="wvt-page" dangerouslySetInnerHTML={{__html:html}} /></div> : <button className="wvt-empty" type="button" onClick={() => inputRef.current?.click()}><div><FileText/><strong>View Word-compatible documents online</strong><div>DOCX, RTF, and ODT are supported in this read-only viewer.</div></div></button>}
  </div>;
}
