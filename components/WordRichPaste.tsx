'use client';

import { useEffect } from 'react';

const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'EM', 'FONT',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'I', 'IMG', 'LI',
  'OL', 'P', 'PRE', 'S', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUP',
  'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL',
]);

const DROP_WITH_CONTENT = new Set([
  'BASE', 'BUTTON', 'EMBED', 'FORM', 'HEAD', 'IFRAME', 'INPUT', 'LINK',
  'META', 'OBJECT', 'OPTION', 'SCRIPT', 'SELECT', 'STYLE', 'SVG', 'TEXTAREA',
]);

const BLOCK_TAGS = new Set([
  'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'LI', 'OL',
  'P', 'PRE', 'TABLE', 'UL',
]);

const SAFE_STYLE_PROPERTIES = new Set([
  'background-color',
  'border',
  'border-bottom',
  'border-bottom-color',
  'border-bottom-style',
  'border-bottom-width',
  'border-color',
  'border-left',
  'border-left-color',
  'border-left-style',
  'border-left-width',
  'border-right',
  'border-right-color',
  'border-right-style',
  'border-right-width',
  'border-style',
  'border-top',
  'border-top-color',
  'border-top-style',
  'border-top-width',
  'border-width',
  'color',
  'direction',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
  'list-style-type',
  'text-align',
  'text-decoration',
  'text-decoration-color',
  'text-decoration-line',
  'text-decoration-style',
  'vertical-align',
]);

const SAFE_ATTRIBUTES: Record<string, Set<string>> = {
  A: new Set(['href', 'title']),
  IMG: new Set(['src', 'alt', 'title']),
  OL: new Set(['start', 'type']),
  TABLE: new Set(['data-doc321-real-table']),
  TD: new Set(['colspan', 'rowspan']),
  TH: new Set(['colspan', 'rowspan', 'scope']),
};

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function isSafeUrl(value: string, image = false) {
  const clean = value.trim();
  if (!clean) return false;
  if (clean.startsWith('#') || clean.startsWith('/') || clean.startsWith('./') || clean.startsWith('../')) return true;
  if (image && /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);/i.test(clean)) return true;

  try {
    const url = new URL(clean, window.location.href);
    if (image) return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'blob:';
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function copySafeStyles(source: HTMLElement, target: HTMLElement) {
  const declarations: Array<[string, string, string]> = [];
  for (let index = 0; index < source.style.length; index += 1) {
    const property = source.style.item(index).toLowerCase();
    if (!SAFE_STYLE_PROPERTIES.has(property)) continue;
    const value = source.style.getPropertyValue(property).trim();
    if (!value) continue;
    declarations.push([property, value, source.style.getPropertyPriority(property)]);
  }

  target.removeAttribute('style');
  declarations.forEach(([property, value, priority]) => target.style.setProperty(property, value, priority));
}

function copySafeAttributes(source: HTMLElement, target: HTMLElement) {
  const allowed = SAFE_ATTRIBUTES[source.tagName] ?? new Set<string>();
  Array.from(source.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    if (name === 'style') return;

    if (name === 'dir' || name === 'lang') {
      target.setAttribute(name, attribute.value);
      return;
    }

    if (name === 'data-fwo-paragraph-style') {
      const value = attribute.value.toLowerCase();
      if (value === 'title' || value === 'subtitle') target.setAttribute(name, value);
      return;
    }

    if (!allowed.has(name)) return;
    if (name === 'href' && !isSafeUrl(attribute.value)) return;
    if (name === 'src' && !isSafeUrl(attribute.value, true)) return;
    target.setAttribute(name, attribute.value);
  });
}

function normalizeFontElement(element: HTMLElement) {
  const span = element.ownerDocument.createElement('span');
  copySafeStyles(element, span);
  const color = element.getAttribute('color');
  const face = element.getAttribute('face');
  if (color) span.style.color = color;
  if (face) span.style.fontFamily = face;
  while (element.firstChild) span.appendChild(element.firstChild);
  element.replaceWith(span);
  return span;
}

function normalizeDivElement(element: HTMLElement) {
  const hasBlockChild = Array.from(element.children).some((child) => BLOCK_TAGS.has(child.tagName));
  if (hasBlockChild) {
    const fragment = element.ownerDocument.createDocumentFragment();
    fragment.append(...Array.from(element.childNodes));
    element.replaceWith(fragment);
    return null;
  }

  const paragraph = element.ownerDocument.createElement('p');
  copySafeStyles(element, paragraph);
  copySafeAttributes(element, paragraph);
  while (element.firstChild) paragraph.appendChild(element.firstChild);
  element.replaceWith(paragraph);
  return paragraph;
}

