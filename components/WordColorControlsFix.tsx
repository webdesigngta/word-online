'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_TEXT_COLOR = '#202124';
const DEFAULT_HIGHLIGHT_COLOR = '#fdd663';

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

function rgbToHex(value: string) {
  const normalized = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized;
  if (normalized === 'transparent' || normalized === 'rgba(0, 0, 0, 0)') return null;
  const match = normalized.match(/rgba?\(\s*(\d+)\s*[, ]+\s*(\d+)\s*[, ]+\s*(\d+)/i);
  if (!match) return null;
  return `#${[match[1], match[2], match[3]].map((part) => Math.max(0, Math.min(255, Number(part))).toString(16).padStart(2, '0')).join('')}`;
}

function selectionElement(editor: HTMLElement) {
  const range = selectionRange(editor);
  if (!range) return editor;
  let node: Node | null = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  return node instanceof HTMLElement && editor.contains(node) ? node : editor;
}

function inheritedHighlight(element: HTMLElement, editor: HTMLElement) {
  let current: HTMLElement | null = element;
  while (current && current !== editor) {
    const color = rgbToHex(getComputedStyle(current).backgroundColor);
    if (color && color !== '#ffffff') return color;
    current = current.parentElement;
  }
  return null;
}

function colorInput(toolbar: HTMLElement, label: 'Text color' | 'Highlight color') {
  return toolbar.querySelector<HTMLInputElement>(`input[type="color"][aria-label="${label}"]`);
}

function setToolColor(input: HTMLInputElement | null, color: string) {
  if (!input) return;
  if (input.value.toLowerCase() !== color.toLowerCase()) input.value = color;
  const tool = input.closest<HTMLElement>('.docs-color-tool');
  if (!tool) return;
  tool.style.setProperty('--fwo-selected-color', color);
  tool.dataset.fwoHasColor = 'true';
}

export function WordColorControlsFix() {
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorElement();
    const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
    if (!editor || !toolbar) return;

    const textInput = colorInput(toolbar, 'Text color');
    const highlightInput = colorInput(toolbar, 'Highlight color');
    setToolColor(textInput, textInput?.value || DEFAULT_TEXT_COLOR);
    setToolColor(highlightInput, highlightInput?.value || DEFAULT_HIGHLIGHT_COLOR);

    let lastApplied = '';
    let lastAppliedAt = 0;

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

    const syncFromSelection = () => {
      const range = selectionRange(editor);
      if (!range) return;
      savedRangeRef.current = range.cloneRange();
      const element = selectionElement(editor);
      const textColor = rgbToHex(getComputedStyle(element).color) || DEFAULT_TEXT_COLOR;
      setToolColor(textInput, textColor);

      // Keep the user's last chosen highlight color when the selection has no
      // highlight. If highlighted text is selected, reflect its actual color.
      const highlight = inheritedHighlight(element, editor);
      if (highlight) setToolColor(highlightInput, highlight);
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

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const now = performance.now();
      const signature = `${label}:${input.value.toLowerCase()}`;
      if (signature === lastApplied && now - lastAppliedAt < 80) return;
      lastApplied = signature;
      lastAppliedAt = now;

      const current = selectionRange(editor);
      if (current) savedRangeRef.current = current.cloneRange();
      if (!restoreRange(editor, savedRangeRef.current)) return;

      document.execCommand('styleWithCSS', false, 'true');
      let applied = false;
      if (label === 'Text color') {
        applied = document.execCommand('foreColor', false, input.value);
      } else {
        applied = document.execCommand('hiliteColor', false, input.value);
        if (!applied) applied = document.execCommand('backColor', false, input.value);
      }

      setToolColor(input, input.value);
      if (applied) editor.dispatchEvent(new Event('input', { bubbles: true }));

      const after = selectionRange(editor);
      if (after) savedRangeRef.current = after.cloneRange();
      requestAnimationFrame(() => restoreRange(editor, savedRangeRef.current));
    };

    const onSelectionChange = () => syncFromSelection();
    const onEditorSelection = () => requestAnimationFrame(syncFromSelection);

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('input', applyColor, true);
    document.addEventListener('change', applyColor, true);
    document.addEventListener('selectionchange', onSelectionChange);
    editor.addEventListener('mouseup', onEditorSelection);
    editor.addEventListener('keyup', onEditorSelection);
    editor.addEventListener('focus', onEditorSelection);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('input', applyColor, true);
      document.removeEventListener('change', applyColor, true);
      document.removeEventListener('selectionchange', onSelectionChange);
      editor.removeEventListener('mouseup', onEditorSelection);
      editor.removeEventListener('keyup', onEditorSelection);
      editor.removeEventListener('focus', onEditorSelection);
    };
  }, []);

  return (
    <style jsx global>{`
      .docs-color-tool {
        --fwo-selected-color: #202124;
        position: relative !important;
        overflow: visible !important;
      }
      .docs-color-tool.highlight {
        --fwo-selected-color: #fdd663;
      }
      .docs-color-tool::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 3px;
        width: 17px;
        height: 3px;
        border-radius: 2px;
        background: var(--fwo-selected-color) !important;
        box-shadow: 0 0 0 1px rgba(32,33,36,.12);
        transform: translateX(-50%);
        pointer-events: none;
      }
      .docs-color-tool.highlight::after {
        height: 4px;
      }
      .docs-color-tool input[type='color'] {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        padding: 0 !important;
        border: 0 !important;
        opacity: 0 !important;
        cursor: pointer !important;
      }
      .docs-color-tool:focus-within {
        outline: 2px solid #0b57d0;
        outline-offset: 1px;
        border-radius: 6px;
      }
    `}</style>
  );
}
