'use client';

import { useEffect, useRef } from 'react';

type SelectionBookmark = {
  start: number;
  end: number;
};

const FORMAT_LABELS = new Set([
  'Bold',
  'Italic',
  'Underline',
  'Clear formatting',
  'Text color',
  'Highlight color',
  'Font family',
  'Paragraph style',
  'Font size menu',
  'Decrease font size',
  'Increase font size',
  'Align left',
  'Alignment options',
  'Line spacing',
  'Checklist',
  'Checklist options',
  'Bulleted list',
  'Numbered list',
  'Decrease indent',
  'Increase indent',
]);

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function controlLabel(target: HTMLElement | null) {
  const control = target?.closest<HTMLElement>('button,label,select,input');
  return (control?.getAttribute('aria-label') || control?.getAttribute('title') || '').trim();
}

function rangeInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  try {
    return editor.contains(range.commonAncestorContainer) ? range : null;
  } catch {
    return null;
  }
}

function absoluteOffset(editor: HTMLElement, container: Node, offset: number) {
  try {
    const probe = document.createRange();
    probe.setStart(editor, 0);
    probe.setEnd(container, offset);
    return probe.toString().length;
  } catch {
    return null;
  }
}

function bookmarkSelection(editor: HTMLElement): SelectionBookmark | null {
  const range = rangeInside(editor);
  if (!range || range.collapsed) return null;
  const start = absoluteOffset(editor, range.startContainer, range.startOffset);
  const end = absoluteOffset(editor, range.endContainer, range.endOffset);
  if (start === null || end === null || end <= start) return null;
  return { start, end };
}

function boundaryAtTextOffset(editor: HTMLElement, target: number) {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let node: Node | null = walker.nextNode();
  let lastText: Text | null = null;

  while (node) {
    const text = node as Text;
    lastText = text;
    const length = text.data.length;
    if (target <= consumed + length) {
      return { node: text, offset: Math.max(0, Math.min(length, target - consumed)) };
    }
    consumed += length;
    node = walker.nextNode();
  }

  if (lastText) return { node: lastText, offset: lastText.data.length };
  return null;
}

function restoreBookmark(editor: HTMLElement, bookmark: SelectionBookmark | null) {
  if (!bookmark) return false;
  const start = boundaryAtTextOffset(editor, bookmark.start);
  const end = boundaryAtTextOffset(editor, bookmark.end);
  if (!start || !end) return false;

  try {
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    const selection = window.getSelection();
    editor.focus({ preventScroll: true });
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  } catch {
    return false;
  }
}

function isFormattingTarget(target: HTMLElement | null, toolbar: HTMLElement) {
  if (!target) return false;

  if (target.closest('.fwo-font-item,.fwo-style-item,.fwo-font-size-menu,.fwo-local-popover')) return true;

  if (!toolbar.contains(target)) return false;
  const label = controlLabel(target);
  if (FORMAT_LABELS.has(label)) return true;

  return Boolean(target.closest(
    '.fwo-font-wrap,.fwo-style-wrap,.docs-font-size-control,.docs-color-tool,.docs-toolbar-mode-group,' +
    '.docs-toolbar-combo[data-fwo-single-trigger="true"]',
  ));
}

export function PersistentFormattingSelection() {
  const bookmarkRef = useRef<SelectionBookmark | null>(null);
  const restoringRef = useRef(false);

  useEffect(() => {
    const editor = editorElement();
    const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
    if (!editor || !toolbar) return;

    const rememberCurrentSelection = () => {
      if (restoringRef.current) return;
      const bookmark = bookmarkSelection(editor);
      if (bookmark) bookmarkRef.current = bookmark;
    };

    const restore = () => {
      const bookmark = bookmarkRef.current;
      if (!bookmark) return;
      restoringRef.current = true;
      restoreBookmark(editor, bookmark);
      window.requestAnimationFrame(() => {
        const refreshed = bookmarkSelection(editor);
        if (refreshed) bookmarkRef.current = refreshed;
        restoringRef.current = false;
      });
    };

    const restoreAfterFormatting = () => {
      queueMicrotask(() => {
        restore();
        window.requestAnimationFrame(() => restore());
      });
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!isFormattingTarget(target, toolbar)) return;
      rememberCurrentSelection();
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!isFormattingTarget(target, toolbar)) return;
      rememberCurrentSelection();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!isFormattingTarget(target, toolbar)) return;
      restoreAfterFormatting();
    };

    const onChange = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!isFormattingTarget(target, toolbar)) return;
      restoreAfterFormatting();
    };

    const onInput = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!isFormattingTarget(target, toolbar)) return;
      restoreAfterFormatting();
    };

    const onSelectionChange = () => {
      if (restoringRef.current) return;
      const range = rangeInside(editor);
      if (!range || range.collapsed) return;
      const bookmark = bookmarkSelection(editor);
      if (bookmark) bookmarkRef.current = bookmark;
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('change', onChange, true);
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, []);

  return null;
}
