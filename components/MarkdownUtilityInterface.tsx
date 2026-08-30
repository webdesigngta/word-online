'use client';

import { useMemo, useRef, useState } from 'react';
import { Download, Eye, FileCode2, FolderOpen, RefreshCw } from 'lucide-react';
import {
  baseDocumentName,
  downloadDocumentBlob,
  loadDocxMarkdown,
  markdownToHtml,
  saveMarkdownAsDocx,
} from '@/tools/document/formatHelpers';

export type MarkdownUtilityMode = 'markdown-editor' | 'markdown-to-docx' | 'docx-to-markdown';

type Warning = { code?: string; message: string };

function downloadMarkdown(markdown: string, sourceName: string) {
  downloadDocumentBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), `${baseDocumentName(sourceName)}.md`);
}

export function MarkdownUtilityInterface({ mode }: { mode: MarkdownUtilityMode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [markdown, setMarkdown] = useState(mode === 'markdown-editor' ? '# New document\n\nStart writing in Markdown.' : '');
  const [fileName, setFileName] = useState(mode === 'markdown-editor' ? 'document.md' : '');
  const [status, setStatus] = useState(mode === 'markdown-editor' ? 'Ready to write.' : 'Choose a file to begin.');
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => markdownToHtml(markdown), [markdown]);
  const docxInput = mode === 'docx-to-markdown';

  async function open(file?: File) {
    if (!file) return;
    setBusy(true);
    setWarnings([]);
    setStatus(`Opening ${file.name}…`);
    try {
      if (docxInput) {
        if (!/\.docx$/i.test(file.name)) throw new Error('Choose a DOCX file.');
        if (file.size <= 0 || file.size > 25 * 1024 * 1024) throw new Error('DOCX files must be between 1 byte and 25 MB.');
        const result = await loadDocxMarkdown(file);
        setMarkdown(result.markdown);
        setWarnings([...result.warnings]);
      } else {
        if (!/\.(?:md|markdown|txt)$/i.test(file.name)) throw new Error('Choose a Markdown (.md/.markdown) or plain-text file.');
        if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error('Text files must be between 1 byte and 10 MB.');
        setMarkdown(await file.text());
      }
      setFileName(file.name);
      setStatus('Document loaded locally in your browser.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not open this file.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function convertDocx() {
    if (!markdown.trim()) return;
    setBusy(true);
    setStatus('Building DOCX…');
    try {
      const output = await saveMarkdownAsDocx(markdown, fileName || 'document.md');
      downloadDocumentBlob(output.blob, output.name);
      setStatus('DOCX downloaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create the DOCX file.');
    } finally {
      setBusy(false);
    }
  }

  const showLoadedToolbar = mode === 'markdown-editor' || Boolean(fileName);

  return (
    <div className="fwo-md-tool">
      <style>{`
        .fwo-md-tool{display:grid;gap:16px}.fwo-md-top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.fwo-md-file{display:flex;align-items:center;gap:10px;min-width:0}.fwo-md-icon{width:42px;height:42px;border-radius:12px;background:#f3e8fd;color:#8430ce;display:grid;place-items:center}.fwo-md-icon svg{width:21px}.fwo-md-copy{min-width:0}.fwo-md-copy strong{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px}.fwo-md-copy span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.fwo-md-actions{display:flex;gap:8px;flex-wrap:wrap}.fwo-md-btn{border:1px solid #dadce0;border-radius:20px;background:#fff;color:#202124;padding:9px 14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.fwo-md-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.fwo-md-btn:disabled{opacity:.55;cursor:not-allowed}.fwo-md-btn svg{width:16px}.fwo-md-work{display:grid;grid-template-columns:1fr 1fr;gap:12px;min-height:440px}.fwo-md-editor,.fwo-md-preview{border:1px solid #dadce0;border-radius:14px;background:#fff;min-height:440px}.fwo-md-editor{width:100%;padding:22px;resize:vertical;font:14px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;color:#202124;outline:none}.fwo-md-editor:focus{box-shadow:inset 0 0 0 2px #0b57d0}.fwo-md-preview{padding:28px;overflow:auto}.fwo-md-preview h1,.fwo-md-preview h2,.fwo-md-preview h3{line-height:1.2}.fwo-md-preview pre{background:#f6f8fa;padding:12px;border-radius:8px;overflow:auto}.fwo-md-preview code{background:#f1f3f4;padding:1px 4px;border-radius:4px}.fwo-md-preview pre code{background:transparent;padding:0}.fwo-md-empty{min-height:340px;border:2px dashed #d5dae2;border-radius:16px;background:#fbfcfe;display:grid;place-items:center;text-align:center;padding:32px;color:#5f6368}.fwo-md-empty svg{width:42px;height:42px;color:#8430ce;margin-bottom:10px}.fwo-md-note{font-size:12px;color:#5f6368;background:#f8fafd;border-radius:10px;padding:10px 12px}.fwo-md-note.warn{background:#fff8e1;color:#7a4d00}@media(max-width:800px){.fwo-md-work{grid-template-columns:1fr}.fwo-md-copy strong{max-width:230px}.fwo-md-btn{padding:8px 11px}}
      `}</style>
      <input ref={inputRef} type="file" hidden accept={docxInput ? '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document' : '.md,.markdown,.txt,text/markdown,text/plain'} onChange={(event) => void open(event.target.files?.[0])} />

      {showLoadedToolbar ? <div className="fwo-md-top">
        <div className="fwo-md-file">
          <div className="fwo-md-icon"><FileCode2 /></div>
          <div className="fwo-md-copy"><strong>{fileName || 'Markdown Editor'}</strong><span>{status}</span></div>
        </div>
        <div className="fwo-md-actions">
          {markdown.trim() ? <button className="fwo-md-btn" type="button" onClick={() => downloadMarkdown(markdown, fileName || 'document.md')}><Download />Download MD</button> : null}
          {mode !== 'docx-to-markdown' && markdown.trim() ? <button className="fwo-md-btn" type="button" disabled={busy} onClick={() => void convertDocx()}><Download />Download DOCX</button> : null}
          {mode !== 'markdown-editor' ? <button className="fwo-md-btn primary" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <RefreshCw /> : <FolderOpen />}{busy ? 'Working…' : 'Open another'}</button> : null}
        </div>
      </div> : null}

      {mode !== 'markdown-editor' && !fileName ? (
        <div className="fwo-md-empty fwo-md-picker">
          <button className="fwo-md-btn primary" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <RefreshCw /> : <FolderOpen />}{busy ? 'Working…' : 'Choose Files'}</button>
        </div>
      ) : (
        <div className="fwo-md-work">
          <textarea className="fwo-md-editor" value={markdown} readOnly={docxInput} onChange={(event) => setMarkdown(event.target.value)} aria-label="Markdown source" />
          <div className="fwo-md-preview"><div style={{display:'flex',alignItems:'center',gap:7,color:'#5f6368',fontSize:12,marginBottom:16}}><Eye size={16}/>Preview</div><div dangerouslySetInnerHTML={{ __html: preview }} /></div>
        </div>
      )}
      {warnings.length ? <div className="fwo-md-note warn">{warnings.map((warning) => warning.message).join(' ')}</div> : null}
      {(fileName || mode === 'markdown-editor') ? <div className="fwo-md-note">Markdown conversion preserves common text structure such as headings, paragraphs, emphasis, lists, links, code, blockquotes, and simple tables. Complex Word layout and unsupported embedded content may be simplified.</div> : null}
    </div>
  );
}
