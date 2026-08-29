'use client';

import { useEffect } from 'react';
import { serializableEditorHtml } from '@/components/A4Pagination';

function getEditor() {
  return document.querySelector<HTMLElement>('.editor-page[contenteditable]');
}

function selectionIsInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;
  const range = selection.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer) || range.commonAncestorContainer === editor;
}

function selectionCoversEditor(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;
  const range = selection.getRangeAt(0);
  return range.startContainer === editor
    && range.startOffset === 0
    && range.endContainer === editor
    && range.endOffset === editor.childNodes.length;
}

function documentPlainText(html: string) {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.innerText || container.textContent || '';
}

/** Keeps common keyboard selection/copy actions scoped to the editable document, never the app chrome. */
export function EditorKeyboardScope() {
  useEffect(() => {
    const editor = getEditor();
    if (!editor) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== 'a') return;

      const target = event.target as Node | null;
      const active = document.activeElement;
      const editingDocument = Boolean(
        (target && (target === editor || editor.contains(target)))
        || (active && (active === editor || editor.contains(active)))
        || selectionIsInside(editor)
      );
      if (!editingDocument) return;

      event.preventDefault();
      event.stopPropagation();
      const range = document.createRange();
      range.selectNodeContents(editor);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      editor.focus({ preventScroll: true });
    };

    const onCopy = (event: ClipboardEvent) => {
      if (!selectionCoversEditor(editor) || !event.clipboardData) return;
      const html = serializableEditorHtml(editor);
      event.preventDefault();
      event.clipboardData.setData('text/html', html);
      event.clipboardData.setData('text/plain', documentPlainText(html));
    };

    editor.addEventListener('keydown', onKeyDown);
    editor.addEventListener('copy', onCopy);
    return () => {
      editor.removeEventListener('keydown', onKeyDown);
      editor.removeEventListener('copy', onCopy);
    };
  }, []);

  return null;
}
