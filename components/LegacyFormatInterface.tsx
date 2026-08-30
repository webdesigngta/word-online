'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, FolderOpen, Pencil, RefreshCw } from 'lucide-react';
import {
  downloadDocumentBlob,
  loadOdtHtml,
  loadRtfHtml,
  saveHtmlAsOdt,
  saveHtmlAsPdf,
  saveHtmlAsRtf,
} from '@/tools/document/formatHelpers';

export type LegacyFormatMode = 'odt-editor' | 'odt-viewer' | 'odt-to-pdf' | 'rtf-editor' | 'rtf-viewer';

type Warning = { code?: string; message: string };

function modeConfig(mode: LegacyFormatMode) {
  const odt = mode.startsWith('odt');
  const editor = mode.endsWith('editor');
  const viewer = mode.endsWith('viewer');
  return {
    odt,
    editor,
    viewer,
    label: mode === 'odt-to-pdf' ? 'ODT to PDF' : `${odt ? 'ODT' : 'RTF'} ${editor ? 'Editor' : 'Viewer'}`,
    accept: odt ? '.odt,application/vnd.oasis.opendocument.text' : '.rtf,application/rtf,text/rtf',
    extension: odt ? 'odt' : 'rtf',
  };
}

function warningText(warnings: readonly Warning[]) {
  return warnings.map((warning) => warning.message).filter(Boolean).join(' ');
}

