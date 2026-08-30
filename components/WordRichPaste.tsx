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
  'text-indent',
  'vertical-align',
]);

const SAFE_ATTRIBUTES: Record<string, Set<string>> = {
  A: new Set(['href', 'title']),
  IMG: new Set(['src', 'alt', 'title']),
  OL: new Set(['start', 'type']),
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
    const span = normalizeFontElement(element);
    copySafeStyles(element, span);
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

function sanitizedClipboardHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  Array.from(parsed.body.childNodes).forEach((node) => sanitizeNode(node));

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
    const clean = sanitizedClipboardHtml(html);
    if (clean.trim()) document.execCommand('insertHTML', false, clean);
    else document.execCommand('insertText', false, text);
  }

  editor.dispatchEvent(new Event('input', { bubbles: true }));
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
      .docs-editor-workspace .editor-page img {
        max-width: 100% !important;
        height: auto;
      }
      .docs-editor-workspace .editor-page table {
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
      .docs-editor-workspace .editor-page li,
      .docs-editor-workspace .editor-page td,
      .docs-editor-workspace .editor-page th,
      .docs-editor-workspace .editor-page blockquote {
        overflow-wrap: anywhere;
      }
    `}</style>
  );
}
