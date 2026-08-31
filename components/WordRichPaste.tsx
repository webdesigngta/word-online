'use client';

import { useEffect } from 'react';

const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'CODE', 'DEL', 'EM', 'FONT',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'I', 'LI', 'OL', 'P', 'PRE',
  'S', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUP', 'U', 'UL',
]);

const DROP_WITH_CONTENT = new Set([
  'BASE', 'BUTTON', 'EMBED', 'FORM', 'HEAD', 'IFRAME', 'INPUT', 'LINK',
  'META', 'OBJECT', 'OPTION', 'SCRIPT', 'SELECT', 'STYLE', 'SVG', 'TEXTAREA',
]);

const BLOCK_TAGS = new Set([
  'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'OL', 'P', 'PRE', 'UL',
]);

const SAFE_STYLE_PROPERTIES = new Set([
  'background-color',
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
  'text-transform',
  'vertical-align',
  'white-space',
]);

const SAFE_ATTRIBUTES: Record<string, Set<string>> = {
  A: new Set(['href', 'title']),
  OL: new Set(['start', 'type']),
};

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function isSafeUrl(value: string) {
  const clean = value.trim();
  if (!clean) return false;
  if (clean.startsWith('#') || clean.startsWith('/') || clean.startsWith('./') || clean.startsWith('../')) return true;

  try {
    const url = new URL(clean, window.location.href);
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
}

function normalizeDivElement(element: HTMLElement) {
  const hasBlockChild = Array.from(element.children).some((child) => BLOCK_TAGS.has(child.tagName));
  if (hasBlockChild) {
    const fragment = element.ownerDocument.createDocumentFragment();
    fragment.append(...Array.from(element.childNodes));
    element.replaceWith(fragment);
    return;
  }

  const paragraph = element.ownerDocument.createElement('p');
  copySafeStyles(element, paragraph);
  copySafeAttributes(element, paragraph);
  while (element.firstChild) paragraph.appendChild(element.firstChild);
  element.replaceWith(paragraph);
}

function unwrapTableToText(table: HTMLTableElement) {
  const fragment = table.ownerDocument.createDocumentFragment();

  Array.from(table.rows).forEach((row) => {
    const paragraph = table.ownerDocument.createElement('p');
    const values = Array.from(row.cells)
      .map((cell) => (cell.innerText || cell.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    if (values.length) paragraph.textContent = values.join('    ');
    else paragraph.appendChild(table.ownerDocument.createElement('br'));
    fragment.appendChild(paragraph);
  });

  if (!fragment.childNodes.length) {
    const paragraph = table.ownerDocument.createElement('p');
    paragraph.appendChild(table.ownerDocument.createElement('br'));
    fragment.appendChild(paragraph);
  }

  table.replaceWith(fragment);
}

function sanitizeElement(element: HTMLElement) {
  Array.from(element.childNodes).forEach((child) => sanitizeNode(child));

  if (DROP_WITH_CONTENT.has(element.tagName)) {
    element.remove();
    return;
  }

  if (element.tagName === 'TABLE') {
    unwrapTableToText(element as HTMLTableElement);
    return;
  }

  // Never import foreign visual/layout objects from the clipboard.
  if (['HR', 'IMG', 'VIDEO', 'AUDIO', 'CANVAS'].includes(element.tagName)) {
    element.remove();
    return;
  }

  if (['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER', 'ASIDE', 'NAV'].includes(element.tagName)) {
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

function normalizeLooseTopLevelContent(root: HTMLElement, plainText: string) {
  const hasBlockChild = Array.from(root.children).some((child) => BLOCK_TAGS.has(child.tagName));
  if (hasBlockChild || !/[\r\n]/.test(plainText)) return;

  const paragraph = root.ownerDocument.createElement('p');
  while (root.firstChild) paragraph.appendChild(root.firstChild);
  root.appendChild(paragraph);
}

function normalizePastedBlocks(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,h5,h6,blockquote,pre,ul,ol,li').forEach((element) => {
    element.style.maxWidth = '100%';
    element.style.minWidth = '0';
    element.style.boxSizing = 'border-box';
  });
}

function sanitizedClipboardHtml(html: string, plainText: string) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  Array.from(parsed.body.childNodes).forEach((node) => sanitizeNode(node));
  normalizeLooseTopLevelContent(parsed.body, plainText);
  normalizePastedBlocks(parsed.body);
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
}

/**
 * DOC321 paste keeps only text and text formatting.
 * Layout, tables, images, rules, boxes, borders, fixed geometry and decorative
 * markup are stripped so pasted content always remains inside the white document.
 */
export function WordRichPaste() {
  useEffect(() => {
    const editor = editorElement();
    if (!editor) return;

    let pasteAsPlainText = false;

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
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('keyup', onKeyUp, true);
      editor.removeEventListener('paste', onPaste, true);
    };
  }, []);

  return (
    <style jsx global>{`
      .docs-editor-workspace .editor-page {
        overflow-x: hidden !important;
        overflow-wrap: break-word;
        word-break: normal;
      }
      .docs-editor-workspace .editor-page p,
      .docs-editor-workspace .editor-page h1,
      .docs-editor-workspace .editor-page h2,
      .docs-editor-workspace .editor-page h3,
      .docs-editor-workspace .editor-page h4,
      .docs-editor-workspace .editor-page h5,
      .docs-editor-workspace .editor-page h6,
      .docs-editor-workspace .editor-page li,
      .docs-editor-workspace .editor-page blockquote,
      .docs-editor-workspace .editor-page pre {
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        overflow-wrap: break-word;
        word-break: normal;
      }
      .docs-editor-workspace .editor-page pre {
        white-space: pre-wrap !important;
      }
      .docs-editor-workspace .editor-page hr,
      .docs-editor-workspace .editor-page img,
      .docs-editor-workspace .editor-page video,
      .docs-editor-workspace .editor-page audio,
      .docs-editor-workspace .editor-page canvas,
      .docs-editor-workspace .editor-page table {
        display: none !important;
      }
    `}</style>
  );
}
