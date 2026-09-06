'use client';

import { useEffect } from 'react';

type ColorKind = 'text' | 'highlight';
type SelectionBookmark = { start: number; end: number };
type TextTarget = { node: Text; start: number; end: number };

const DEFAULT_TEXT_COLOR = '#202124';
const DEFAULT_HIGHLIGHT_COLOR = '#fdd663';
const TEXT_COLORS = [
  '#000000', '#202124', '#3c4043', '#5f6368', '#80868b', '#9aa0a6', '#bdc1c6', '#ffffff',
  '#b31412', '#d93025', '#ea4335', '#f4511e', '#f9ab00', '#fbbc04', '#34a853', '#188038',
  '#0f9d58', '#12b5cb', '#039be5', '#1a73e8', '#1967d2', '#174ea6', '#673ab7', '#8430ce',
  '#a142f4', '#d01884', '#e52592', '#c5221f', '#795548', '#607d8b',
];
const HIGHLIGHT_COLORS = [
  '#fff475', '#fdd663', '#fbbc04', '#f6aea9', '#f28b82', '#fdcfe8', '#fba9d6', '#d7aefb',
  '#c58af9', '#aecbfa', '#8ab4f8', '#a7ffeb', '#78d9ec', '#ccff90', '#81c995', '#e6c9a8',
  '#e8eaed', '#bdc1c6',
];

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page[contenteditable="true"]');
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

function currentBookmark(editor: HTMLElement): SelectionBookmark | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
  const start = absoluteTextOffset(editor, range.startContainer, range.startOffset);
  const end = absoluteTextOffset(editor, range.endContainer, range.endOffset);
  if (start === null || end === null || end <= start) return null;
  return { start, end };
}

