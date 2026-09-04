'use client';

import { useEffect } from 'react';

const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,div';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function selectionRangeInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
  return range;
}

function blockForNode(editor: HTMLElement, node: Node) {
  let element: HTMLElement | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
  const block = element?.closest<HTMLElement>(BLOCK_SELECTOR) ?? null;
  return block && block !== editor && editor.contains(block) ? block : null;
}

function cloneBlockShell(block: HTMLElement) {
  const clone = block.cloneNode(false) as HTMLElement;
  clone.removeAttribute('id');
  return clone;
}

function appendPlainLine(block: HTMLElement, line: string) {
  if (line) block.appendChild(document.createTextNode(line));
  else block.appendChild(document.createElement('br'));
}

function placeCaretAtMarker(selection: Selection, marker: Text) {
  const nextRange = document.createRange();
  nextRange.setStartAfter(marker);
  nextRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  marker.remove();
}

function insertMultilineIntoSingleBlock(editor: HTMLElement, selection: Selection, range: Range, block: HTMLElement, lines: string[]) {
  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(block);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  const before = beforeRange.cloneContents();

  const afterRange = document.createRange();
  afterRange.selectNodeContents(block);
  afterRange.setStart(range.endContainer, range.endOffset);
  const after = afterRange.cloneContents();

  const replacement: HTMLElement[] = [];
  const first = cloneBlockShell(block);
  first.appendChild(before);
  appendPlainLine(first, lines[0] ?? '');
  replacement.push(first);

  for (let index = 1; index < lines.length - 1; index += 1) {
    const paragraph = document.createElement('p');
    appendPlainLine(paragraph, lines[index] ?? '');
    replacement.push(paragraph);
  }

  const last = cloneBlockShell(block);
  appendPlainLine(last, lines[lines.length - 1] ?? '');
  const marker = document.createTextNode('');
  last.appendChild(marker);
  last.appendChild(after);
  replacement.push(last);

  block.replaceWith(...replacement);
  editor.focus({ preventScroll: true });
  placeCaretAtMarker(selection, marker);
}

function insertMultilineAtRoot(editor: HTMLElement, selection: Selection, range: Range, lines: string[]) {
  range.deleteContents();
  const fragment = document.createDocumentFragment();
  const marker = document.createTextNode('');

  lines.forEach((line, index) => {
    const paragraph = document.createElement('p');
    appendPlainLine(paragraph, line);
    if (index === lines.length - 1) paragraph.appendChild(marker);
    fragment.appendChild(paragraph);
  });

  range.insertNode(fragment);
  editor.focus({ preventScroll: true });
  placeCaretAtMarker(selection, marker);
}

function insertPlainText(editor: HTMLElement, text: string) {
  editor.focus({ preventScroll: true });

  const selection = window.getSelection();
  const range = selectionRangeInside(editor);
  const normalized = text.replace(/\r\n?/g, '\n');

  if (!selection || !range) {
    document.execCommand('insertText', false, normalized);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new CustomEvent('fwo:rich-paste', { bubbles: true }));
    return;
  }

  if (!normalized.includes('\n')) {
    range.deleteContents();
    const node = document.createTextNode(normalized);
    range.insertNode(node);
    const nextRange = document.createRange();
    nextRange.setStartAfter(node);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
  } else {
    const lines = normalized.split('\n');
    const startBlock = blockForNode(editor, range.startContainer);
    const endBlock = blockForNode(editor, range.endContainer);

    if (startBlock && startBlock === endBlock) {
      insertMultilineIntoSingleBlock(editor, selection, range, startBlock, lines);
    } else if (!startBlock && !endBlock) {
      insertMultilineAtRoot(editor, selection, range, lines);
    } else {
      // Cross-block replacement is uncommon. Let the browser perform the deletion,
      // then insert DOC321-generated paragraph markup rather than clipboard HTML.
      const html = lines.map((line) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        return paragraph.outerHTML;
      }).join('');
      document.execCommand('insertHTML', false, html);
    }
  }

  editor.dispatchEvent(new Event('input', { bubbles: true }));
  // Pagination/editor listeners already use this compatibility event.
  editor.dispatchEvent(new CustomEvent('fwo:rich-paste', { bubbles: true }));
}

/**
 * DOC321 Word paste policy:
 * - every paste is plain text only
 * - source fonts, sizes, colors, highlights and styles are removed
 * - tables, borders, horizontal rules, images, backgrounds and layout markup are removed
 * - pasted line/paragraph breaks become real editable paragraph boundaries
 *
 * Real paragraph boundaries keep Heading/Title changes isolated from the text
 * immediately above and below the selected pasted line.
 */
export function WordRichPaste() {
  useEffect(() => {
    const editor = editorElement();
    if (!editor) return;

    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as Node | null;
      if (!target || !editor.contains(target)) return;
      if (editor.contentEditable === 'false') return;

      const text = event.clipboardData?.getData('text/plain');
      if (text == null) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      insertPlainText(editor, text);
    };

    editor.addEventListener('paste', onPaste, true);
    return () => editor.removeEventListener('paste', onPaste, true);
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
    `}</style>
  );
}
