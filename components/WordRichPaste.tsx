'use client';

import { useEffect } from 'react';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function selectionRangeInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
  return range;
}

function insertPlainText(editor: HTMLElement, text: string) {
  editor.focus({ preventScroll: true });

  const selection = window.getSelection();
  const range = selectionRangeInside(editor);
  if (!selection || !range) {
    document.execCommand('insertText', false, text);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new CustomEvent('fwo:rich-paste', { bubbles: true }));
    return;
  }

  range.deleteContents();
  const fragment = document.createDocumentFragment();
  const normalized = text.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');

  lines.forEach((line, index) => {
    if (index > 0) fragment.appendChild(document.createElement('br'));
    if (line) fragment.appendChild(document.createTextNode(line));
  });

  // Keep the caret immediately after the pasted plain-text content.
  const marker = document.createTextNode('');
  fragment.appendChild(marker);
  range.insertNode(fragment);

  const nextRange = document.createRange();
  nextRange.setStartAfter(marker);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  marker.remove();

  editor.dispatchEvent(new Event('input', { bubbles: true }));
  // Keep this compatibility event because pagination/editor listeners already use it.
  editor.dispatchEvent(new CustomEvent('fwo:rich-paste', { bubbles: true }));
}

/**
 * DOC321 Word paste policy:
 * - every paste is plain text only
 * - source fonts, sizes, colors, highlights and styles are removed
 * - tables, borders, horizontal rules, images, backgrounds and layout markup are removed
 * - line breaks are retained as simple text line breaks
 *
 * The pasted text can still inherit the formatting of the destination paragraph,
 * exactly like typing text at the current caret position.
 */
export function WordRichPaste() {
  useEffect(() => {
    const editor = editorElement();
    if (!editor) return;

    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as Node | null;
      if (!target || !editor.contains(target)) return;
      if (editor.contentEditable === 'false') return;

      const text = event.clipboardData?.getData('text/plain');
      if (text == null) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      insertPlainText(editor, text);
    };

    editor.addEventListener('paste', onPaste, true);
    return () => editor.removeEventListener('paste', onPaste, true);
  }, []);

  return (
    <style jsx global>{`
      .docs-editor-workspace .editor-page {
        overflow-x: hidden !important;
        overflow-wrap: break-word;
        word-break: normal;
      }
      .docs-editor-workspace .editor-page p,
      .docs-editor-workspace .editor-page h1,
      .docs-editor-workspace .editor-page h2,
      .docs-editor-workspace .editor-page h3,
      .docs-editor-workspace .editor-page h4,
      .docs-editor-workspace .editor-page h5,
      .docs-editor-workspace .editor-page h6,
      .docs-editor-workspace .editor-page li,
      .docs-editor-workspace .editor-page blockquote,
      .docs-editor-workspace .editor-page pre {
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        overflow-wrap: break-word;
        word-break: normal;
      }
      .docs-editor-workspace .editor-page pre {
        white-space: pre-wrap !important;
      }
    `}</style>
  );
}
