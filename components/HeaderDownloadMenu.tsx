'use client';

import { ChevronDown, Download, FileText, FileType2, Printer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function documentTitle() {
  const input = document.querySelector<HTMLInputElement>('.docs-document-title');
  const clean = (input?.value || 'Untitled document').replace(/[\\/:*?"<>|]+/g, '').trim();
  return clean || 'Untitled document';
}

function legacyFileAction(label: string) {
  const fileButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.docs-menu-button'))
    .find((button) => button.textContent?.trim() === 'File');
  if (!fileButton) return;
  fileButton.click();
  window.setTimeout(() => {
    const item = Array.from(document.querySelectorAll<HTMLButtonElement>('.docs-menu-item'))
      .find((button) => button.textContent?.trim() === label);
    item?.click();
  }, 0);
}

function downloadLegacyDoc() {
  const editor = editorElement();
  if (!editor) return;

  const title = documentTitle();
  const content = editor.innerHTML;
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Free Word Online">
<title>${safeTitle}</title>
<style>
  @page { size: 8.5in 11in; margin: 1in; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #202124; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #c7c7c7; padding: 4px 6px; }
  img { max-width: 100%; height: auto; }
  .fwo-checklist { list-style: none; padding-left: 0; }
  .fwo-checklist li[data-checked='true']::before { content: '☑ '; }
  .fwo-checklist li[data-checked='false']::before { content: '☐ '; }
</style>
</head>
<body>${content}</body>
</html>`;

  const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title}.doc`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadText() {
  const text = editorElement()?.innerText || '';
  const title = documentTitle();
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function HeaderDownloadMenu() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = document.querySelector<HTMLElement>('.docs-right');
    if (!parent) return;

    const mount = document.createElement('div');
    mount.className = 'fwo-header-download-host';
    const oldPdf = parent.querySelector<HTMLElement>('.docs-pdf-button');
    const before = oldPdf || parent.querySelector<HTMLElement>('.docs-share-button');
    parent.insertBefore(mount, before || null);
    oldPdf?.remove();
    setHost(mount);

    return () => {
      mount.remove();
      setHost(null);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (wrapRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!host) return null;

  const choose = (action: () => void) => {
    setOpen(false);
    action();
  };

  return createPortal(
    <div ref={wrapRef} className="fwo-header-download-wrap">
      <button
        type="button"
        className="docs-action-pill fwo-header-download-button"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Download"
        onClick={() => setOpen((value) => !value)}
      >
        <Download className="fwo-header-download-main-icon" />
        <span>Download</span>
        <ChevronDown className="fwo-header-download-chevron" />
      </button>

      {open && (
        <div className="fwo-header-download-menu" role="menu" aria-label="Download document">
          <button type="button" role="menuitem" onClick={() => choose(() => legacyFileAction('Download DOCX'))}>
            <FileType2 /><span><strong>Word (.docx)</strong><small>Modern Microsoft Word</small></span>
          </button>
          <button type="button" role="menuitem" onClick={() => choose(downloadLegacyDoc)}>
            <FileText /><span><strong>Word 97–2003 (.doc)</strong><small>Compatible with Google Docs</small></span>
          </button>
          <div className="fwo-header-download-separator" />
          <button type="button" role="menuitem" onClick={() => choose(() => window.print())}>
            <Printer /><span><strong>PDF (.pdf)</strong><small>Print or save as PDF</small></span>
          </button>
          <button type="button" role="menuitem" onClick={() => choose(() => legacyFileAction('Download HTML'))}>
            <FileText /><span><strong>HTML (.html)</strong><small>Web document</small></span>
          </button>
          <button type="button" role="menuitem" onClick={() => choose(downloadText)}>
            <FileText /><span><strong>Plain text (.txt)</strong><small>Text only</small></span>
          </button>
        </div>
      )}

      <style jsx global>{`
        .fwo-header-download-host { display:flex; align-items:center; position:relative; }
        .fwo-header-download-wrap { position:relative; display:flex; align-items:center; }
        .fwo-header-download-button { gap:7px !important; cursor:pointer; white-space:nowrap; }
        .fwo-header-download-button .fwo-header-download-main-icon { width:17px; height:17px; }
        .fwo-header-download-button .fwo-header-download-chevron { width:14px; height:14px; margin-left:1px; }
        .fwo-header-download-menu { position:absolute; top:calc(100% + 7px); right:0; z-index:7200; width:268px; max-height:calc(100vh - 78px); overflow:auto; box-sizing:border-box; padding:7px; border:1px solid #dfe3e7; border-radius:12px; background:#fff; box-shadow:0 10px 30px rgba(60,64,67,.24),0 2px 7px rgba(60,64,67,.12); font-family:Arial,Helvetica,sans-serif; }
        .fwo-header-download-menu button { width:100%; min-height:48px; border:0; border-radius:8px; background:transparent; color:#202124; padding:7px 9px; display:grid; grid-template-columns:22px minmax(0,1fr); gap:10px; align-items:center; text-align:left; cursor:pointer; }
        .fwo-header-download-menu button:hover { background:#f1f3f4; }
        .fwo-header-download-menu button svg { width:18px; height:18px; color:#5f6368; }
        .fwo-header-download-menu button span { min-width:0; display:grid; gap:2px; }
        .fwo-header-download-menu strong { font-size:13px; line-height:1.2; font-weight:500; }
        .fwo-header-download-menu small { color:#7b8085; font-size:10.5px; line-height:1.25; }
        .fwo-header-download-separator { height:1px; margin:5px 3px; background:#e0e3e7; }
        @media(max-width:720px) {
          .fwo-header-download-button > span { display:none; }
          .fwo-header-download-button { min-width:38px !important; padding:0 8px !important; }
          .fwo-header-download-menu { position:fixed; top:58px; left:8px; right:8px; width:auto; max-height:calc(100vh - 70px); }
        }
      `}</style>
    </div>,
    host,
  );
}
