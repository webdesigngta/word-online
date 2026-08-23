'use client';

import { useState } from 'react';

export type EditorIntentMode = 'docx-editor' | 'create-word-document';

function focusEditor() {
  document.querySelector<HTMLElement>('.editor-page')?.focus({ preventScroll: true });
}

function openDocumentPicker() {
  document.querySelector<HTMLInputElement>('.editor-route input.hidden-input[type="file"]')?.click();
}

function openTemplates() {
  const pageTools = document.querySelector<HTMLButtonElement>('.fwo-page-tools-trigger');
  pageTools?.click();
  window.setTimeout(() => {
    const templateButton = Array.from(document.querySelectorAll<HTMLButtonElement>('.fwo-page-popover button'))
      .find((button) => button.textContent?.includes('Templates'));
    templateButton?.click();
  }, 0);
}

export function EditorIntentPrompt({ mode }: { mode: EditorIntentMode }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const isDocx = mode === 'docx-editor';

  return (
    <aside className="fwo-intent-prompt" aria-label={isDocx ? 'DOCX editor start options' : 'New document start options'}>
      <style>{`
        .fwo-intent-prompt{position:fixed;z-index:145;right:18px;bottom:18px;width:min(360px,calc(100vw - 28px));border:1px solid #d7e0ee;border-radius:18px;background:#fff;box-shadow:0 12px 34px rgba(60,64,67,.18);padding:16px;font-family:Arial,Helvetica,sans-serif;color:#202124}.fwo-intent-prompt-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.fwo-intent-prompt h2{font-size:16px;line-height:1.35;margin:0}.fwo-intent-prompt p{font-size:12px;line-height:1.55;color:#5f6368;margin:6px 0 14px}.fwo-intent-prompt-close{border:0;background:transparent;color:#5f6368;border-radius:999px;width:28px;height:28px;cursor:pointer;font-size:18px}.fwo-intent-prompt-actions{display:flex;gap:8px;flex-wrap:wrap}.fwo-intent-prompt-actions button{border:0;border-radius:999px;padding:9px 14px;font-weight:700;font-size:12px;cursor:pointer}.fwo-intent-primary{background:#0b57d0;color:#fff}.fwo-intent-secondary{background:#eef3fb;color:#174ea6}@media(max-width:620px){.fwo-intent-prompt{right:14px;left:14px;bottom:14px;width:auto}}
      `}</style>
      <div className="fwo-intent-prompt-head">
        <div>
          <h2>{isDocx ? 'Open a DOCX to start editing' : 'Create a new Word document'}</h2>
          <p>{isDocx ? 'This route is optimized for opening an existing .docx file, editing it, and downloading a new DOCX copy.' : 'Start with a clean page or load a starter template for a resume, letter, meeting notes, report, or invoice.'}</p>
        </div>
        <button className="fwo-intent-prompt-close" type="button" aria-label="Dismiss start options" onClick={() => setVisible(false)}>×</button>
      </div>
      <div className="fwo-intent-prompt-actions">
        {isDocx ? (
          <>
            <button className="fwo-intent-primary" type="button" onClick={openDocumentPicker}>Open DOCX</button>
            <button className="fwo-intent-secondary" type="button" onClick={() => { setVisible(false); focusEditor(); }}>Start blank instead</button>
          </>
        ) : (
          <>
            <button className="fwo-intent-primary" type="button" onClick={openTemplates}>Choose a template</button>
            <button className="fwo-intent-secondary" type="button" onClick={() => { setVisible(false); focusEditor(); }}>Start blank</button>
          </>
        )}
      </div>
    </aside>
  );
}
