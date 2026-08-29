'use client';

import { useEffect, useRef } from 'react';

type SelectionBookmark = {
  start: number;
  end: number;
};

type CleanupNode = HTMLElement & { __fwoCleanup?: () => void };

type TrackedInput = HTMLInputElement & {
  _valueTracker?: { setValue: (value: string) => void };
};

const SIZE_OPTIONS = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96];

const OWNED_BUTTON_COMMANDS: Record<string, string> = {
  Bold: 'bold',
  Italic: 'italic',
  Underline: 'underline',
  'Clear formatting': 'removeFormat',
};

const GENERIC_FORMAT_LABELS = new Set([
  'Align left',
  'Alignment options',
  'Line spacing',
  'Checklist',
  'Checklist options',
  'Bulleted list',
  'Numbered list',
  'Decrease indent',
  'Increase indent',
  'Paragraph style',
]);

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function controlLabel(target: HTMLElement | null) {
  const control = target?.closest<HTMLElement>('button,label,select,input');
  return (control?.getAttribute('aria-label') || control?.getAttribute('title') || '').trim();
}

function textLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return (node as Text).data.length;
  let total = 0;
  node.childNodes.forEach((child) => { total += textLength(child); });
  return total;
}

function absoluteTextOffset(root: HTMLElement, container: Node, offset: number) {
  let total = 0;
  let found: number | null = null;

  const visit = (node: Node) => {
    if (found !== null) return;
    if (node === container) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node as Text;
        found = total + Math.max(0, Math.min(text.data.length, offset));
        return;
      }
      const limit = Math.max(0, Math.min(node.childNodes.length, offset));
      let local = 0;
      for (let index = 0; index < limit; index += 1) local += textLength(node.childNodes[index]);
      found = total + local;
      return;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      total += (node as Text).data.length;
      return;
    }
    node.childNodes.forEach(visit);
  };

  visit(root);
  return found;
}

function rangeInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  try {
    return editor.contains(range.commonAncestorContainer) || range.commonAncestorContainer === editor ? range : null;
  } catch {
    return null;
  }
}

function bookmarkSelection(editor: HTMLElement): SelectionBookmark | null {
  const range = rangeInside(editor);
  if (!range || range.collapsed) return null;
  const start = absoluteTextOffset(editor, range.startContainer, range.startOffset);
  const end = absoluteTextOffset(editor, range.endContainer, range.endOffset);
  if (start === null || end === null || end <= start) return null;
  return { start, end };
}

function boundaryAtOffset(editor: HTMLElement, target: number) {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let node: Node | null = walker.nextNode();
  let last: Text | null = null;

  while (node) {
    const text = node as Text;
    last = text;
    const next = consumed + text.data.length;
    if (target <= next) return { node: text, offset: Math.max(0, Math.min(text.data.length, target - consumed)) };
    consumed = next;
    node = walker.nextNode();
  }

  return last ? { node: last, offset: last.data.length } : null;
}

function restoreBookmark(editor: HTMLElement, bookmark: SelectionBookmark | null, focus = true) {
  if (!bookmark) return false;
  const start = boundaryAtOffset(editor, bookmark.start);
  const end = boundaryAtOffset(editor, bookmark.end);
  if (!start || !end) return false;

  try {
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    const selection = window.getSelection();
    if (focus) editor.focus({ preventScroll: true });
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  } catch {
    return false;
  }
}

function selectAllEditor(editor: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(editor);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  editor.focus({ preventScroll: true });
}

