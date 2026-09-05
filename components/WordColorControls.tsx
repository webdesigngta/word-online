'use client';

import { useEffect, useRef, useState } from 'react';

type ColorKind = 'text' | 'highlight';

type SelectionBookmark = {
  start: number;
  end: number;
};

type PaletteState = {
  kind: ColorKind;
  left: number;
  top: number;
};

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
  return document.querySelector<HTMLElement>('.editor-page[contenteditable="true"], .editor-page');
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

  try {
    if (!editor.contains(range.commonAncestorContainer) && range.commonAncestorContainer !== editor) return null;
  } catch {
    return null;
  }

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
    if (target <= next) {
      return {
        node: text,
        offset: Math.max(0, Math.min(text.data.length, target - consumed)),
      };
    }
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

function rgbToHex(value: string) {
  const normalized = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized;
  if (normalized === 'transparent' || normalized === 'rgba(0, 0, 0, 0)') return null;
  const match = normalized.match(/rgba?\(\s*(\d+)\s*[, ]+\s*(\d+)\s*[, ]+\s*(\d+)/i);
  if (!match) return null;
  return `#${[match[1], match[2], match[3]]
    .map((part) => Math.max(0, Math.min(255, Number(part))).toString(16).padStart(2, '0'))
    .join('')}`;
}

function selectedElement(editor: HTMLElement, bookmark: SelectionBookmark) {
  if (!restoreBookmark(editor, bookmark)) return editor;
  const selection = window.getSelection();
  if (!selection?.rangeCount) return editor;
  let node: Node | null = selection.getRangeAt(0).startContainer;
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

function toolbarTool(kind: ColorKind) {
  const label = kind === 'text' ? 'Text color' : 'Highlight color';
  const input = document.querySelector<HTMLInputElement>(`.docs-toolbar input[type="color"][aria-label="${label}"]`);
  return input?.closest<HTMLElement>('.docs-color-tool') ?? null;
}

function toolKind(target: EventTarget | null): ColorKind | null {
  const element = target instanceof Element ? target : null;
  const tool = element?.closest<HTMLElement>('.docs-color-tool');
  if (!tool || !tool.closest('.docs-toolbar')) return null;
  if (tool.querySelector('input[aria-label="Text color"]')) return 'text';
  if (tool.querySelector('input[aria-label="Highlight color"]')) return 'highlight';
  return null;
}

function setIndicator(kind: ColorKind, color: string) {
  const tool = toolbarTool(kind);
  if (!tool) return;
  const visible = color === 'transparent' ? '#ffffff' : color;
  tool.style.setProperty('--fwo-selected-color', visible);
  tool.dataset.fwoHasColor = kind === 'highlight' && color === 'transparent' ? 'false' : 'true';
}

function palettePosition(tool: HTMLElement) {
  const rect = tool.getBoundingClientRect();
  const width = 260;
  const estimatedHeight = 250;
  const left = Math.max(8, Math.min(rect.left - 10, window.innerWidth - width - 8));
  const below = rect.bottom + 7;
  const top = below + estimatedHeight <= window.innerHeight
    ? below
    : Math.max(8, rect.top - estimatedHeight - 7);
  return { left, top };
}

export function WordColorControls() {
  const bookmarkRef = useRef<SelectionBookmark | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const paletteOpenRef = useRef(false);
  const [palette, setPalette] = useState<PaletteState | null>(null);
  const [customText, setCustomText] = useState(DEFAULT_TEXT_COLOR);
  const [customHighlight, setCustomHighlight] = useState(DEFAULT_HIGHLIGHT_COLOR);

  useEffect(() => {
    paletteOpenRef.current = Boolean(palette);
  }, [palette]);

  useEffect(() => {
    const editor = editorElement();
    if (!editor) return;

    const syncIndicators = (bookmark: SelectionBookmark | null) => {
      if (!bookmark) return;
      const element = selectedElement(editor, bookmark);
      const textColor = rgbToHex(getComputedStyle(element).color) || DEFAULT_TEXT_COLOR;
      const highlightColor = inheritedHighlight(element, editor);
      setIndicator('text', textColor);
      setIndicator('highlight', highlightColor || 'transparent');
    };

    const rememberFromEditor = () => {
      if (paletteOpenRef.current) return;
      const bookmark = currentBookmark(editor);
      bookmarkRef.current = bookmark;
      if (bookmark) syncIndicators(bookmark);
    };

    const blockToolbarColorPointer = (event: PointerEvent) => {
      const kind = toolKind(event.target);
      if (!kind) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const bookmark = currentBookmark(editor);
      bookmarkRef.current = bookmark;
      if (!bookmark) {
        setPalette(null);
        return;
      }

      const tool = toolbarTool(kind);
      if (!tool) return;
      const position = palettePosition(tool);
      setPalette((current) => current?.kind === kind ? null : { kind, ...position });
      window.requestAnimationFrame(() => restoreBookmark(editor, bookmarkRef.current));
    };

    const blockToolbarColorClick = (event: MouseEvent) => {
      if (!toolKind(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const blockToolbarColorKey = (event: KeyboardEvent) => {
      const kind = toolKind(event.target);
      if (!kind || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const bookmark = currentBookmark(editor);
      bookmarkRef.current = bookmark;
      if (!bookmark) return;
      const tool = toolbarTool(kind);
      if (!tool) return;
      const position = palettePosition(tool);
      setPalette({ kind, ...position });
      window.requestAnimationFrame(() => restoreBookmark(editor, bookmarkRef.current));
    };

    const closeOutside = (event: PointerEvent) => {
      if (!paletteOpenRef.current) return;
      const target = event.target instanceof Node ? event.target : null;
      if (!target || paletteRef.current?.contains(target)) return;
      if (toolKind(event.target)) return;
      setPalette(null);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !paletteOpenRef.current) return;
      event.preventDefault();
      setPalette(null);
      window.requestAnimationFrame(() => restoreBookmark(editor, bookmarkRef.current));
    };

    window.addEventListener('pointerdown', blockToolbarColorPointer, true);
    window.addEventListener('click', blockToolbarColorClick, true);
    window.addEventListener('keydown', blockToolbarColorKey, true);
    document.addEventListener('selectionchange', rememberFromEditor);
    document.addEventListener('pointerdown', closeOutside, true);
    document.addEventListener('keydown', closeOnEscape, true);

    return () => {
      window.removeEventListener('pointerdown', blockToolbarColorPointer, true);
      window.removeEventListener('click', blockToolbarColorClick, true);
      window.removeEventListener('keydown', blockToolbarColorKey, true);
      document.removeEventListener('selectionchange', rememberFromEditor);
      document.removeEventListener('pointerdown', closeOutside, true);
      document.removeEventListener('keydown', closeOnEscape, true);
    };
  }, []);

  const applyColor = (kind: ColorKind, color: string) => {
    const editor = editorElement();
    const bookmark = bookmarkRef.current;
    if (!editor || !bookmark || !restoreBookmark(editor, bookmark)) return;

    document.execCommand('styleWithCSS', false, 'true');
    let applied = false;

    if (kind === 'text') {
      applied = document.execCommand('foreColor', false, color);
    } else {
      applied = document.execCommand('hiliteColor', false, color);
      if (!applied) applied = document.execCommand('backColor', false, color);
    }

    setIndicator(kind, color);
    if (applied) editor.dispatchEvent(new Event('input', { bubbles: true }));

    window.requestAnimationFrame(() => restoreBookmark(editor, bookmarkRef.current));
  };

  if (!palette) {
    return (
      <style jsx global>{`
        .docs-color-tool { cursor:pointer!important; }
      `}</style>
    );
  }

  const colors = palette.kind === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS;
  const custom = palette.kind === 'text' ? customText : customHighlight;
  const title = palette.kind === 'text' ? 'Text color' : 'Highlight color';

  return (
    <>
      <div
        ref={paletteRef}
        className="fwo-color-palette"
        role="dialog"
        aria-label={title}
        style={{ left: palette.left, top: palette.top }}
        onPointerDown={(event) => {
          const target = event.target as HTMLInputElement;
          if (!(target instanceof HTMLInputElement && target.type === 'color')) event.preventDefault();
        }}
      >
        <div className="fwo-color-palette-head">
          <strong>{title}</strong>
          <span>Select another color to preview it on the same text</span>
        </div>

        <div className="fwo-color-swatches" role="grid" aria-label={`${title} palette`}>
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className="fwo-color-swatch"
              aria-label={`${title} ${color}`}
              title={color}
              style={{ backgroundColor: color }}
              onClick={() => applyColor(palette.kind, color)}
            />
          ))}
        </div>

        <div className="fwo-color-palette-actions">
          <button
            type="button"
            className="fwo-color-reset"
            onClick={() => applyColor(palette.kind, palette.kind === 'text' ? DEFAULT_TEXT_COLOR : 'transparent')}
          >
            {palette.kind === 'text' ? 'Default text' : 'No highlight'}
          </button>

          <label className="fwo-custom-color">
            <span>Custom</span>
            <input
              type="color"
              aria-label={`Custom ${title.toLowerCase()}`}
              value={custom}
              onChange={(event) => {
                const color = event.target.value;
                if (palette.kind === 'text') setCustomText(color);
                else setCustomHighlight(color);
                applyColor(palette.kind, color);
              }}
            />
          </label>
        </div>
      </div>

      <style jsx global>{`
        .docs-color-tool {
          cursor:pointer!important;
          overflow:visible!important;
        }
        .fwo-color-palette {
          position:fixed;
          z-index:10020;
          width:260px;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #dadce0;
          border-radius:12px;
          background:#fff;
          box-shadow:0 12px 34px rgba(60,64,67,.26),0 2px 8px rgba(60,64,67,.14);
          color:#202124;
          font-family:Arial,Helvetica,sans-serif;
          user-select:none;
        }
        .fwo-color-palette-head {
          display:grid;
          gap:3px;
          margin-bottom:10px;
        }
        .fwo-color-palette-head strong {
          font-size:13px;
          line-height:1.2;
        }
        .fwo-color-palette-head span {
          color:#5f6368;
          font-size:11px;
          line-height:1.35;
        }
        .fwo-color-swatches {
          display:grid;
          grid-template-columns:repeat(8, 1fr);
          gap:5px;
        }
        .fwo-color-swatch {
          width:24px;
          height:24px;
          padding:0;
          border:1px solid rgba(60,64,67,.28);
          border-radius:6px;
          cursor:pointer;
          box-sizing:border-box;
        }
        .fwo-color-swatch:hover,
        .fwo-color-swatch:focus-visible {
          outline:2px solid #1a73e8;
          outline-offset:1px;
        }
        .fwo-color-palette-actions {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          margin-top:11px;
          padding-top:10px;
          border-top:1px solid #edf0f2;
        }
        .fwo-color-reset {
          min-height:30px;
          padding:0 9px;
          border:1px solid #dadce0;
          border-radius:7px;
          background:#fff;
          color:#3c4043;
          font-size:12px;
          cursor:pointer;
        }
        .fwo-color-reset:hover { background:#f8fafd; }
        .fwo-custom-color {
          display:flex;
          align-items:center;
          gap:6px;
          color:#5f6368;
          font-size:12px;
          cursor:pointer;
        }
        .fwo-custom-color input[type='color'] {
          width:30px;
          height:30px;
          padding:2px;
          border:1px solid #dadce0;
          border-radius:7px;
          background:#fff;
          cursor:pointer;
        }
      `}</style>
    </>
  );
}
