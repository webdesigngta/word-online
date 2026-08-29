'use client';

import { useEffect, useRef } from 'react';

const SINGLE_TRIGGER_COMBOS = [
  ['Image options', 'Insert image'],
  ['Alignment options', 'Align left'],
  ['Checklist options', 'Checklist'],
  ['Editing mode options', 'Editing mode'],
] as const;

const PRESERVE_SELECTION_LABELS = new Set([
  'Bold',
  'Italic',
  'Underline',
  'Clear formatting',
  'Paint format',
  'Insert link',
  'Add comment',
  'Insert image',
  'Image options',
  'Align left',
  'Alignment options',
  'Line spacing',
  'Checklist',
  'Checklist options',
  'Bulleted list',
  'Numbered list',
  'Decrease indent',
  'Increase indent',
  'Decrease font size',
  'Increase font size',
]);

function getEditor() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function rangeInsideEditor(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer) ? range : null;
}

function restoreRange(editor: HTMLElement, range: Range | null) {
  if (!range) return;
  try {
    const selection = window.getSelection();
    editor.focus({ preventScroll: true });
    selection?.removeAllRanges();
    selection?.addRange(range.cloneRange());
  } catch {
    // A formatting action can replace the selected DOM. In that case the
    // browser keeps the closest valid caret position and the editor continues.
  }
}

function selectionElement(editor: HTMLElement) {
  const selection = window.getSelection();
  let node = selection?.anchorNode ?? null;
  if (!node || !editor.contains(node)) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  return node instanceof HTMLElement ? node : null;
}