function selectionElement(editor: HTMLElement, bookmark: SelectionBookmark | null) {
  if (bookmark) restoreBookmark(editor, bookmark, false);
  const range = rangeInside(editor);
  if (!range) return editor;
  let node: Node | null = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  return node instanceof HTMLElement && editor.contains(node) ? node : editor;
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

function pointSize(element: HTMLElement) {
  const px = Number.parseFloat(getComputedStyle(element).fontSize);
  if (!Number.isFinite(px) || px <= 0) return 11;
  return Math.round((px * 72 / 96) * 2) / 2;
}

function sizeText(value: number) {
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

function safeIntersects(range: Range, node: Node) {
  try {
    return range.intersectsNode(node);
  } catch {
    return false;
  }
}

export function WordFormattingSelectionBridge() {
  const bookmarkRef = useRef<SelectionBookmark | null>(null);
  const restoringRef = useRef(false);

  useEffect(() => {
    const editor = editorElement();
    const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
    const sizeControl = toolbar?.querySelector<HTMLElement>('.docs-font-size-control');
    const originalSizeInput = toolbar?.querySelector<HTMLInputElement>('input[aria-label="Font size"]');
    if (!editor || !toolbar || !sizeControl || !originalSizeInput) return;

    let sizeTrigger = sizeControl.querySelector<HTMLButtonElement>('.fwo-font-size-trigger');
    let sizeMenu = document.querySelector<CleanupNode>('.fwo-font-size-menu');
    let customSizeInput: HTMLInputElement | null = null;

    const remember = () => {
      if (restoringRef.current) return bookmarkRef.current;
      const bookmark = bookmarkSelection(editor);
      if (bookmark) bookmarkRef.current = bookmark;
      return bookmarkRef.current;
    };

    const restore = (focus = true) => {
      restoringRef.current = true;
      const ok = restoreBookmark(editor, bookmarkRef.current, focus);
      restoringRef.current = false;
      return ok;
    };

    const notifyInput = () => editor.dispatchEvent(new Event('input', { bubbles: true }));

    const syncState = () => {
      const bookmark = bookmarkRef.current;
      if (!bookmark) return;
      const element = selectionElement(editor, bookmark);
      const style = getComputedStyle(element);
      const size = pointSize(element);
      const display = sizeText(size);

      setReactInputValue(originalSizeInput, display);
      if (sizeTrigger) sizeTrigger.textContent = display;

      const fontLabel = document.querySelector<HTMLElement>('.fwo-font-label');
      const firstFont = style.fontFamily.split(',')[0]?.replace(/["']/g, '').trim();
      if (fontLabel && firstFont) fontLabel.textContent = firstFont;
      const fontSelect = toolbar.querySelector<HTMLSelectElement>('select[aria-label="Font family"]');
      if (fontSelect && firstFont && Array.from(fontSelect.options).some((option) => option.value === firstFont)) fontSelect.value = firstFont;

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
      const highlightColor = inheritedHighlight(element, editor);
      if (highlightInput) highlightInput.value = highlightColor;
      if (highlightTool) {
        highlightTool.style.setProperty('--fwo-selected-color', highlightColor);
        highlightTool.dataset.fwoHasColor = highlightColor === '#ffffff' ? 'false' : 'true';
      }

      const setActive = (label: string, active: boolean) => {
        const button = toolbar.querySelector<HTMLElement>(`button[aria-label="${label}"]`);
        if (button) button.dataset.fwoFormatActive = active ? 'true' : 'false';
      };
      const weight = Number.parseInt(style.fontWeight, 10);
      setActive('Bold', style.fontWeight === 'bold' || (Number.isFinite(weight) && weight >= 600));
      setActive('Italic', style.fontStyle === 'italic');
      setActive('Underline', style.textDecorationLine.includes('underline'));
    };

    const keepSelected = () => {
      restore(true);
      window.requestAnimationFrame(() => {
        restore(true);
        syncState();
      });
    };

    const runCommand = (command: string, value?: string) => {
      if (!bookmarkRef.current) remember();
      if (!bookmarkRef.current || !restore(true)) return;
      document.execCommand(command, false, value);
      notifyInput();
      keepSelected();
    };

    const applyFontSize = (requested: number) => {
      const size = Math.min(96, Math.max(6, Math.round(requested * 2) / 2));
      if (!bookmarkRef.current) remember();
      if (!bookmarkRef.current || !restore(true)) return;

      document.execCommand('fontSize', false, '7');
      const selected = rangeInside(editor);
      if (selected) {
        Array.from(editor.querySelectorAll<HTMLElement>('font[size="7"]')).forEach((node) => {
          if (!safeIntersects(selected, node)) return;
          node.removeAttribute('size');
          node.style.fontSize = `${size}pt`;
        });
      }
      setReactInputValue(originalSizeInput, sizeText(size));
      if (sizeTrigger) sizeTrigger.textContent = sizeText(size);
      notifyInput();
      keepSelected();
    };

    const currentSize = () => pointSize(selectionElement(editor, bookmarkRef.current));

    const applyFont = (font: string) => {
      runCommand('fontName', font);
      const label = document.querySelector<HTMLElement>('.fwo-font-label');
      if (label) label.textContent = font;
      const select = toolbar.querySelector<HTMLSelectElement>('select[aria-label="Font family"]');
      if (select && Array.from(select.options).some((option) => option.value === font)) select.value = font;
    };

    const applyColor = (kind: 'text' | 'highlight', color: string) => {
      if (kind === 'text') runCommand('foreColor', color);
      else {
        if (!bookmarkRef.current) remember();
        if (!bookmarkRef.current || !restore(true)) return;
        const applied = document.execCommand('hiliteColor', false, color);
        if (!applied) document.execCommand('backColor', false, color);
        notifyInput();
        keepSelected();
      }
      const input = toolbar.querySelector<HTMLInputElement>(`input[aria-label="${kind === 'text' ? 'Text color' : 'Highlight color'}"]`);
      const tool = input?.closest<HTMLElement>('.docs-color-tool');
      if (tool) {
        tool.style.setProperty('--fwo-selected-color', color);
        tool.dataset.fwoHasColor = color.toLowerCase() === '#ffffff' ? 'false' : 'true';
      }
    };

    originalSizeInput.style.display = 'none';
    originalSizeInput.tabIndex = -1;

    if (!sizeTrigger) {
      sizeTrigger = document.createElement('button');
      sizeTrigger.type = 'button';
      sizeTrigger.className = 'fwo-font-size-trigger';
      sizeTrigger.setAttribute('aria-label', 'Font size menu');
      sizeTrigger.setAttribute('aria-haspopup', 'menu');
      sizeTrigger.setAttribute('aria-expanded', 'false');
      sizeTrigger.textContent = originalSizeInput.value || '11';
      const plus = sizeControl.querySelector<HTMLButtonElement>('button[aria-label="Increase font size"]');
      sizeControl.insertBefore(sizeTrigger, plus || null);
    }

    if (!sizeMenu) {
      sizeMenu = document.createElement('div') as CleanupNode;
      sizeMenu.className = 'fwo-font-size-menu';
      sizeMenu.setAttribute('role', 'menu');
      sizeMenu.setAttribute('aria-label', 'Font size');
      sizeMenu.hidden = true;

      const custom = document.createElement('div');
      custom.className = 'fwo-font-size-custom';
      customSizeInput = document.createElement('input');
      customSizeInput.type = 'number';
      customSizeInput.min = '6';
      customSizeInput.max = '96';
      customSizeInput.step = '0.5';
      customSizeInput.inputMode = 'decimal';
      customSizeInput.setAttribute('aria-label', 'Custom font size');
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.textContent = 'Apply';
      custom.append(customSizeInput, apply);
      sizeMenu.appendChild(custom);

      const options = document.createElement('div');
      options.className = 'fwo-font-size-options';
      SIZE_OPTIONS.forEach((value) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'menuitem');
        button.textContent = String(value);
        button.dataset.size = String(value);
        options.appendChild(button);
      });
      sizeMenu.appendChild(options);
      document.body.appendChild(sizeMenu);

      const applyCustom = () => {
        const value = Number(customSizeInput?.value);
        if (!Number.isFinite(value)) return;
        applyFontSize(value);
        if (sizeMenu) sizeMenu.hidden = true;
        sizeTrigger?.setAttribute('aria-expanded', 'false');
      };
      apply.addEventListener('click', applyCustom);
      customSizeInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          applyCustom();
        }
      });
    } else {
      customSizeInput = sizeMenu.querySelector<HTMLInputElement>('input[aria-label="Custom font size"]');
    }

    const positionSizeMenu = () => {
      if (!sizeMenu || !sizeTrigger || sizeMenu.hidden) return;
      const rect = sizeTrigger.getBoundingClientRect();
      const width = 154;
      sizeMenu.style.left = `${Math.max(8, Math.min(rect.left - 18, window.innerWidth - width - 8))}px`;
      sizeMenu.style.top = `${Math.max(8, Math.min(window.innerHeight - 250, rect.bottom + 6))}px`;
    };

    const toggleSizeMenu = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      remember();
      if (!sizeMenu || !sizeTrigger) return;
      const opening = sizeMenu.hidden;
      sizeMenu.hidden = !opening;
      sizeTrigger.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) {
        if (customSizeInput) customSizeInput.value = sizeText(currentSize());
        positionSizeMenu();
      } else keepSelected();
    };
    sizeTrigger.addEventListener('click', toggleSizeMenu);

    const onSelectionChange = () => {
      if (restoringRef.current) return;
      const bookmark = bookmarkSelection(editor);
      if (!bookmark) return;
      bookmarkRef.current = bookmark;
      syncState();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const active = document.activeElement as HTMLElement | null;
      const activeInEditor = Boolean(active && (active === editor || editor.contains(active)));
      const selectionInEditor = Boolean(rangeInside(editor));

      if (key === 'a' && (activeInEditor || selectionInEditor)) {
        event.preventDefault();
        event.stopPropagation();
        selectAllEditor(editor);
        bookmarkRef.current = bookmarkSelection(editor);
        syncState();
        return;
      }

      if (!activeInEditor && !selectionInEditor) return;
      const command = key === 'b' ? 'bold' : key === 'i' ? 'italic' : key === 'u' ? 'underline' : null;
      if (!command) return;
      event.preventDefault();
      event.stopPropagation();
      remember();
      runCommand(command);
    };

    const onPointerDownCapture = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (toolbar.contains(target) || target.closest('.fwo-font-menu,.fwo-font-size-menu,.fwo-style-menu,.fwo-local-popover')) remember();
    };

    const onClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const fontItem = target.closest<HTMLButtonElement>('.fwo-font-item');
      if (fontItem) {
        const font = fontItem.querySelector<HTMLElement>('.fwo-font-name')?.textContent?.trim() || '';
        if (!font) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        applyFont(font);
        const menu = fontItem.closest<HTMLElement>('.fwo-font-menu');
        if (menu) menu.hidden = true;
        document.querySelector<HTMLButtonElement>('.fwo-font-trigger')?.setAttribute('aria-expanded', 'false');
        return;
      }

      const sizeOption = target.closest<HTMLButtonElement>('.fwo-font-size-options button[data-size]');
      if (sizeOption) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        applyFontSize(Number(sizeOption.dataset.size));
        if (sizeMenu) sizeMenu.hidden = true;
        sizeTrigger?.setAttribute('aria-expanded', 'false');
        return;
      }

      const button = target.closest<HTMLButtonElement>('button');
      const label = controlLabel(target);
      if (button && toolbar.contains(button) && OWNED_BUTTON_COMMANDS[label]) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        remember();
        runCommand(OWNED_BUTTON_COMMANDS[label]);
        return;
      }

      if (button && toolbar.contains(button) && (label === 'Decrease font size' || label === 'Increase font size')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        remember();
        applyFontSize(currentSize() + (label === 'Increase font size' ? 1 : -1));
        return;
      }

      if (GENERIC_FORMAT_LABELS.has(label) || target.closest('.fwo-style-item,.fwo-local-popover')) {
        window.setTimeout(keepSelected, 0);
      }
    };

    const onColorEventCapture = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (!(target instanceof HTMLInputElement) || target.type !== 'color') return;
      const label = target.getAttribute('aria-label');
      if (label !== 'Text color' && label !== 'Highlight color') return;
      event.stopPropagation();
      event.stopImmediatePropagation();
      remember();
      applyColor(label === 'Text color' ? 'text' : 'highlight', target.value);
    };

    const closeSizeMenu = (event: MouseEvent) => {
      if (!sizeMenu || sizeMenu.hidden) return;
      const target = event.target as Node;
      if (sizeMenu.contains(target) || sizeTrigger?.contains(target)) return;
      sizeMenu.hidden = true;
      sizeTrigger?.setAttribute('aria-expanded', 'false');
      keepSelected();
    };

    const onFontSelectChangeCapture = (event: Event) => {
      const target = event.target as HTMLSelectElement | null;
      if (!(target instanceof HTMLSelectElement) || target.getAttribute('aria-label') !== 'Font family') return;
      event.stopPropagation();
      event.stopImmediatePropagation();
      remember();
      applyFont(target.value);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDownCapture, true);
    document.addEventListener('click', onClickCapture, true);
    document.addEventListener('input', onColorEventCapture, true);
    document.addEventListener('change', onColorEventCapture, true);
    document.addEventListener('change', onFontSelectChangeCapture, true);
    document.addEventListener('mousedown', closeSizeMenu);
    window.addEventListener('resize', positionSizeMenu);
    window.addEventListener('scroll', positionSizeMenu, true);

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDownCapture, true);
      document.removeEventListener('click', onClickCapture, true);
      document.removeEventListener('input', onColorEventCapture, true);
      document.removeEventListener('change', onColorEventCapture, true);
      document.removeEventListener('change', onFontSelectChangeCapture, true);
      document.removeEventListener('mousedown', closeSizeMenu);
      window.removeEventListener('resize', positionSizeMenu);
      window.removeEventListener('scroll', positionSizeMenu, true);
      sizeTrigger?.removeEventListener('click', toggleSizeMenu);
      sizeMenu?.__fwoCleanup?.();
      sizeMenu?.remove();
      sizeTrigger?.remove();
      originalSizeInput.style.display = '';
      originalSizeInput.tabIndex = 0;
    };
  }, []);

  return (
    <style jsx global>{`
      .fwo-font-size-trigger {
        width: 42px;
        height: 28px;
        padding: 0 5px;
        border: 1px solid #9aa0a6;
        border-radius: 4px;
        background: #fff;
        color: #202124;
        font: 500 13px/1 Arial,Helvetica,sans-serif;
        text-align:center;
        cursor:pointer;
      }
      .fwo-font-size-trigger:hover,.fwo-font-size-trigger[aria-expanded='true'] { background:#f1f3f4; border-color:#5f6368; }
      .fwo-font-size-menu {
        position:fixed;
        z-index:9000;
        width:154px;
        max-height:360px;
        overflow:auto;
        box-sizing:border-box;
        padding:6px;
        border:1px solid #dadce0;
        border-radius:10px;
        background:#fff;
        box-shadow:0 8px 24px rgba(60,64,67,.24),0 2px 6px rgba(60,64,67,.12);
        font-family:Arial,Helvetica,sans-serif;
      }
      .fwo-font-size-menu[hidden] { display:none!important; }
      .fwo-font-size-custom { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:5px; padding:3px 2px 7px; border-bottom:1px solid #edf0f2; margin-bottom:4px; }
      .fwo-font-size-custom input { min-width:0; height:30px; box-sizing:border-box; border:1px solid #c9cdd2; border-radius:6px; padding:0 7px; font-size:13px; }
      .fwo-font-size-custom button { height:30px; border:0; border-radius:6px; padding:0 8px; background:#e8f0fe; color:#0b57d0; font-size:12px; cursor:pointer; }
      .fwo-font-size-options { display:grid; }
      .fwo-font-size-options button { min-height:32px; border:0; border-radius:6px; background:transparent; color:#202124; text-align:left; padding:5px 9px; font-size:13px; cursor:pointer; }
      .fwo-font-size-options button:hover { background:#f1f3f4; }

      .docs-toolbar button[data-fwo-format-active='true'] { background:#d3e3fd!important; color:#041e49!important; }

      .docs-color-tool {
        --fwo-selected-color:#202124;
        position:relative!important;
        width:34px!important;
        height:30px!important;
        display:grid!important;
        place-items:center!important;
        border-radius:7px!important;
        overflow:hidden;
      }
      .docs-color-tool:hover { background:#e8eaed!important; }
      .docs-color-tool .material-symbols-rounded,
      .docs-color-tool .material-symbols-outlined,
      .docs-color-tool .material-icons {
        position:relative;
        z-index:1;
        font-size:20px!important;
        color:var(--fwo-selected-color)!important;
      }
      .docs-color-tool::before {
        content:'';
        position:absolute;
        left:7px;
        right:7px;
        bottom:2px;
        height:4px;
        border-radius:4px;
        background:var(--fwo-selected-color);
        box-shadow:0 0 0 1px rgba(60,64,67,.28);
        z-index:2;
        pointer-events:none;
      }
      .docs-color-tool.highlight::after {
        content:'';
        position:absolute;
        inset:5px 6px 7px;
        border-radius:5px;
        background:var(--fwo-selected-color);
        opacity:.18;
        pointer-events:none;
      }
      .docs-color-tool input[type='color'] {
        position:absolute!important;
        inset:0!important;
        z-index:5!important;
        width:100%!important;
        height:100%!important;
        opacity:0!important;
        cursor:pointer!important;
      }
    `}</style>
  );
}