function sanitizeElement(element: HTMLElement) {
  Array.from(element.childNodes).forEach((child) => sanitizeNode(child));

  if (DROP_WITH_CONTENT.has(element.tagName)) {
    element.remove();
    return;
  }

  if (element.tagName === 'DIV') {
    normalizeDivElement(element);
    return;
  }

  if (element.tagName === 'FONT') {
    normalizeFontElement(element);
    return;
  }

  if (!ALLOWED_TAGS.has(element.tagName)) {
    const fragment = element.ownerDocument.createDocumentFragment();
    fragment.append(...Array.from(element.childNodes));
    element.replaceWith(fragment);
    return;
  }

  const clone = element.cloneNode(false) as HTMLElement;
  copySafeStyles(element, clone);
  copySafeAttributes(element, clone);
  while (element.firstChild) clone.appendChild(element.firstChild);
  element.replaceWith(clone);
}

function sanitizeNode(node: Node) {
  if (node.nodeType === Node.COMMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }
  if (node instanceof HTMLElement) sanitizeElement(node);
}

function tableColumnCount(table: HTMLTableElement) {
  return Array.from(table.rows).reduce((maximum, row) => {
    const columns = Array.from(row.cells).reduce((total, cell) => total + Math.max(1, cell.colSpan || 1), 0);
    return Math.max(maximum, columns);
  }, 0);
}

function cellHasMeaningfulContent(cell: HTMLTableCellElement) {
  const text = (cell.textContent ?? '').replace(/\s+/g, ' ').trim();
  return Boolean(text || cell.querySelector('img,hr,table'));
}

function clipboardComesFromDocumentApp(html: string) {
  return /(?:mso-|urn:schemas-microsoft-com:office|google-sheets-html-origin|docs-internal-guid|data-sheets-value|data-sheets-userformat)/i.test(html);
}

function clipboardTextLooksTabular(plainText: string, rowCount: number) {
  const lines = plainText.replace(/\r\n?/g, '\n').split('\n').filter((line) => line.trim());
  const tabbedLines = lines.filter((line) => line.includes('\t'));
  const minimumTabbedLines = Math.min(2, Math.max(1, rowCount));
  return tabbedLines.length >= minimumTabbedLines;
}

function tableLooksLikeRealData(table: HTMLTableElement, plainText: string, sourceHtml: string) {
  const columnCount = tableColumnCount(table);
  if (columnCount < 2) return false;

  const rows = Array.from(table.rows);
  const headerCells = table.querySelectorAll('th').length;
  const hasSemanticHeader = Boolean(table.querySelector('thead')) || headerCells >= 2;
  const role = (table.getAttribute('role') ?? '').toLowerCase();
  const hasTableRole = role === 'table' || role === 'grid';

  // Explicit table semantics should always survive a formatted paste.
  if (hasSemanticHeader || hasTableRole) return true;

  const denseRows = rows.filter((row) => Array.from(row.cells).filter(cellHasMeaningfulContent).length >= 2).length;
  const looksTabularText = clipboardTextLooksTabular(plainText, rows.length);

  // Office, Google Docs and Google Sheets use layout-ish markup even for genuine
  // document tables. Their source markers plus tabular plain text are strong proof
  // that the table is user data rather than a copied webpage layout.
  if (clipboardComesFromDocumentApp(sourceHtml) && looksTabularText && denseRows >= 1) return true;

  // Generic webpage clipboard HTML frequently uses multi-column tables for cards,
  // nav items and feature grids. Keeping those tables is what caused pasted text to
  // collapse into the very narrow vertical columns seen in the editor. Only retain
  // a small, simple generic table when the plain-text clipboard is clearly tabular.
  const cells = Array.from(table.querySelectorAll<HTMLTableCellElement>('td,th'));
  const hasRichLayoutContent = cells.some((cell) => Boolean(cell.querySelector('h1,h2,h3,h4,h5,h6,ul,ol,blockquote,pre,table,img')));
  return columnCount <= 2 && denseRows >= 2 && looksTabularText && !hasRichLayoutContent;
}