function boundaryAtOffset(editor: HTMLElement, target: number) {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let node = walker.nextNode();
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

function restoreBookmark(editor: HTMLElement, bookmark: SelectionBookmark | null) {
  if (!bookmark) return false;
  const start = boundaryAtOffset(editor, bookmark.start);
  const end = boundaryAtOffset(editor, bookmark.end);
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

function targetsForBookmark(editor: HTMLElement, bookmark: SelectionBookmark) {
  const targets: TextTarget[] = [];
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let node = walker.nextNode();
  while (node) {
    const text = node as Text;
    const nodeStart = consumed;
    const nodeEnd = consumed + text.data.length;
    consumed = nodeEnd;
    const overlapStart = Math.max(bookmark.start, nodeStart);
    const overlapEnd = Math.min(bookmark.end, nodeEnd);
    if (overlapEnd > overlapStart) {
      targets.push({ node: text, start: overlapStart - nodeStart, end: overlapEnd - nodeStart });
    }
    if (nodeEnd >= bookmark.end) break;
    node = walker.nextNode();
  }
  return targets;
}

function setFragmentStyle(element: HTMLElement, kind: ColorKind, color: string) {
  if (kind === 'text') {
    element.style.setProperty('color', color, 'important');
    element.dataset.fwoTextColor = color;
  } else {
    if (color === 'transparent') {
      element.style.removeProperty('background-color');
      delete element.dataset.fwoHighlightColor;
    } else {
      element.style.setProperty('background-color', color, 'important');
      element.dataset.fwoHighlightColor = color;
    }
  }
}

function applyExactColor(editor: HTMLElement, bookmark: SelectionBookmark, kind: ColorKind, color: string) {
  const targets = targetsForBookmark(editor, bookmark);
  if (!targets.length) return false;
  for (let index = targets.length - 1; index >= 0; index -= 1) {
    const target = targets[index];
    const originalLength = target.node.data.length;
    if (!target.node.parentNode || target.end <= target.start) continue;
    if (target.end < originalLength) target.node.splitText(target.end);
    const selectedNode = target.start > 0 ? target.node.splitText(target.start) : target.node;
    const parent = selectedNode.parentElement;
    if (parent?.dataset.fwoColorFragment === 'true' && parent.childNodes.length === 1 && parent.firstChild === selectedNode) {
      setFragmentStyle(parent, kind, color);
      continue;
    }
    const span = document.createElement('span');
    span.dataset.fwoColorFragment = 'true';
    setFragmentStyle(span, kind, color);
    selectedNode.parentNode?.insertBefore(span, selectedNode);
    span.appendChild(selectedNode);
  }
  return true;
}

function rgbToHex(value: string) {
  const normalized = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized;
  const match = normalized.match(/rgba?\(\s*(\d+)\s*[, ]+\s*(\d+)\s*[, ]+\s*(\d+)/i);
  if (!match) return null;
  return `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
}

function colorAtSelection(editor: HTMLElement, bookmark: SelectionBookmark, kind: ColorKind) {
  const point = boundaryAtOffset(editor, bookmark.start);
  let element = point?.node.parentElement ?? editor;
  if (kind === 'text') return rgbToHex(getComputedStyle(element).color) || DEFAULT_TEXT_COLOR;
  while (element && element !== editor) {
    const value = getComputedStyle(element).backgroundColor;
    if (value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') return rgbToHex(value) || DEFAULT_HIGHLIGHT_COLOR;
    element = element.parentElement as HTMLElement | null;
  }
  return DEFAULT_HIGHLIGHT_COLOR;
}

function positionPalette(trigger: HTMLElement, palette: HTMLElement) {
  const rect = trigger.getBoundingClientRect();
  const width = 278;
  const margin = 8;
  const left = Math.max(margin, Math.min(rect.left - 8, window.innerWidth - width - margin));
  palette.style.left = `${left}px`;
  palette.style.top = `${rect.bottom + 7}px`;
  requestAnimationFrame(() => {
    const paletteRect = palette.getBoundingClientRect();
    if (paletteRect.bottom > window.innerHeight - margin) {
      palette.style.top = `${Math.max(margin, rect.top - paletteRect.height - 7)}px`;
    }
  });
}

export function WordColorController() {
  useEffect(() => {
    const editor = editorElement();
    const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
    if (!editor || !toolbar) return;

    let bookmark: SelectionBookmark | null = null;
    let palette: HTMLDivElement | null = null;
    let activeKind: ColorKind | null = null;
    let activeTrigger: HTMLElement | null = null;
    let hintTimer = 0;
    const triggerHandlers = new Map<HTMLElement, EventListener>();

    const remember = () => {
      const next = currentBookmark(editor);
      if (next) bookmark = next;
    };

    const closePalette = () => {
      palette?.remove();
      palette = null;
      activeKind = null;
      activeTrigger = null;
      delete editor.dataset.fwoColorPreview;
    };

    const updateTriggerIndicator = (kind: ColorKind, color: string) => {
      const trigger = toolbar.querySelector<HTMLElement>(`.fwo-color-button[data-kind="${kind}"]`);
      if (!trigger) return;
      trigger.style.setProperty('--fwo-selected-color', color === 'transparent' ? '#ffffff' : color);
    };

    const apply = (kind: ColorKind, color: string) => {
      if (!bookmark || !restoreBookmark(editor, bookmark)) return;
      if (!applyExactColor(editor, bookmark, kind, color)) return;
      updateTriggerIndicator(kind, color);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      restoreBookmark(editor, bookmark);
      requestAnimationFrame(() => restoreBookmark(editor, bookmark));
    };

    const addSwatch = (container: HTMLElement, kind: ColorKind, color: string) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fwo-color-swatch';
      button.title = color;
      button.setAttribute('aria-label', `${kind === 'text' ? 'Text color' : 'Highlight color'} ${color}`);
      button.style.backgroundColor = color;
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        apply(kind, color);
      });
      container.appendChild(button);
    };

    const buildPalette = (kind: ColorKind, trigger: HTMLElement) => {
      closePalette();
      activeKind = kind;
      activeTrigger = trigger;
      editor.dataset.fwoColorPreview = 'true';

      const root = document.createElement('div');
      root.className = 'fwo-color-palette';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-label', kind === 'text' ? 'Text color' : 'Highlight color');

      const head = document.createElement('div');
      head.className = 'fwo-color-palette-head';
      const strong = document.createElement('strong');
      strong.textContent = kind === 'text' ? 'Text color' : 'Highlight color';
      const small = document.createElement('span');
      small.textContent = 'Selected text stays active while you try colors.';
      head.append(strong, small);
      root.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'fwo-color-swatches';
      const colors = kind === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS;
      colors.forEach((color) => addSwatch(grid, kind, color));
      root.appendChild(grid);

      const actions = document.createElement('div');
      actions.className = 'fwo-color-palette-actions';
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'fwo-color-reset';
      reset.textContent = kind === 'text' ? 'Default text' : 'No highlight';
      reset.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        apply(kind, kind === 'text' ? DEFAULT_TEXT_COLOR : 'transparent');
      });
      const customLabel = document.createElement('label');
      customLabel.className = 'fwo-custom-color';
      customLabel.textContent = 'Custom';
      const custom = document.createElement('input');
      custom.type = 'color';
      custom.setAttribute('aria-label', `Custom ${kind} color`);
      custom.value = colorAtSelection(editor, bookmark as SelectionBookmark, kind);
      custom.addEventListener('input', () => apply(kind, custom.value));
      customLabel.appendChild(custom);
      actions.append(reset, customLabel);
      root.appendChild(actions);

      document.body.appendChild(root);
      palette = root;
      positionPalette(trigger, root);
      requestAnimationFrame(() => restoreBookmark(editor, bookmark));
    };

    const showHint = (trigger: HTMLElement) => {
      document.querySelector('.fwo-color-hint')?.remove();
      const hint = document.createElement('div');
      hint.className = 'fwo-color-hint';
      hint.textContent = 'Select text first';
      document.body.appendChild(hint);
      const rect = trigger.getBoundingClientRect();
      hint.style.left = `${Math.max(8, rect.left - 35)}px`;
      hint.style.top = `${rect.bottom + 7}px`;
      window.clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => hint.remove(), 1800);
    };

    const open = (kind: ColorKind, trigger: HTMLElement, event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation();

      const live = currentBookmark(editor);
      if (live) bookmark = live;
      if (!bookmark || !restoreBookmark(editor, bookmark)) {
        bookmark = null;
        closePalette();
        showHint(trigger);
        return;
      }

      if (palette && activeKind === kind && activeTrigger === trigger) {
        closePalette();
        restoreBookmark(editor, bookmark);
        return;
      }
      buildPalette(kind, trigger);
    };

    const attachTriggers = () => {
      const pairs: Array<[ColorKind, HTMLElement | null]> = [
        ['text', toolbar.querySelector<HTMLElement>('label[title="Text color"]')],
        ['highlight', toolbar.querySelector<HTMLElement>('label[title="Highlight color"]')],
      ];
      for (const [kind, trigger] of pairs) {
        if (!trigger || triggerHandlers.has(trigger)) continue;
        trigger.classList.add('fwo-color-button');
        trigger.dataset.kind = kind;
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('tabindex', '0');
        const input = trigger.querySelector<HTMLInputElement>('input[type="color"]');
        if (input) {
          input.tabIndex = -1;
          input.setAttribute('aria-hidden', 'true');
        }
        const initial = kind === 'text' ? DEFAULT_TEXT_COLOR : DEFAULT_HIGHLIGHT_COLOR;
        trigger.style.setProperty('--fwo-selected-color', initial);
        const handler: EventListener = (event) => open(kind, trigger, event);
        trigger.addEventListener('pointerdown', handler, true);
        triggerHandlers.set(trigger, handler);
      }
    };

    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection?.rangeCount || selection.isCollapsed) return;
      const range = selection.getRangeAt(0);
      if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return;
      remember();
    };

    const onDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (palette?.contains(target)) return;
      if (target instanceof Element && target.closest('.fwo-color-button')) return;
      closePalette();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePalette();
        restoreBookmark(editor, bookmark);
        return;
      }
      const target = event.target as HTMLElement | null;
      const trigger = target?.closest<HTMLElement>('.fwo-color-button');
      if (trigger && (event.key === 'Enter' || event.key === ' ')) {
        const kind = trigger.dataset.kind as ColorKind | undefined;
        if (kind) open(kind, trigger, event);
      }
    };

    editor.addEventListener('pointerup', remember);
    editor.addEventListener('keyup', remember);
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    attachTriggers();

    const observer = new MutationObserver(attachTriggers);
    observer.observe(toolbar, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      editor.removeEventListener('pointerup', remember);
      editor.removeEventListener('keyup', remember);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      triggerHandlers.forEach((handler, trigger) => trigger.removeEventListener('pointerdown', handler, true));
      window.clearTimeout(hintTimer);
      document.querySelector('.fwo-color-hint')?.remove();
      closePalette();
    };
  }, []);

  return (
    <style jsx global>{`
      .docs-color-tool.fwo-color-button {
        --fwo-selected-color:#202124;
        position:relative!important;
        width:32px!important;
        height:30px!important;
        display:inline-grid!important;
        place-items:center!important;
        border-radius:6px!important;
        overflow:hidden!important;
        cursor:pointer!important;
      }
      .docs-color-tool.fwo-color-button:hover { background:#e8eaed!important; }
      .docs-color-tool.fwo-color-button input[type='color'] {
        position:absolute!important;
        width:1px!important;
        height:1px!important;
        opacity:0!important;
        pointer-events:none!important;
      }
      .docs-color-tool.fwo-color-button::before {
        content:''!important;
        position:absolute!important;
        left:7px!important;
        right:7px!important;
        bottom:2px!important;
        height:3px!important;
        border:1px solid rgba(60,64,67,.20)!important;
        border-radius:3px!important;
        background:var(--fwo-selected-color)!important;
        z-index:3!important;
      }
      .docs-color-tool.fwo-color-button .material-symbols-rounded,
      .docs-color-tool.fwo-color-button .material-symbols-outlined,
      .docs-color-tool.fwo-color-button .material-icons {
        color:#3c4043!important;
        font-size:20px!important;
        pointer-events:none!important;
      }
      .fwo-color-palette {
        position:fixed;z-index:10050;width:278px;box-sizing:border-box;padding:12px;
        border:1px solid #dadce0;border-radius:10px;background:#fff;color:#202124;
        box-shadow:0 10px 28px rgba(60,64,67,.22),0 2px 7px rgba(60,64,67,.12);
        font-family:Arial,Helvetica,sans-serif;user-select:none;
      }
      .fwo-color-palette-head { display:grid;gap:3px;margin-bottom:10px; }
      .fwo-color-palette-head strong { font-size:13px;line-height:1.2; }
      .fwo-color-palette-head span { color:#5f6368;font-size:11px;line-height:1.35; }
      .fwo-color-swatches { display:grid;grid-template-columns:repeat(8,1fr);gap:5px; }
      .fwo-color-swatch { width:26px;height:26px;padding:0;border:1px solid rgba(60,64,67,.28);border-radius:5px;cursor:pointer;box-sizing:border-box; }
      .fwo-color-swatch:hover,.fwo-color-swatch:focus-visible { outline:2px solid #1a73e8;outline-offset:1px; }
      .fwo-color-palette-actions { display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:11px;padding-top:10px;border-top:1px solid #edf0f2; }
      .fwo-color-reset { min-height:30px;padding:0 10px;border:1px solid #dadce0;border-radius:6px;background:#fff;color:#3c4043;font-size:12px;cursor:pointer; }
      .fwo-custom-color { display:flex;align-items:center;gap:6px;color:#5f6368;font-size:12px;cursor:pointer; }
      .fwo-custom-color input[type='color'] { width:30px;height:30px;padding:2px;border:1px solid #dadce0;border-radius:6px;background:#fff;cursor:pointer; }
      .fwo-color-hint { position:fixed;z-index:10060;min-width:142px;box-sizing:border-box;padding:8px 10px;border-radius:7px;background:#202124;color:#fff;box-shadow:0 4px 14px rgba(60,64,67,.22);font:500 12px/1.3 Arial,Helvetica,sans-serif;text-align:center;pointer-events:none; }
      .editor-page[data-fwo-color-preview='true']::selection,
      .editor-page[data-fwo-color-preview='true'] *::selection { background:rgba(26,115,232,.18)!important;color:currentColor!important;text-shadow:none!important; }
      .editor-page[data-fwo-color-preview='true']::-moz-selection,
      .editor-page[data-fwo-color-preview='true'] *::-moz-selection { background:rgba(26,115,232,.18)!important;color:currentColor!important;text-shadow:none!important; }
    `}</style>
  );
}