function rgbToHex(value: string) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return null;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  const match = value.match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);
  if (!match) return null;
  return `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
}

function highlightColor(element: HTMLElement | null, editor: HTMLElement) {
  let current: HTMLElement | null = element;
  while (current && current !== editor) {
    const color = rgbToHex(getComputedStyle(current).backgroundColor);
    if (color) return color;
    current = current.parentElement;
  }
  return '#ffffff';
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  if (input.value === value || document.activeElement === input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function toolbarLabel(target: HTMLElement | null) {
  const control = target?.closest<HTMLElement>('button,label,select,input');
  if (!control) return '';
  return (control.getAttribute('aria-label') || control.getAttribute('title') || '').trim();
}

export function WordToolbarPolish() {
  const preservedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
    const editor = getEditor();
    if (!toolbar || !editor) return;

    const syncMode = () => {
      const combo = toolbar.querySelector<HTMLElement>('.docs-toolbar-mode-group .docs-toolbar-combo');
      if (!combo) return;
      const mode = editor.dataset.fwoMode || 'editing';
      combo.dataset.fwoMode = mode;
      const main = combo.querySelector<HTMLButtonElement>('button[aria-label="Editing mode"]');
      if (main && !main.querySelector('.fwo-editing-mode-text')) {
        const text = document.createElement('span');
        text.className = 'fwo-editing-mode-text';
        main.appendChild(text);
      }
      const text = main?.querySelector<HTMLElement>('.fwo-editing-mode-text');
      if (text) text.textContent = mode === 'suggesting' ? 'Suggesting' : mode === 'viewing' ? 'Viewing' : 'Editing';
    };

    const polishCombos = () => {
      for (const [arrowLabel, mainLabel] of SINGLE_TRIGGER_COMBOS) {
        const arrow = toolbar.querySelector<HTMLButtonElement>(`button[aria-label="${arrowLabel}"]`);
        const main = toolbar.querySelector<HTMLButtonElement>(`button[aria-label="${mainLabel}"]`);
        const combo = arrow?.closest<HTMLElement>('.docs-toolbar-combo') ?? main?.closest<HTMLElement>('.docs-toolbar-combo');
        if (combo) combo.dataset.fwoSingleTrigger = 'true';
      }
      const hideToolbar = toolbar.querySelector<HTMLElement>('[aria-label="Hide toolbar"]');
      if (hideToolbar) hideToolbar.dataset.fwoRemovedControl = 'true';
      syncMode();
    };

    const syncColors = () => {
      const textLabel = toolbar.querySelector<HTMLElement>('label[title="Text color"]');
      const highlightLabel = toolbar.querySelector<HTMLElement>('label[title="Highlight color"]');
      const textInput = textLabel?.querySelector<HTMLInputElement>('input[type="color"]');
      const highlightInput = highlightLabel?.querySelector<HTMLInputElement>('input[type="color"]');
      if (textLabel && textInput) textLabel.style.setProperty('--fwo-selected-color', textInput.value || '#202124');
      if (highlightLabel && highlightInput) highlightLabel.style.setProperty('--fwo-selected-color', highlightInput.value || '#fdd663');
    };

    const syncSelectionState = () => {
      const range = rangeInsideEditor(editor);
      if (!range) return;
      preservedRangeRef.current = range.cloneRange();

      const element = selectionElement(editor);
      if (!element) return;
      const style = getComputedStyle(element);

      const sizeInput = toolbar.querySelector<HTMLInputElement>('input[aria-label="Font size"]');
      const px = Number.parseFloat(style.fontSize);
      if (sizeInput && Number.isFinite(px) && px > 0) {
        const points = Math.round((px * 72 / 96) * 2) / 2;
        const display = Number.isInteger(points) ? String(points) : points.toFixed(1);
        setReactInputValue(sizeInput, display);
      }

      const textInput = toolbar.querySelector<HTMLInputElement>('input[aria-label="Text color"]');
      const textLabel = textInput?.closest<HTMLElement>('.docs-color-tool');
      const selectedTextColor = rgbToHex(style.color);
      if (textInput && textLabel && selectedTextColor) {
        textInput.value = selectedTextColor;
        textLabel.style.setProperty('--fwo-selected-color', selectedTextColor);
      }

      const highInput = toolbar.querySelector<HTMLInputElement>('input[aria-label="Highlight color"]');
      const highLabel = highInput?.closest<HTMLElement>('.docs-color-tool');
      const selectedHighlight = highlightColor(element, editor);
      if (highInput && highLabel) {
        highInput.value = selectedHighlight;
        highLabel.style.setProperty('--fwo-selected-color', selectedHighlight);
      }
    };

    const saveBeforeToolbarAction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target || !toolbar.contains(target)) return;
      const range = rangeInsideEditor(editor);
      if (range) preservedRangeRef.current = range.cloneRange();
    };

    const restoreForToolbarAction = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target || !toolbar.contains(target)) return;
      const label = toolbarLabel(target);
      if (PRESERVE_SELECTION_LABELS.has(label)) restoreRange(editor, preservedRangeRef.current);
    };

    const restoreForFieldChange = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target || !toolbar.contains(target)) return;
      const label = toolbarLabel(target);
      if (label === 'Text color' || label === 'Highlight color' || label === 'Font family' || label === 'Paragraph style') {
        restoreRange(editor, preservedRangeRef.current);
      }
      if (label === 'Text color' || label === 'Highlight color') {
        window.setTimeout(syncColors, 0);
      }
    };

    polishCombos();
    syncColors();
    syncSelectionState();

    const toolbarObserver = new MutationObserver(() => {
      polishCombos();
      syncColors();
    });
    toolbarObserver.observe(toolbar, { childList: true, subtree: true });

    const modeObserver = new MutationObserver(syncMode);
    modeObserver.observe(editor, { attributes: true, attributeFilter: ['data-fwo-mode'] });

    document.addEventListener('selectionchange', syncSelectionState);
    toolbar.addEventListener('mousedown', saveBeforeToolbarAction, true);
    toolbar.addEventListener('pointerdown', saveBeforeToolbarAction, true);
    toolbar.addEventListener('click', restoreForToolbarAction, true);
    toolbar.addEventListener('change', restoreForFieldChange, true);

    return () => {
      toolbarObserver.disconnect();
      modeObserver.disconnect();
      document.removeEventListener('selectionchange', syncSelectionState);
      toolbar.removeEventListener('mousedown', saveBeforeToolbarAction, true);
      toolbar.removeEventListener('pointerdown', saveBeforeToolbarAction, true);
      toolbar.removeEventListener('click', restoreForToolbarAction, true);
      toolbar.removeEventListener('change', restoreForFieldChange, true);
    };
  }, []);

  return (
    <style jsx global>{`
      .docs-toolbar [data-fwo-removed-control='true'],
      .fwo-show-toolbar {
        display: none !important;
      }

      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true'] {
        position: relative;
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding-right: 16px;
        border-radius: 15px;
        transition: background-color .12s ease;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true']:hover {
        background: #e2e7ec;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true'] > .docs-toolbar-button {
        pointer-events: none;
        width: auto !important;
        min-width: 28px;
        padding-left: 6px !important;
        padding-right: 3px !important;
        background: transparent !important;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true'] > .docs-toolbar-split {
        position: absolute !important;
        inset: 0 !important;
        z-index: 4;
        width: 100% !important;
        height: 100% !important;
        opacity: 0 !important;
        cursor: pointer;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true']::after,
      .docs-toolbar button[aria-label='Line spacing']::after,
      .docs-toolbar button[aria-label='Bulleted list']::after,
      .docs-toolbar button[aria-label='Numbered list']::after {
        content: '' !important;
        position: absolute;
        width: 5px;
        height: 5px;
        border-right: 1.4px solid #5f6368;
        border-bottom: 1.4px solid #5f6368;
        transform: rotate(45deg) !important;
        pointer-events: none;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true']::after {
        right: 6px;
        top: 10px;
      }
      .docs-toolbar button[aria-label='Line spacing'],
      .docs-toolbar button[aria-label='Bulleted list'],
      .docs-toolbar button[aria-label='Numbered list'] {
        position: relative;
        width: auto !important;
        min-width: 38px;
        padding-right: 14px !important;
      }
      .docs-toolbar button[aria-label='Line spacing']::after,
      .docs-toolbar button[aria-label='Bulleted list']::after,
      .docs-toolbar button[aria-label='Numbered list']::after {
        right: 4px;
        top: 10px;
      }

      .docs-toolbar-select {
        appearance: none !important;
        -webkit-appearance: none !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3.25 4.75 6 7.5l2.75-2.75' fill='none' stroke='%235f6368' stroke-width='1.35' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
        background-repeat: no-repeat !important;
        background-position: right 6px center !important;
        background-size: 12px 12px !important;
        padding-right: 23px !important;
      }
      .fwo-font-caret,
      .fwo-style-caret {
        box-sizing: border-box;
        width: 6px !important;
        height: 6px !important;
        margin: -3px 2px 0 3px !important;
        border-right: 1.4px solid #5f6368 !important;
        border-bottom: 1.4px solid #5f6368 !important;
        color: transparent !important;
        font-size: 0 !important;
        line-height: 0 !important;
        transform: rotate(45deg);
        flex: 0 0 6px !important;
      }

      .docs-toolbar-mode-group .docs-toolbar-combo[data-fwo-single-trigger='true'] {
        min-width: 92px;
        padding-right: 19px;
      }
      .docs-toolbar-mode-group .docs-toolbar-button {
        gap: 5px;
      }
      .fwo-editing-mode-text {
        color: #3c4043;
        font: 500 12px/1 Arial, Helvetica, sans-serif;
        white-space: nowrap;
      }

      .docs-color-tool {
        --fwo-selected-color: #202124;
        position: relative;
        width: 31px !important;
        height: 30px !important;
        border-radius: 8px !important;
        display: grid !important;
        place-items: center !important;
        cursor: pointer;
        transition: background-color .12s ease;
      }
      .docs-color-tool:hover { background: #e2e7ec !important; }
      .docs-color-tool .material-symbols-rounded,
      .docs-color-tool .material-symbols-outlined,
      .docs-color-tool .material-icons {
        position: relative;
        z-index: 1;
        font-size: 20px !important;
      }
      .docs-color-tool:not(.highlight) .material-symbols-rounded,
      .docs-color-tool:not(.highlight) .material-symbols-outlined,
      .docs-color-tool:not(.highlight) .material-icons {
        color: var(--fwo-selected-color) !important;
      }
      .docs-color-tool.highlight .material-symbols-rounded,
      .docs-color-tool.highlight .material-symbols-outlined,
      .docs-color-tool.highlight .material-icons {
        color: #3c4043 !important;
      }
      .docs-color-tool::after {
        content: '';
        position: absolute;
        left: 7px;
        right: 7px;
        bottom: 3px;
        height: 3px;
        border: 1px solid rgba(60,64,67,.22);
        border-radius: 3px;
        background: var(--fwo-selected-color);
        box-sizing: border-box;
      }
      .docs-color-tool input[type='color'] {
        position: absolute !important;
        inset: 0 !important;
        z-index: 3;
        width: 100% !important;
        height: 100% !important;
        opacity: 0 !important;
        cursor: pointer !important;
      }

      .fwo-outline {
        padding: 20px 14px 18px !important;
        background: #f8fafc !important;
        border-right: 1px solid #e5eaf0 !important;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }
      .fwo-outline-label {
        margin: 0 8px 13px !important;
        color: #1f2937 !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        letter-spacing: .01em;
      }
      .fwo-outline-tree {
        margin: 0 !important;
        padding: 0 0 10px !important;
      }
      .fwo-outline-item {
        min-height: 35px !important;
        margin: 2px 0 !important;
        padding-top: 7px !important;
        padding-right: 9px !important;
        padding-bottom: 7px !important;
        border-radius: 8px !important;
        color: #475569 !important;
        font-size: 13px !important;
        line-height: 1.35 !important;
        transition: background-color .12s ease, color .12s ease !important;
      }
      .fwo-outline-item:hover {
        background: #eef4fb !important;
        color: #174ea6 !important;
      }
      .fwo-outline-item.is-active {
        background: #e8f0fe !important;
        color: #0b57d0 !important;
        font-weight: 600 !important;
      }
      .fwo-outline-item.is-active::before {
        left: 1px !important;
        top: 8px !important;
        bottom: 8px !important;
        width: 3px !important;
        border-radius: 3px !important;
      }
      .fwo-outline-empty {
        margin: 4px 8px !important;
        padding: 10px 0 !important;
        color: #64748b !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
      }
    `}</style>
  );
}