function appendCellAsDocumentContent(fragment: DocumentFragment, cell: HTMLTableCellElement) {
  if (!cellHasMeaningfulContent(cell)) return;

  const hasBlockChild = Array.from(cell.children).some((child) => BLOCK_TAGS.has(child.tagName));
  if (hasBlockChild) {
    fragment.append(...Array.from(cell.childNodes));
    return;
  }

  const paragraph = cell.ownerDocument.createElement('p');
  while (cell.firstChild) paragraph.appendChild(cell.firstChild);
  if (!paragraph.childNodes.length) paragraph.appendChild(cell.ownerDocument.createElement('br'));
  fragment.appendChild(paragraph);
}

function unwrapLayoutTable(table: HTMLTableElement) {
  const fragment = table.ownerDocument.createDocumentFragment();

  Array.from(table.rows).forEach((row) => {
    Array.from(row.cells).forEach((cell) => appendCellAsDocumentContent(fragment, cell));
  });

  if (!fragment.childNodes.length) {
    const paragraph = table.ownerDocument.createElement('p');
    paragraph.appendChild(table.ownerDocument.createElement('br'));
    fragment.appendChild(paragraph);
  }

  table.replaceWith(fragment);
}

function normalizePastedTables(root: HTMLElement, plainText: string, sourceHtml: string) {
  // Inspect raw clipboard markup before sanitizing it. That preserves useful source
  // markers/semantics for deciding whether a table is real data or only page layout.
  Array.from(root.querySelectorAll<HTMLTableElement>('table')).reverse().forEach((table) => {
    if (!tableLooksLikeRealData(table, plainText, sourceHtml)) {
      unwrapLayoutTable(table);
      return;
    }

    table.setAttribute('data-doc321-real-table', 'true');
    table.style.width = '100%';
    table.style.maxWidth = '100%';
    table.style.tableLayout = 'auto';

    Array.from(table.rows).forEach((row) => {
      Array.from(row.cells).forEach((cell) => {
        cell.style.width = 'auto';
        cell.style.minWidth = '0';
        cell.style.maxWidth = '100%';
      });
    });
  });
}

function repairCollapsedLayoutTables(editor: HTMLElement) {
  let changed = false;

  Array.from(editor.querySelectorAll<HTMLTableElement>('table')).reverse().forEach((table) => {
    if (table.getAttribute('data-doc321-real-table') === 'true') return;
    if (table.querySelector('thead,th')) return;

    const role = (table.getAttribute('role') ?? '').toLowerCase();
    if (role === 'table' || role === 'grid') return;

    const columnCount = tableColumnCount(table);
    if (columnCount < 6) return;

    const cells = Array.from(table.querySelectorAll<HTMLTableCellElement>('td,th'));
    const measuredWidths = cells.map((cell) => cell.getBoundingClientRect().width).filter((width) => width > 0);
    if (!measuredWidths.length) return;

    const averageWidth = measuredWidths.reduce((total, width) => total + width, 0) / measuredWidths.length;
    const proseCells = cells.filter((cell) => (cell.textContent ?? '').replace(/\s+/g, ' ').trim().length >= 24).length;
    const layoutHeavyCells = cells.filter((cell) => Boolean(cell.querySelector('p,h1,h2,h3,h4,h5,h6,ul,ol,blockquote,img'))).length;

    // This is deliberately narrow: it repairs the extreme 6+ column, prose-heavy
    // layout-table failure from older pastes without touching normal user tables.
    if (averageWidth > 120 || proseCells < 2 || layoutHeavyCells < 2) return;

    unwrapLayoutTable(table);
    changed = true;
  });

  if (changed) editor.dispatchEvent(new Event('input', { bubbles: true }));
}

function normalizeLooseTopLevelContent(root: HTMLElement, plainText: string) {
  const hasBlockChild = Array.from(root.children).some((child) => BLOCK_TAGS.has(child.tagName));
  if (hasBlockChild || !/[\r\n]/.test(plainText)) return;

  const paragraph = root.ownerDocument.createElement('p');
  while (root.firstChild) paragraph.appendChild(root.firstChild);
  root.appendChild(paragraph);
}

function normalizePastedBlocks(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,h5,h6,blockquote,pre,ul,ol').forEach((element) => {
    element.style.maxWidth = '100%';
    element.style.minWidth = '0';
  });
}

