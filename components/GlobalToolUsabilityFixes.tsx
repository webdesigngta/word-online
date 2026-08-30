'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function routeClass(pathname: string) {
  const slug = pathname.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'home';
  return `doc321-route-${slug}`;
}

function plainTextPaste(editor: HTMLElement, event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text/plain');
  if (text == null) return;
  event.preventDefault();
  event.stopPropagation();

  editor.focus({ preventScroll: true });
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    document.execCommand('insertText', false, text);
  } else {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    lines.forEach((line, index) => {
      if (index) fragment.appendChild(document.createElement('br'));
      if (line) fragment.appendChild(document.createTextNode(line));
    });
    const last = fragment.lastChild;
    range.insertNode(fragment);
    if (last) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(last);
      nextRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(nextRange);
    }
  }

  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function makeTxtPicker(drop: HTMLButtonElement) {
  if (drop.dataset.doc321PickerReady === 'true') return;
  drop.dataset.doc321PickerReady = 'true';
  drop.dataset.uniformEmptyPicker = 'true';
  drop.dataset.uniformDropzone = 'true';
  drop.setAttribute('aria-label', 'Choose Files');
  drop.innerHTML = `
    <span class="doc321-target-upload-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="M12 18v-6"/>
        <path d="m9 15 3-3 3 3"/>
      </svg>
    </span>
    <strong>Choose Files</strong>
    <span class="doc321-target-upload-hint">or drag &amp; drop files here</span>
  `;
}