export function LegacyFormatInterface({ mode }: { mode: LegacyFormatMode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('Choose a document to begin.');
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const config = modeConfig(mode);

  useEffect(() => {
    if (config.editor && editorRef.current) editorRef.current.innerHTML = html;
  }, [fileName, config.editor, html]);

  async function open(file?: File) {
    if (!file) return;
    setBusy(true);
    setWarnings([]);
    setDirty(false);
    setStatus(`Opening ${file.name}…`);
    try {
      if (!new RegExp(`\\.${config.extension}$`, 'i').test(file.name)) throw new Error(`Choose a ${config.extension.toUpperCase()} file.`);
      if (file.size <= 0 || file.size > 25 * 1024 * 1024) throw new Error('Files must be between 1 byte and 25 MB.');
      const loaded = config.odt ? await loadOdtHtml(file) : await loadRtfHtml(file);
      setHtml(loaded.html);
      setWarnings([...loaded.warnings]);
      setFileName(file.name);
      setStatus(`${config.extension.toUpperCase()} loaded locally in your browser.`);
    } catch (error) {
      setHtml('');
      setFileName('');
      setStatus(error instanceof Error ? error.message : 'Could not open this document.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function currentHtml() {
    return config.editor ? editorRef.current?.innerHTML || html : html;
  }

  async function saveEdited() {
    if (!fileName) return;
    setBusy(true);
    setStatus('Building your updated document…');
    try {
      const result = config.odt ? await saveHtmlAsOdt(currentHtml(), fileName) : saveHtmlAsRtf(currentHtml(), fileName);
      downloadDocumentBlob(result.blob, result.name);
      setWarnings([...result.warnings]);
      setDirty(false);
      setStatus(`Updated ${config.extension.toUpperCase()} downloaded.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save this document.');
    } finally {
      setBusy(false);
    }
  }

  async function convertPdf() {
    if (!fileName || !html) return;
    setBusy(true);
    setStatus('Creating PDF…');
    try {
      const result = await saveHtmlAsPdf(html, fileName);
      downloadDocumentBlob(result.blob, result.name);
      setWarnings([...result.warnings]);
      setStatus('PDF downloaded.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create the PDF.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fwo-legacy-tool">
      <style>{`
        .fwo-legacy-tool{display:grid;gap:16px}.fwo-legacy-top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.fwo-legacy-file{display:flex;align-items:center;gap:10px;min-width:0}.fwo-legacy-icon{width:42px;height:42px;border-radius:12px;background:#e8f0fe;color:#174ea6;display:grid;place-items:center}.fwo-legacy-icon svg{width:21px}.fwo-legacy-copy{min-width:0}.fwo-legacy-copy strong{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px}.fwo-legacy-copy span{display:block;color:#5f6368;font-size:12px;margin-top:3px}.fwo-legacy-actions{display:flex;gap:8px;flex-wrap:wrap}.fwo-legacy-btn{border:1px solid #dadce0;border-radius:20px;background:#fff;color:#202124;padding:9px 14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px}.fwo-legacy-btn.primary{background:#0b57d0;color:#fff;border-color:#0b57d0}.fwo-legacy-btn:disabled{opacity:.55;cursor:not-allowed}.fwo-legacy-btn svg{width:16px}.fwo-legacy-empty{min-height:330px;border:2px dashed #d5dae2;border-radius:16px;background:#fbfcfe;display:grid;place-items:center;text-align:center;padding:32px;color:#5f6368}.fwo-legacy-empty svg{width:42px;height:42px;color:#174ea6;margin-bottom:10px}.fwo-legacy-paper{min-height:420px;max-height:65vh;overflow:auto;border:1px solid #dadce0;border-radius:14px;background:#fff;padding:36px 42px;box-shadow:0 1px 2px rgba(60,64,67,.08);line-height:1.55;color:#202124}.fwo-legacy-paper[contenteditable=true]{outline:none}.fwo-legacy-paper[contenteditable=true]:focus{box-shadow:inset 0 0 0 2px #0b57d0}.fwo-legacy-paper h1,.fwo-legacy-paper h2,.fwo-legacy-paper h3{line-height:1.2}.fwo-legacy-paper table{border-collapse:collapse;max-width:100%}.fwo-legacy-paper td,.fwo-legacy-paper th{border:1px solid #dadce0;padding:6px 8px}.fwo-legacy-note{font-size:12px;color:#5f6368;border-radius:10px;background:#f8fafd;padding:10px 12px}.fwo-legacy-note.warn{background:#fff8e1;color:#7a4d00}@media(max-width:700px){.fwo-legacy-paper{padding:24px 20px}.fwo-legacy-copy strong{max-width:230px}.fwo-legacy-btn{padding:8px 11px}}
      `}</style>
      <input ref={inputRef} type="file" accept={config.accept} hidden onChange={(event) => void open(event.target.files?.[0])} />

      {html ? <div className="fwo-legacy-top">
        <div className="fwo-legacy-file">
          <div className="fwo-legacy-icon">{config.editor ? <Pencil /> : config.viewer ? <Eye /> : <FileText />}</div>
          <div className="fwo-legacy-copy"><strong>{fileName}</strong><span>{status}{dirty ? ' Unsaved changes.' : ''}</span></div>
        </div>
        <div className="fwo-legacy-actions">
          {config.editor && fileName ? <button className="fwo-legacy-btn" type="button" disabled={busy} onClick={() => void saveEdited()}><Download />Save {config.extension.toUpperCase()}</button> : null}
          {mode === 'odt-to-pdf' && fileName ? <button className="fwo-legacy-btn" type="button" disabled={busy} onClick={() => void convertPdf()}><Download />Download PDF</button> : null}
          <button className="fwo-legacy-btn primary" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <RefreshCw /> : <FolderOpen />}{busy ? 'Working…' : 'Open another'}</button>
        </div>
      </div> : null}

      {!html ? (
        <div className="fwo-legacy-empty fwo-legacy-picker">
          <button className="fwo-legacy-btn primary" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <RefreshCw /> : <FolderOpen />}{busy ? 'Working…' : 'Choose Files'}</button>
        </div>
      ) : config.editor ? (
        <div ref={editorRef} className="fwo-legacy-paper" contentEditable suppressContentEditableWarning onInput={() => setDirty(true)} />
      ) : (
        <div className="fwo-legacy-paper" dangerouslySetInnerHTML={{ __html: html }} />
      )}

      {warnings.length ? <div className="fwo-legacy-note warn">{warningText(warnings)}</div> : null}
      {html ? <div className="fwo-legacy-note">These lightweight tools preserve supported text structure and common inline formatting. Complex office-only layout, embedded media, tracked changes, advanced styles, and unsupported format features may be simplified.</div> : null}
    </div>
  );
}
