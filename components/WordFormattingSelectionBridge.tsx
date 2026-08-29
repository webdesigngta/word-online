'use client';

import { useEffect, useRef } from 'react';

type TrackedInput = HTMLInputElement & {
  _valueTracker?: { setValue: (value: string) => void };
};

const SIZE_OPTIONS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96];
const FORMAT_LABELS = new Set([
  'Bold',
  'Italic',
  'Underline',
  'Clear formatting',
  'Paint format',
  'Text color',
  'Highlight color',
  'Font family',
  'Paragraph style',
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

function elementAtRangeStart(editor: HTMLElement, range: Range) {
  let node: Node | null = range.startContainer;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const child = element.childNodes[Math.min(range.startOffset, Math.max(0, element.childNodes.length - 1))];
    if (child) node = child;
  }
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  if (!(node instanceof HTMLElement)) return editor;
  return editor.contains(node) ? node : editor;
}

function rgbToHex(value: string) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return null;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  const match = value.match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i);
  if (!match) return null;
  return `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
}

function inheritedHighlight(element: HTMLElement, editor: HTMLElement) {
  let current: HTMLElement | null = element;
  while (current && current !== editor) {
    const color = rgbToHex(getComputedStyle(current).backgroundColor);
    if (color && color !== '#ffffff') return color;
    current = current.parentElement;
  }
  return '#ffffff';
}

function fontSizePoints(element: HTMLElement) {
  const px = Number.parseFloat(getComputedStyle(element).fontSize);
  if (!Number.isFinite(px) || px <= 0) return 11;
  return Math.round((px * 72 / 96) * 2) / 2;
}

function displaySize(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function setReactInputValue(input: HTMLInputElement, value: string) {
  if (input.value === value) return;
  const previous = input.value;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  (input as TrackedInput)._valueTracker?.setValue(previous);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function controlLabel(target: HTMLElement | null) {
  const control = target?.closest<HTMLElement>('button,label,select,input');
  return (control?.getAttribute('aria-label') || control?.getAttribute('title') || '').trim();
}

function safeIntersects(range: Range, node: Node) {
  try {
    return range.intersectsNode(node);
  } catch {
    return false;
  }
}

export function WordFormattingSelectionBridge() {
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const editor = editorElement();
    const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
    const sizeControl = toolbar?.querySelector<HTMLElement>('.docs-font-size-control');
    const originalSizeInput = toolbar?.querySelector<HTMLInputElement>('input[aria-label="Font size"]');
    if (!editor || !toolbar || !sizeControl || !originalSizeInput) return;

    let sizeTrigger = sizeControl.querySelector<HTMLButtonElement>('.fwo-font-size-trigger');
    let sizeMenu = document.querySelector<HTMLElement>('.fwo-font-size-menu');
    let customSizeInput: HTMLInputElement | null = null;

    const saveSelection = () => {
      const range = rangeInside(editor);
      if (range) savedRangeRef.current = range.cloneRange();
      return range;
    };

    const restoreSelection = (focus = true) => {
      const range = savedRangeRef.current;
      if (!range) return null;
      try {
        const selection = window.getSelection();
        if (focus) editor.focus({ preventScroll: true });
        selection?.removeAllRanges();
        selection?.addRange(range.cloneRange());
        return selection?.rangeCount ? selection.getRangeAt(0) : null;
      } catch {
        return null;
      }
    };

    const setActiveButton = (label: string, active: boolean) => {
      const button = toolbar.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
      if (button) button.dataset.fwoFormatActive = active ? 'true' : 'false';
    };

    const syncState = (preferredRange?: Range | null) => {
      const range = preferredRange ?? rangeInside(editor) ?? savedRangeRef.current;
      if (!range) return;
      let element: HTMLElement;
      try {
        element = elementAtRangeStart(editor, range);
      } catch {
        return;
      }
      const style = getComputedStyle(element);
      const size = fontSizePoints(element);
      const sizeText = displaySize(size);

      setReactInputValue(originalSizeInput, sizeText);
      if (sizeTrigger) sizeTrigger.textContent = sizeText;

      const fontLabel = document.querySelector<HTMLElement>('.fwo-font-label');
      if (fontLabel) {
        const firstFont = style.fontFamily.split(',')[0]?.replace(/["']/g, '').trim();
        if (firstFont) fontLabel.textContent = firstFont;
      }

      const textInput = toolbar.querySelector<HTMLInputElement>('input[aria-label="Text color"]');
      const textTool = textInput?.closest<HTMLElement>('.docs-color-tool');
      const textColor = rgbToHex(style.color) || '#202124';
      if (textInput) textInput.value = textColor;
      if (textTool) {
        textTool.style.setProperty('--fwo-selected-color', textColor);
        textTool.dataset.fwoHasColor = 'true';
      }

      const highlightInput = toolbar.querySelector<HTMLInputElement>('input[aria-label="Highlight color"]');
      const highlightTool = highlightInput?.closest<HTMLElement>('.docs-color-tool');
      const highlight = inheritedHighlight(element, editor);
      if (highlightInput) highlightInput.value = highlight;
      if (highlightTool) {
        highlightTool.style.setProperty('--fwo-selected-color', highlight);
        highlightTool.dataset.fwoHasColor = highlight === '#ffffff' ? 'false' : 'true';
      }

      const weight = Number.parseInt(style.fontWeight, 10);
      setActiveButton('Bold', style.fontWeight === 'bold' || (Number.isFinite(weight) && weight >= 600));
      setActiveButton('Italic', style.fontStyle === 'italic');
      setActiveButton('Underline', style.textDecorationLine.includes('underline'));
    };

    const reselectAfterFormatting = () => {
      window.requestAnimationFrame(() => {
        const current = rangeInside(editor);
        if (current && !current.collapsed) savedRangeRef.current = current.cloneRange();
        else restoreSelection(true);
        const finalRange = rangeInside(editor) ?? savedRangeRef.current;
        if (finalRange) savedRangeRef.current = finalRange.cloneRange();
        syncState(finalRange);
      });
    };

    const applyExactFontSize = (requested: number) => {
      const size = Math.min(96, Math.max(6, Math.round(requested * 2) / 2));
      const restored = restoreSelection(true);
      if (!restored) return;

      try {
        document.execCommand('styleWithCSS', false, 'false');
      } catch {
        // Older engines may not expose styleWithCSS; fontSize still works.
      }
      document.execCommand('fontSize', false, '7');

      const selected = rangeInside(editor) ?? restored;
      const generated = Array.from(editor.querySelectorAll<HTMLElement>('font[size="7"]'))
        .filter((node) => safeIntersects(selected, node));
      generated.forEach((node) => {
        node.removeAttribute('size');
        node.style.fontSize = `${size}pt`;
      });

      const after = rangeInside(editor) ?? selected;
      savedRangeRef.current = after.cloneRange();
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      restoreSelection(true);
      syncState(savedRangeRef.current);
    };

    const currentSavedSize = () => {
      const range = rangeInside(editor) ?? savedRangeRef.current;
      if (!range) return Number(originalSizeInput.value) || 11;
      return fontSizePoints(elementAtRangeStart(editor, range));
    };

    if (!sizeTrigger) {
      originalSizeInput.style.display = 'none';
      originalSizeInput.tabIndex = -1;

      sizeTrigger = document.createElement('button');
      sizeTrigger.type = 'button';
      sizeTrigger.className = 'fwo-font-size-trigger';
      sizeTrigger.setAttribute('aria-label', 'Font size menu');
      sizeTrigger.setAttribute('aria-haspopup', 'menu');
      sizeTrigger.setAttribute('aria-expanded', 'false');
      sizeTrigger.textContent = originalSizeInput.value || '11';

      const plusButton = sizeControl.querySelector<HTMLButtonElement>('button[aria-label="Increase font size"]');
      sizeControl.insertBefore(sizeTrigger, plusButton || null);

      sizeMenu = document.createElement('div');
      sizeMenu.className = 'fwo-font-size-menu';
      sizeMenu.setAttribute('role', 'menu');
      sizeMenu.setAttribute('aria-label', 'Font size');
      sizeMenu.hidden = true;

      const customRow = document.createElement('div');
      customRow.className = 'fwo-font-size-custom';
      customSizeInput = document.createElement('input');
      customSizeInput.type = 'number';
      customSizeInput.min = '6';
      customSizeInput.max = '96';
      customSizeInput.step = '0.5';
      customSizeInput.inputMode = 'decimal';
      customSizeInput.setAttribute('aria-label', 'Custom font size');
      const customApply = document.createElement('button');
      customApply.type = 'button';
      customApply.textContent = 'Apply';
      customRow.append(customSizeInput, customApply);
      sizeMenu.appendChild(customRow);

      const options = document.createElement('div');
      options.className = 'fwo-font-size-options';
      SIZE_OPTIONS.forEach((value) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'menuitem');
        button.dataset.size = String(value);
        button.textContent = String(value);
        button.addEventListener('mousedown', (event) => event.preventDefault());
        button.addEventListener('click', () => {
          applyExactFontSize(value);
          if (sizeMenu) sizeMenu.hidden = true;
          sizeTrigger?.setAttribute('aria-expanded', 'false');
        });
        options.appendChild(button);
      });
      sizeMenu.appendChild(options);
      document.body.appendChild(sizeMenu);

      const positionSizeMenu = () => {
        if (!sizeTrigger || !sizeMenu || sizeMenu.hidden) return;
        const rect = sizeTrigger.getBoundingClientRect();
        const width = 154;
        const left = Math.max(8, Math.min(rect.left - 18, window.innerWidth - width - 8));
        const top = Math.min(window.innerHeight - 250, rect.bottom + 6);
        sizeMenu.style.left = `${left}px`;
        sizeMenu.style.top = `${Math.max(8, top)}px`;
      };

      sizeTrigger.addEventListener('mousedown', (event) => {
        event.preventDefault();
        saveSelection();
      });
      sizeTrigger.addEventListener('click', () => {
        if (!sizeMenu) return;
        const opening = sizeMenu.hidden;
        sizeMenu.hidden = !opening;
        sizeTrigger?.setAttribute('aria-expanded', opening ? 'true' : 'false');
        if (opening) {
          if (customSizeInput) customSizeInput.value = displaySize(currentSavedSize());
          positionSizeMenu();
        }
      });

      const applyCustom = () => {
        const value = Number(customSizeInput?.value);
        if (!Number.isFinite(value)) return;
        applyExactFontSize(value);
        if (sizeMenu) sizeMenu.hidden = true;
        sizeTrigger?.setAttribute('aria-expanded', 'false');
      };
      customApply.addEventListener('click', applyCustom);
      customSizeInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          applyCustom();
        } else if (event.key === 'Escape') {
          sizeMenu!.hidden = true;
          sizeTrigger?.setAttribute('aria-expanded', 'false');
          restoreSelection(true);
        }
      });

      const closeSizeMenu = (event: MouseEvent) => {
        if (!sizeMenu || sizeMenu.hidden) return;
        const target = event.target as Node;
        if (sizeMenu.contains(target) || sizeTrigger?.contains(target)) return;
        sizeMenu.hidden = true;
        sizeTrigger?.setAttribute('aria-expanded', 'false');
      };
      const reposition = () => positionSizeMenu();
      document.addEventListener('mousedown', closeSizeMenu);
      window.addEventListener('resize', reposition);
      window.addEventListener('scroll', reposition, true);

      sizeMenu.dataset.fwoCleanup = 'managed';
      (sizeMenu as HTMLElement & { __fwoCleanup?: () => void }).__fwoCleanup = () => {
        document.removeEventListener('mousedown', closeSizeMenu);
        window.removeEventListener('resize', reposition);
        window.removeEventListener('scroll', reposition, true);
      };
    }

    const onSelectionChange = () => {
      const range = saveSelection();
      if (range) syncState(range);
    };

    const onToolbarPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !toolbar.contains(target)) return;
      saveSelection();
    };

    const onToolbarClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !toolbar.contains(target)) return;
      const label = controlLabel(target);
      if (label === 'Decrease font size' || label === 'Increase font size') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        saveSelection();
        const delta = label === 'Increase font size' ? 1 : -1;
        applyExactFontSize(currentSavedSize() + delta);
      }
    };

    const onFormattingClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const label = controlLabel(target);
      const isToolbarFormat = toolbar.contains(target) && FORMAT_LABELS.has(label);
      const isFontItem = Boolean(target.closest('.fwo-font-item'));
      const isStyleItem = Boolean(target.closest('.fwo-style-item'));
      const isLocalFormattingOption = Boolean(target.closest('.fwo-local-popover'));
      if (isToolbarFormat || isFontItem || isStyleItem || isLocalFormattingOption) reselectAfterFormatting();
    };

    const onFormattingChange = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const label = controlLabel(target);
      if (label === 'Text color' || label === 'Highlight color' || label === 'Font family' || label === 'Paragraph style') {
        reselectAfterFormatting();
      }
    };

    const onEditorInput = () => {
      window.requestAnimationFrame(() => syncState(rangeInside(editor) ?? savedRangeRef.current));
    };

    document.addEventListener('selectionchange', onSelectionChange);
    toolbar.addEventListener('pointerdown', onToolbarPointerDown, true);
    toolbar.addEventListener('click', onToolbarClickCapture, true);
    document.addEventListener('click', onFormattingClick);
    document.addEventListener('change', onFormattingChange);
    editor.addEventListener('input', onEditorInput);

    saveSelection();
    syncState(rangeInside(editor));

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      toolbar.removeEventListener('pointerdown', onToolbarPointerDown, true);
      toolbar.removeEventListener('click', onToolbarClickCapture, true);
      document.removeEventListener('click', onFormattingClick);
      document.removeEventListener('change', onFormattingChange);
      editor.removeEventListener('input', onEditorInput);
      originalSizeInput.style.display = '';
      originalSizeInput.tabIndex = 0;
      sizeTrigger?.remove();
      if (sizeMenu) {
        (sizeMenu as HTMLElement & { __fwoCleanup?: () => void }).__fwoCleanup?.();
        sizeMenu.remove();
      }
    };
  }, []);

  return (
    <style jsx global>{`
      .fwo-font-size-trigger {
        box-sizing: border-box;
        width: 38px;
        height: 26px;
        margin: 0 1px;
        padding: 0 3px;
        border: 1px solid #747775;
        border-radius: 5px;
        background: #fff;
        color: #202124;
        font: 500 13px/24px Arial, Helvetica, sans-serif;
        text-align: center;
        cursor: pointer;
      }
      .fwo-font-size-trigger:hover,
      .fwo-font-size-trigger[aria-expanded='true'] {
        border-color: #0b57d0;
        background: #f8fbff;
      }
      .fwo-font-size-menu {
        position: fixed;
        z-index: 9000;
        width: 154px;
        box-sizing: border-box;
        padding: 7px;
        border: 1px solid #d9dee5;
        border-radius: 11px;
        background: #fff;
        box-shadow: 0 10px 28px rgba(60,64,67,.22), 0 2px 7px rgba(60,64,67,.10);
        font-family: Arial, Helvetica, sans-serif;
      }
      .fwo-font-size-menu[hidden] { display: none !important; }
      .fwo-font-size-custom {
        display: grid;
        grid-template-columns: minmax(0,1fr) auto;
        gap: 5px;
        padding: 1px 1px 7px;
        border-bottom: 1px solid #edf0f2;
      }
      .fwo-font-size-custom input {
        min-width: 0;
        height: 30px;
        box-sizing: border-box;
        border: 1px solid #c9cdd2;
        border-radius: 7px;
        padding: 0 7px;
        outline: 0;
        font: 400 13px Arial, Helvetica, sans-serif;
      }
      .fwo-font-size-custom input:focus { border-color: #0b57d0; box-shadow: 0 0 0 2px rgba(11,87,208,.11); }
      .fwo-font-size-custom button {
        height: 30px;
        border: 0;
        border-radius: 7px;
        background: #e8f0fe;
        color: #174ea6;
        padding: 0 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
      }
      .fwo-font-size-options {
        max-height: 250px;
        overflow: auto;
        padding-top: 5px;
      }
      .fwo-font-size-options button {
        width: 100%;
        min-height: 30px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #202124;
        text-align: left;
        padding: 4px 10px;
        font-size: 13px;
        cursor: pointer;
      }
      .fwo-font-size-options button:hover { background: #f1f3f4; }

      .docs-toolbar button[data-fwo-format-active='true'] {
        background: #d3e3fd !important;
        color: #0b57d0 !important;
      }

      .docs-color-tool {
        overflow: visible !important;
      }
      .docs-color-tool .material-symbols-rounded {
        color: var(--fwo-selected-color, #202124) !important;
        transition: color .12s ease !important;
      }
      .docs-color-tool[data-fwo-has-color='false'] .material-symbols-rounded {
        color: #3c4043 !important;
      }
      .docs-color-tool::after {
        left: 5px !important;
        right: 5px !important;
        bottom: 2px !important;
        height: 4px !important;
        border: 1px solid rgba(60,64,67,.38) !important;
        border-radius: 4px !important;
        background: var(--fwo-selected-color, #202124) !important;
        box-shadow: 0 0 0 1px rgba(255,255,255,.65) inset;
      }

      .docs-toolbar-right-spacer { display: none !important; }
      .docs-toolbar-mode-group {
        min-width: 108px !important;
        width: 108px !important;
        flex: 0 0 108px !important;
      }
      .docs-toolbar-mode-group .docs-toolbar-combo[data-fwo-single-trigger='true'] {
        box-sizing: border-box !important;
        width: 104px !important;
        min-width: 104px !important;
        height: 30px !important;
        padding-right: 18px !important;
      }
      .docs-toolbar-mode-group .docs-toolbar-button[aria-label='Editing mode'] {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 5px !important;
        width: 86px !important;
        min-width: 86px !important;
        height: 30px !important;
        padding: 0 2px 0 7px !important;
        white-space: nowrap !important;
      }
      .docs-toolbar-mode-group .docs-toolbar-button[aria-label='Editing mode'] .material-symbols-rounded {
        flex: 0 0 18px;
      }
      .fwo-editing-mode-text {
        display: inline-block !important;
        min-width: 0 !important;
        overflow: visible !important;
        color: #3c4043 !important;
        font: 500 12px/30px Arial, Helvetica, sans-serif !important;
        white-space: nowrap !important;
      }

      @media (max-width: 720px) {
        .docs-toolbar-mode-group {
          min-width: 96px !important;
          width: 96px !important;
          flex-basis: 96px !important;
        }
        .docs-toolbar-mode-group .docs-toolbar-combo[data-fwo-single-trigger='true'] {
          width: 92px !important;
          min-width: 92px !important;
        }
        .docs-toolbar-mode-group .docs-toolbar-button[aria-label='Editing mode'] {
          width: 75px !important;
          min-width: 75px !important;
        }
        .fwo-editing-mode-text { font-size: 11px !important; }
      }
    `}</style>
  );
}