export function GlobalToolUsabilityFixes() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const currentClass = routeClass(pathname);
    html.classList.add(currentClass);
    return () => html.classList.remove(currentClass);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/online-notepad' && pathname !== '/online-notepad/') return;
    const attach = () => {
      const editor = document.querySelector<HTMLElement>('.np-editor[contenteditable="true"]');
      if (!editor || editor.dataset.doc321PlainPaste === 'true') return;
      editor.dataset.doc321PlainPaste = 'true';
      const handler = (event: ClipboardEvent) => plainTextPaste(editor, event);
      editor.addEventListener('paste', handler, true);
      (editor as HTMLElement & { __doc321PasteCleanup?: () => void }).__doc321PasteCleanup = () => editor.removeEventListener('paste', handler, true);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      const editor = document.querySelector<HTMLElement>('.np-editor[data-doc321-plain-paste="true"]') as (HTMLElement & { __doc321PasteCleanup?: () => void }) | null;
      editor?.__doc321PasteCleanup?.();
      editor?.removeAttribute('data-doc321-plain-paste');
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/txt-to-pdf' && pathname !== '/txt-to-pdf/') return;
    const fix = () => {
      const drop = document.querySelector<HTMLButtonElement>('.simple-pdf-drop');
      if (drop) makeTxtPicker(drop);
    };
    fix();
    const observer = new MutationObserver(fix);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <style jsx global>{`
      /* PDF roadmap upload cards: keep the tool-specific icon instead of replacing
         Translate / Chat / PDF-A with the same generic upload arrow. */
      html.doc321-route-translate-pdf .rr-empty .uniform-upload-icon,
      html.doc321-route-chat-with-pdf .rr-empty .uniform-upload-icon,
      html.doc321-route-pdf-to-pdfa .rr-empty .uniform-upload-icon {
        display: none !important;
      }
      html.doc321-route-translate-pdf .rr-empty > svg,
      html.doc321-route-chat-with-pdf .rr-empty > svg,
      html.doc321-route-pdf-to-pdfa .rr-empty > svg {
        display: block !important;
        box-sizing: content-box !important;
        width: 28px !important;
        height: 28px !important;
        padding: 13px !important;
        border-radius: 16px !important;
        background: var(--tool-soft) !important;
        color: var(--tool-primary) !important;
        stroke: currentColor !important;
      }
      html.doc321-route-translate-pdf .rr-empty,
      html.doc321-route-chat-with-pdf .rr-empty,
      html.doc321-route-pdf-to-pdfa .rr-empty {
        min-height: 330px !important;
      }

      /* TXT to PDF: one obvious upload action while empty, then a compact file row
         and a strong conversion action after a TXT file has been selected. */
      html.doc321-route-txt-to-pdf .simple-pdf-tool:has(.simple-pdf-drop) .simple-pdf-row .simple-pdf-actions {
        display: none !important;
      }
      html.doc321-route-txt-to-pdf .simple-pdf-drop[data-doc321-picker-ready='true'] {
        min-height: 320px !important;
        padding: 34px 20px !important;
        border: 2px dashed #cfd8e6 !important;
        border-radius: 18px !important;
        background: #fbfdff !important;
        display: grid !important;
        place-items: center !important;
        align-content: center !important;
        gap: 14px !important;
        color: #0f172a !important;
        cursor: pointer !important;
      }
      html.doc321-route-txt-to-pdf .simple-pdf-drop[data-doc321-picker-ready='true'] .doc321-target-upload-icon {
        width: 58px !important;
        height: 58px !important;
        border-radius: 17px !important;
        display: grid !important;
        place-items: center !important;
        background: var(--tool-soft) !important;
        color: var(--tool-primary) !important;
      }
      html.doc321-route-txt-to-pdf .simple-pdf-drop[data-doc321-picker-ready='true'] .doc321-target-upload-icon svg {
        width: 28px !important;
        height: 28px !important;
      }
      html.doc321-route-txt-to-pdf .simple-pdf-drop[data-doc321-picker-ready='true'] strong {
        min-width: 210px !important;
        min-height: 54px !important;
        padding: 0 28px !important;
        border-radius: 12px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: linear-gradient(135deg, var(--tool-primary), var(--tool-secondary)) !important;
        color: #fff !important;
        box-shadow: 0 9px 24px color-mix(in srgb, var(--tool-primary) 24%, transparent) !important;
        font-size: 15px !important;
        font-weight: 800 !important;
      }
      html.doc321-route-txt-to-pdf .simple-pdf-drop[data-doc321-picker-ready='true'] .doc321-target-upload-hint {
        color: #64748b !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }
      html.doc321-route-txt-to-pdf .simple-pdf-tool > .simple-pdf-button:not(.secondary) {
        justify-self: center !important;
        min-width: 230px !important;
        min-height: 52px !important;
        padding: 0 24px !important;
        border-radius: 12px !important;
        background: linear-gradient(135deg, var(--tool-primary), var(--tool-secondary)) !important;
        box-shadow: 0 9px 24px color-mix(in srgb, var(--tool-primary) 24%, transparent) !important;
        font-size: 14px !important;
        font-weight: 800 !important;
      }
      html.doc321-route-txt-to-pdf .simple-pdf-tool > .simple-pdf-button:not(.secondary):disabled {
        background: #e7ebf0 !important;
        color: #8b93a1 !important;
        box-shadow: none !important;
      }

      /* Spreadsheet Online uses the browser viewport as its working canvas. */
      html.doc321-route-spreadsheet-online .platform-task-page {
        padding: 10px 12px 46px !important;
      }
      html.doc321-route-spreadsheet-online .platform-task-wrap {
        width: 100% !important;
        max-width: none !important;
      }
      html.doc321-route-spreadsheet-online .platform-task-hero {
        margin-top: 8px !important;
        border-radius: 18px !important;
      }
      html.doc321-route-spreadsheet-online .platform-task-hero-head {
        max-width: none !important;
        padding: 20px 18px 14px !important;
      }
      html.doc321-route-spreadsheet-online .platform-task-hero h1 {
        font-size: clamp(30px, 3vw, 42px) !important;
      }
      html.doc321-route-spreadsheet-online .platform-task-workspace {
        margin: 0 10px 10px !important;
        min-height: calc(100dvh - 205px) !important;
        padding: 14px !important;
        display: flex !important;
        flex-direction: column !important;
      }
      html.doc321-route-spreadsheet-online .platform-task-workspace-intro {
        flex: 0 0 auto !important;
        margin-bottom: 10px !important;
      }
      html.doc321-route-spreadsheet-online .fwo-sheet-tool {
        flex: 1 1 auto !important;
        min-height: calc(100dvh - 285px) !important;
        grid-template-rows: auto auto minmax(0, 1fr) auto !important;
      }
      html.doc321-route-spreadsheet-online .fwo-sheet-wrap {
        min-height: 58vh !important;
        height: calc(100dvh - 390px) !important;
        max-height: none !important;
        border-radius: 10px !important;
      }
      html.doc321-route-spreadsheet-online .fwo-sheet-table th,
      html.doc321-route-spreadsheet-online .fwo-sheet-table td,
      html.doc321-route-spreadsheet-online .fwo-sheet-cell {
        min-width: 104px !important;
      }

      /* Give text-heavy tools enough vertical room to work without constant resizing. */
      .fwo-count-textarea {
        min-height: clamp(520px, 60vh, 760px) !important;
      }
      .fwo-speech-editor {
        min-height: clamp(520px, 60vh, 760px) !important;
      }

      /* Online Notepad is deliberately plain when text is pasted. Headings still
         provide structure, but they do not change the ruled-line text size. */
      .notepad-is-shell .np-editor h1,
      .notepad-is-shell .np-editor h2,
      .notepad-is-shell .np-editor h3,
      .notepad-is-shell .np-editor h4,
      .notepad-is-shell .np-editor h5 {
        margin: 0 !important;
        color: inherit !important;
        font-family: inherit !important;
        font-size: inherit !important;
        line-height: inherit !important;
        font-weight: 700 !important;
        letter-spacing: normal !important;
      }

      @media (max-width: 700px) {
        html.doc321-route-spreadsheet-online .platform-task-page {
          padding-inline: 5px !important;
        }
        html.doc321-route-spreadsheet-online .platform-task-workspace {
          margin-inline: 2px !important;
          padding: 8px !important;
          min-height: calc(100dvh - 175px) !important;
        }
        html.doc321-route-spreadsheet-online .platform-task-hero-head {
          padding: 14px 10px 10px !important;
        }
        html.doc321-route-spreadsheet-online .fwo-sheet-tool {
          min-height: calc(100dvh - 240px) !important;
        }
        html.doc321-route-spreadsheet-online .fwo-sheet-wrap {
          height: calc(100dvh - 340px) !important;
          min-height: 520px !important;
        }
        .fwo-count-textarea,
        .fwo-speech-editor {
          min-height: 460px !important;
        }
      }
    `}</style>
  );
}