function sanitizedClipboardHtml(html: string, plainText: string) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');

  // Remove layout tables before sanitization strips the clues that identify them.
  normalizePastedTables(parsed.body, plainText, html);
  Array.from(parsed.body.childNodes).forEach((node) => sanitizeNode(node));
  normalizeLooseTopLevelContent(parsed.body, plainText);
  normalizePastedBlocks(parsed.body);

  // Never allow copied layout dimensions to make the document wider/taller than
  // the DOC321 editing surface. Formatting survives; foreign page geometry does not.
  parsed.body.querySelectorAll<HTMLElement>('img,table,pre').forEach((element) => {
    element.style.maxWidth = '100%';
    if (element.tagName === 'IMG') element.style.height = 'auto';
  });

  return parsed.body.innerHTML;
}

function selectionInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;
  const range = selection.getRangeAt(0);
  return editor.contains(range.startContainer) && editor.contains(range.endContainer);
}

function insertClipboardContent(editor: HTMLElement, html: string, text: string, plainText: boolean) {
  editor.focus({ preventScroll: true });

  if (plainText || !html.trim()) {
    document.execCommand('insertText', false, text);
  } else {
    const clean = sanitizedClipboardHtml(html, text);
    if (clean.trim()) document.execCommand('insertHTML', false, clean);
    else document.execCommand('insertText', false, text);
  }

  editor.dispatchEvent(new Event('input', { bubbles: true }));
  requestAnimationFrame(() => repairCollapsedLayoutTables(editor));
}

/**
 * Rich paste for the DOC321 Word editor.
 *
 * Keeps useful document semantics/formatting while removing imported layout,
 * scripts, stylesheet rules, IDs/classes, fixed sizes and other clipboard junk
 * that can hide pages or make the contenteditable surface difficult to edit.
 */
export function WordRichPaste() {
  useEffect(() => {
    const editor = editorElement();
    if (!editor) return;

    let pasteAsPlainText = false;

    // Repair documents that were autosaved before the stronger paste cleanup was
    // deployed. Running twice catches both immediate and restored local content.
    const firstRepairFrame = requestAnimationFrame(() => repairCollapsedLayoutTables(editor));
    const delayedRepair = window.setTimeout(() => repairCollapsedLayoutTables(editor), 250);

    const onKeyDown = (event: KeyboardEvent) => {
      pasteAsPlainText = Boolean((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'v');
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'v') pasteAsPlainText = false;
    };

    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as Node | null;
      if (!target || !editor.contains(target) || !selectionInside(editor)) return;
      const clipboard = event.clipboardData;
      if (!clipboard) return;

      const html = clipboard.getData('text/html');
      const text = clipboard.getData('text/plain');
      if (!html && !text) return;

      event.preventDefault();
      event.stopPropagation();
      insertClipboardContent(editor, html, text, pasteAsPlainText);
      pasteAsPlainText = false;
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
    editor.addEventListener('paste', onPaste, true);

    return () => {
      cancelAnimationFrame(firstRepairFrame);
      window.clearTimeout(delayedRepair);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('keyup', onKeyUp, true);
      editor.removeEventListener('paste', onPaste, true);
    };
  }, []);

  return (
    <style jsx global>{`
      .docs-editor-workspace .editor-page img {
        max-width: 100% !important;
        height: auto;
      }
      .docs-editor-workspace .editor-page table {
        width: 100% !important;
        max-width: 100% !important;
        table-layout: auto;
      }
      .docs-editor-workspace .editor-page pre {
        max-width: 100%;
        overflow-x: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .docs-editor-workspace .editor-page p,
      .docs-editor-workspace .editor-page h1,
      .docs-editor-workspace .editor-page h2,
      .docs-editor-workspace .editor-page h3,
      .docs-editor-workspace .editor-page h4,
      .docs-editor-workspace .editor-page h5,
      .docs-editor-workspace .editor-page h6,
      .docs-editor-workspace .editor-page li,
      .docs-editor-workspace .editor-page blockquote {
        max-width: 100%;
        min-width: 0;
        overflow-wrap: break-word;
        word-break: normal;
      }
      .docs-editor-workspace .editor-page td,
      .docs-editor-workspace .editor-page th {
        min-width: 0;
        max-width: 100%;
        overflow-wrap: break-word;
        word-break: normal;
      }
      .docs-editor-workspace .editor-page a {
        overflow-wrap: anywhere;
        word-break: break-word;
      }
    `}</style>
  );
}
