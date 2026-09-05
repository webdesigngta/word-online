'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

type HintState = {
  left: number;
  top: number;
};

type TextTarget = {
  node: Text;
  start: number;
  end: number;
};

const DEFAULT_TEXT_COLOR = '#202124';
const DEFAULT_HIGHLIGHT_COLOR = '#fdd663';
const NO_HIGHLIGHT_COLOR = '#ffffff';

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
      targets.push({
        node: text,
        start: overlapStart - nodeStart,
        end: overlapEnd - nodeStart,
      });
    }

    if (nodeEnd >= bookmark.end) break;
    node = walker.nextNode();
  }

  return targets;
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

    // One DOC321 fragment owns both text and highlight styles. This prevents
    // alternating text/highlight choices from building nested formatting spans.
    if (
      parent?.dataset.fwoColorFragment === 'true' &&
      parent.childNodes.length === 1 &&
      parent.firstChild === selectedNode
    ) {
      if (kind === 'text') parent.style.color = color;
      else parent.style.backgroundColor = color;
      continue;
    }

    const span = document.createElement('span');
    span.dataset.fwoColorFragment = 'true';
    if (kind === 'text') span.style.color = color;
    else span.style.backgroundColor = color;
    selectedNode.parentNode?.insertBefore(span, selectedNode);
    span.appendChild(selectedNode);
  }

  return true;
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

function colorsAtBookmark(editor: HTMLElement, bookmark: SelectionBookmark) {
  const boundary = boundaryAtOffset(editor, bookmark.start);
  let element = boundary?.node.parentElement ?? editor;
  const text = rgbToHex(getComputedStyle(element).color) || DEFAULT_TEXT_COLOR;
  let highlight: string | null = null;

  while (element && element !== editor) {
    const background = rgbToHex(getComputedStyle(element).backgroundColor);
    if (background && background !== '#ffffff') {
      highlight = background;
      break;
    }
    element = element.parentElement as HTMLElement;
  }

  return { text, highlight: highlight || NO_HIGHLIGHT_COLOR };
}

function legacyFormatGroup() {
  const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
  const legacyText = toolbar?.querySelector<HTMLInputElement>('input[type="color"][aria-label="Text color"]');
  return legacyText?.closest<HTMLElement>('.docs-toolbar-group') ?? null;
}

function positionPopover(button: HTMLElement, width: number, height: number) {
  const rect = button.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.left - 8, window.innerWidth - width - 8));
  const below = rect.bottom + 8;
  const top = below + height <= window.innerHeight
    ? below
    : Math.max(8, rect.top - height - 8);
  return { left, top };
}

function ColorToolbarButton({
  kind,
  color,
  onOpen,
}: {
  kind: ColorKind;
  color: string;
  onOpen: (kind: ColorKind, button: HTMLButtonElement) => void;
}) {
  const text = kind === 'text' ? 'Text color' : 'Highlight color';
  const icon = kind === 'text' ? 'format_color_text' : 'ink_highlighter';

  return (
    <button
      type="button"
      className="fwo-color-button"
      data-kind={kind}
      aria-label={text}
      title={text}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onOpen(kind, event.currentTarget);
      }}
    >
      <span className="material-symbols-rounded fwo-color-button-icon" aria-hidden="true">{icon}</span>
      <span
        className="fwo-color-button-indicator"
        aria-hidden="true"
        style={{ backgroundColor: color }}
      />
    </button>
  );
}

