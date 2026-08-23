'use client';

import { useEffect } from 'react';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function documentTitle() {
  const input = document.querySelector<HTMLInputElement>('.docs-document-title');
  const clean = (input?.value || 'Untitled document').replace(/[\\/:*?"<>|]+/g, '').trim();
  return clean || 'Untitled document';
}

function downloadLegacyDoc() {
  const editor = editorElement();
  if (!editor) return;

  const title = documentTitle();
  const content = editor.innerHTML;
  const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Free Word Online">
<title>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</title>
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

function makeMenuItem() {
  const wrap = document.createElement('div');
  wrap.className = 'fwo-doc-download-wrap';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'fwo-main-menu-item fwo-doc-download';
  button.setAttribute('role', 'menuitem');
  button.setAttribute('aria-label', 'Download Word 97–2003 DOC');
  button.innerHTML = '<span class="fwo-menu-empty-icon" aria-hidden="true"></span><span>Word 97–2003 (.doc)</span><span class="fwo-menu-shortcut"></span>';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    downloadLegacyDoc();
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });

  wrap.appendChild(button);
  return wrap;
}

export function LegacyDocDownload() {
  useEffect(() => {
    let scheduled = false;

    const enhance = () => {
      scheduled = false;
      const submenus = Array.from(document.querySelectorAll<HTMLElement>('.fwo-submenu[role="menu"]'));
      for (const submenu of submenus) {
        if (submenu.querySelector('.fwo-doc-download')) continue;

        const docxButton = Array.from(submenu.querySelectorAll<HTMLButtonElement>('.fwo-main-menu-item'))
          .find((button) => button.textContent?.trim() === 'Word (.docx)');
        if (!docxButton) continue;

        const docxWrap = docxButton.parentElement;
        const item = makeMenuItem();
        if (docxWrap?.parentElement === submenu) docxWrap.insertAdjacentElement('afterend', item);
        else submenu.insertBefore(item, submenu.children[1] || null);
      }
    };

    const scheduleEnhance = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(enhance);
    };

    const observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.body, { childList: true, subtree: true });

    const onMenuInteraction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.fwo-main-menu-row')) scheduleEnhance();
    };
    document.addEventListener('click', onMenuInteraction, true);
    document.addEventListener('mouseover', onMenuInteraction, true);
    scheduleEnhance();

    return () => {
      observer.disconnect();
      document.removeEventListener('click', onMenuInteraction, true);
      document.removeEventListener('mouseover', onMenuInteraction, true);
    };
  }, []);

  return null;
}
