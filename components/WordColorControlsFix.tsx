'use client';

import { useEffect, useRef } from 'react';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page[contenteditable="true"], .editor-page');
}

function selectionRange(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  try {
    return editor.contains(range.commonAncestorContainer) || range.commonAncestorContainer === editor
      ? range
      : null;
  } catch {
    return null;
  }
}

function restoreRange(editor: HTMLElement, range: Range | null) {
  if (!range) return false;
  try {
    if (!range.startContainer.isConnected || !range.endContainer.isConnected) return false;
    if (!editor.contains(range.commonAncestorContainer) && range.commonAncestorContainer !== editor) return false;
    const selection = window.getSelection();
    editor.focus({ preventScroll: true });
    selection?.removeAllRanges();
    selection?.addRange(range.cloneRange());
    return true;
  } catch {
    return false;
  }
}

export function WordColorControlsFix() {
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorElement();
    const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
    if (!editor || !toolbar) return;

    const rememberSelection = () => {
      const range = selectionRange(editor);
      if (range) savedRangeRef.current = range.cloneRange();
    };

    const isColorControl = (target: EventTarget | null) => {
      const element = target instanceof HTMLElement ? target : null;
      const input = element?.closest<HTMLInputElement>('input[type="color"]');
      const tool = element?.closest<HTMLElement>('.docs-color-tool');
      return Boolean(
        (input && (input.getAttribute('aria-label') === 'Text color' || input.getAttribute('aria-label') === 'Highlight color')) ||
        tool?.querySelector('input[aria-label="Text color"],input[aria-label="Highlight color"]'),
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!isColorControl(event.target)) return;
      rememberSelection();
    };

    const onMouseDown = (event: MouseEvent) => {
      if (!isColorControl(event.target)) return;
      rememberSelection();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!isColorControl(event.target)) return;
      rememberSelection();
    };

    const applyColor = (event: Event) => {
      const input = event.target instanceof HTMLInputElement ? event.target : null;
      if (!input || input.type !== 'color') return;
      const label = input.getAttribute('aria-label');
      if (label !== 'Text color' && label !== 'Highlight color') return;

      // Own the color event so React's legacy handler and the newer selection
      // bridge do not both run the same formatting command.
      event.stopPropagation();
      event.stopImmediatePropagation();

      const current = selectionRange(editor);
      if (current) savedRangeRef.current = current.cloneRange();
      if (!restoreRange(editor, savedRangeRef.current)) return;

      document.execCommand('styleWithCSS', false, 'true');
      if (label === 'Text color') {
        document.execCommand('foreColor', false, input.value);
      } else {
        const applied = document.execCommand('hiliteColor', false, input.value);
        if (!applied) document.execCommand('backColor', false, input.value);
      }

      const tool = input.closest<HTMLElement>('.docs-color-tool');
      if (tool) {
        tool.style.setProperty('--fwo-selected-color', input.value);
        tool.dataset.fwoHasColor = input.value.toLowerCase() === '#ffffff' ? 'false' : 'true';
      }

      editor.dispatchEvent(new Event('input', { bubbles: true }));

      // Keep the formatted selection/caret in the document after the native
      // color picker closes so the next toolbar action applies to the same text.
      const after = selectionRange(editor);
      if (after) savedRangeRef.current = after.cloneRange();
      requestAnimationFrame(() => restoreRange(editor, savedRangeRef.current));
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('input', applyColor, true);
    document.addEventListener('change', applyColor, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('input', applyColor, true);
      document.removeEventListener('change', applyColor, true);
    };
  }, []);

  return null;
}