export function WordColorControls() {
  const bookmarkRef = useRef<SelectionBookmark | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const hintTimerRef = useRef<number | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [palette, setPalette] = useState<PaletteState | null>(null);
  const [hint, setHint] = useState<HintState | null>(null);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
  const [customText, setCustomText] = useState(DEFAULT_TEXT_COLOR);
  const [customHighlight, setCustomHighlight] = useState(DEFAULT_HIGHLIGHT_COLOR);

  useEffect(() => {
    let disposed = false;
    let attempts = 0;

    const findTarget = () => {
      if (disposed) return;
      const target = legacyFormatGroup();
      if (target) {
        setPortalTarget(target);
        return;
      }
      attempts += 1;
      if (attempts < 60) window.requestAnimationFrame(findTarget);
    };

    findTarget();
    return () => { disposed = true; };
  }, []);

  // Remember selection only when the user finishes selecting/typing inside the
  // editor. There is deliberately no document-wide selectionchange listener.
  useEffect(() => {
    const editor = editorElement();
    if (!editor) return;

    const remember = () => {
      const bookmark = currentBookmark(editor);
      if (bookmark) bookmarkRef.current = bookmark;
    };

    editor.addEventListener('pointerup', remember);
    editor.addEventListener('keyup', remember);
    return () => {
      editor.removeEventListener('pointerup', remember);
      editor.removeEventListener('keyup', remember);
    };
  }, [portalTarget]);

  useEffect(() => {
    if (!palette) return;

    const closeOutside = (event: PointerEvent) => {
      const target = event.target instanceof Node ? event.target : null;
      if (!target) return;
      if (paletteRef.current?.contains(target)) return;
      if ((target as Element).closest?.('.fwo-color-button')) return;
      setPalette(null);
    };

    const closeEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPalette(null);
      const editor = editorElement();
      if (editor) window.requestAnimationFrame(() => restoreBookmark(editor, bookmarkRef.current));
    };

    document.addEventListener('pointerdown', closeOutside, true);
    document.addEventListener('keydown', closeEscape, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true);
      document.removeEventListener('keydown', closeEscape, true);
    };
  }, [palette]);

  useEffect(() => () => {
    if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
  }, []);

  const showSelectionHint = (button: HTMLElement) => {
    const position = positionPopover(button, 142, 38);
    setHint(position);
    if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => setHint(null), 1800);
  };

  const openPalette = (kind: ColorKind, button: HTMLButtonElement) => {
    const editor = editorElement();
    if (!editor) return;

    const bookmark = currentBookmark(editor) || bookmarkRef.current;
    if (!bookmark || !restoreBookmark(editor, bookmark)) {
      bookmarkRef.current = null;
      setPalette(null);
      showSelectionHint(button);
      return;
    }

    bookmarkRef.current = bookmark;
    const current = colorsAtBookmark(editor, bookmark);
    setTextColor(current.text);
    setHighlightColor(current.highlight);
    const position = positionPopover(button, 270, 260);
    setHint(null);
    setPalette((previous) => previous?.kind === kind ? null : { kind, ...position });
    window.requestAnimationFrame(() => restoreBookmark(editor, bookmarkRef.current));
  };

  const applyColor = (kind: ColorKind, requestedColor: string) => {
    const editor = editorElement();
    const bookmark = bookmarkRef.current;
    if (!editor || !bookmark) return;

    const color = kind === 'highlight' && requestedColor === 'transparent'
      ? NO_HIGHLIGHT_COLOR
      : requestedColor;
    if (!applyExactColor(editor, bookmark, kind, color)) return;

    if (kind === 'text') setTextColor(color);
    else setHighlightColor(color);
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    // Text length does not change, so the bookmark remains valid after styling.
    restoreBookmark(editor, bookmark);
    window.requestAnimationFrame(() => restoreBookmark(editor, bookmark));
  };

  const controls = portalTarget ? createPortal(
    <div className="fwo-color-controls" aria-label="Text colors">
      <ColorToolbarButton kind="text" color={textColor} onOpen={openPalette} />
      <ColorToolbarButton kind="highlight" color={highlightColor} onOpen={openPalette} />
    </div>,
    portalTarget,
  ) : null;

  const colors = palette?.kind === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS;
  const custom = palette?.kind === 'text' ? customText : customHighlight;
  const title = palette?.kind === 'text' ? 'Text color' : 'Highlight color';

  const popovers = typeof document !== 'undefined' ? createPortal(
    <>
      {hint ? (
        <div className="fwo-color-hint" role="status" style={{ left: hint.left, top: hint.top }}>
          Select text first
        </div>
      ) : null}

      {palette ? (
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
            <span>Your text stays selected while you try colors.</span>
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
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => applyColor(palette.kind, color)}
              />
            ))}
          </div>

          <div className="fwo-color-palette-actions">
            <button
              type="button"
              className="fwo-color-reset"
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => applyColor(
                palette.kind,
                palette.kind === 'text' ? DEFAULT_TEXT_COLOR : 'transparent',
              )}
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
      ) : null}
    </>,
    document.body,
  ) : null;

  return (
    <>
      {controls}
      {popovers}
      <style jsx global>{`
        /* The original browser color inputs and every old indicator/pseudo-layer
           are retired. New controls below intentionally use different classes. */
        .docs-toolbar .docs-color-tool {
          display:none!important;
          pointer-events:none!important;
        }
        .docs-toolbar .docs-color-tool::before,
        .docs-toolbar .docs-color-tool::after,
        .docs-toolbar .docs-color-tool.highlight::before,
        .docs-toolbar .docs-color-tool.highlight::after {
          content:none!important;
          display:none!important;
        }

        .fwo-color-controls {
          display:inline-flex;
          align-items:center;
          gap:2px;
          flex:0 0 auto;
        }
        .fwo-color-button {
          position:relative;
          display:inline-grid;
          place-items:center;
          width:32px;
          height:30px;
          min-width:32px;
          padding:0 0 4px;
          border:0;
          border-radius:6px;
          background:transparent;
          color:#3c4043;
          cursor:pointer;
          box-sizing:border-box;
          -webkit-tap-highlight-color:transparent;
        }
        .fwo-color-button:hover { background:#e8eaed; }
        .fwo-color-button:active { background:#dfe3e7; }
        .fwo-color-button:focus-visible {
          outline:2px solid #1a73e8;
          outline-offset:1px;
        }
        .fwo-color-button-icon {
          display:block;
          width:20px;
          height:20px;
          color:#3c4043!important;
          font-size:20px!important;
          line-height:20px!important;
          overflow:hidden;
          pointer-events:none;
        }
        .fwo-color-button-indicator {
          position:absolute;
          left:7px;
          right:7px;
          bottom:2px;
          height:3px;
          border:1px solid rgba(60,64,67,.20);
          border-radius:3px;
          box-sizing:border-box;
          pointer-events:none;
        }

        .fwo-color-hint {
          position:fixed;
          z-index:10030;
          box-sizing:border-box;
          min-width:142px;
          padding:8px 10px;
          border-radius:7px;
          background:#202124;
          color:#fff;
          box-shadow:0 4px 14px rgba(60,64,67,.22);
          font:500 12px/1.3 Arial,Helvetica,sans-serif;
          text-align:center;
          pointer-events:none;
        }
        .fwo-color-palette {
          position:fixed;
          z-index:10020;
          width:270px;
          box-sizing:border-box;
          padding:12px;
          border:1px solid #dadce0;
          border-radius:10px;
          background:#fff;
          box-shadow:0 10px 28px rgba(60,64,67,.22),0 2px 7px rgba(60,64,67,.12);
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
          width:25px;
          height:25px;
          padding:0;
          border:1px solid rgba(60,64,67,.28);
          border-radius:5px;
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
          padding:0 10px;
          border:1px solid #dadce0;
          border-radius:6px;
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
          border-radius:6px;
          background:#fff;
          cursor:pointer;
        }

        @media (max-width:720px) {
          .fwo-color-button {
            width:34px;
            min-width:34px;
            height:32px;
          }
          .fwo-color-palette {
            width:min(270px,calc(100vw - 16px));
          }
        }
      `}</style>
    </>
  );
}
