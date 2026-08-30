'use client';

import { useEffect } from 'react';

function editorRoot() {
  return document.querySelector<HTMLElement>('.editor-page[contenteditable]');
}

function pageForRange(range: Range, root: HTMLElement) {
  const start = range.startContainer instanceof HTMLElement
    ? range.startContainer
    : range.startContainer.parentElement;
  return start?.closest<HTMLElement>('.fwo-page-sheet') ?? root;
}

function isProtectedRegion(node: Node) {
  const element = node instanceof HTMLElement ? node : node.parentElement;
  return Boolean(element?.closest('[data-fwo-header],[data-fwo-footer]'));
}

function makePageBreakMarker() {
  const marker = document.createElement('div');
  marker.setAttribute('data-fwo-page-break', 'true');
  marker.setAttribute('contenteditable', 'false');
  marker.setAttribute('aria-label', 'Page break');
  marker.innerHTML = '<span>Page break</span>';
  return marker;
}

function makeEmptyParagraph() {
  const paragraph = document.createElement('p');
  paragraph.innerHTML = '<br>';
  return paragraph;
}

function setCaretAtStart(root: HTMLElement, target: Node) {
  const range = document.createRange();
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const text = walker.nextNode();

  if (text) {
    range.setStart(text, 0);
  } else if (target instanceof HTMLElement) {
    range.selectNodeContents(target);
  } else {
    range.setStartBefore(target);
  }

  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  root.focus({ preventScroll: true });
}

/**
 * Makes Ctrl/Command + Enter a stable block-level page break.
 *
 * The previous implementation inserted a DIV directly into the active paragraph.
 * Browsers then repaired the invalid paragraph structure differently, which could
 * create stacked outlines and repeated-looking page-break boxes. This version
 * splits the document at the live caret with a Range, keeps the marker as a direct
 * child of the current page, and restores the caret to the content after the break.
 */
export function PageBreakKeyboardPolish() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key !== 'Enter') return;

      const root = editorRoot();
      const selection = window.getSelection();
      if (!root || !selection?.rangeCount) return;

      const current = selection.getRangeAt(0);
      if (!root.contains(current.startContainer) || !root.contains(current.endContainer)) return;
      if (isProtectedRegion(current.startContainer)) return;

      event.preventDefault();
      event.stopPropagation();

      const caret = current.cloneRange();
      if (!caret.collapsed) caret.deleteContents();
      caret.collapse(true);

      const page = pageForRange(caret, root);
      const tailRange = document.createRange();
      tailRange.setStart(caret.startContainer, caret.startOffset);
      tailRange.setEnd(page, page.childNodes.length);
      const tail = tailRange.extractContents();
      const marker = makePageBreakMarker();
      page.append(marker);

      let caretTarget = tail.firstChild;
      if (caretTarget) {
        page.append(tail);
      } else {
        const paragraph = makeEmptyParagraph();
        page.append(paragraph);
        caretTarget = paragraph;
      }

      const renderedPages = root.querySelectorAll(':scope > .fwo-page-sheet').length;
      const explicitPages = root.querySelectorAll('[data-fwo-page-break]').length + 1;
      root.dataset.pageCount = String(Math.max(1, renderedPages, explicitPages));

      setCaretAtStart(root, caretTarget);
      root.dispatchEvent(new Event('input', { bubbles: true }));
      root.dispatchEvent(new CustomEvent('fwo:pages', { bubbles: true }));
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return (
    <style jsx global>{`
      /* Google-Docs-like visual page break: a single quiet divider across the full sheet. */
      .editor-route .editor-page [data-fwo-page-break] {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: calc(100% + (2 * var(--paper-padding)));
        height: 48px;
        margin: 26px calc(-1 * var(--paper-padding));
        border-top: 1px solid #c9cdd3;
        border-bottom: 1px solid #c9cdd3;
        background: #f1f3f4;
        break-after: page;
        page-break-after: always;
        cursor: default;
        user-select: none;
      }

      .editor-route .editor-page [data-fwo-page-break]::before {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 1px;
        background: #c7cbd1;
        transform: translateY(-0.5px);
      }

      .editor-route .editor-page [data-fwo-page-break] span {
        position: relative;
        left: auto;
        top: auto;
        transform: none;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 22px;
        padding: 2px 10px;
        border: 1px solid #d9dde2;
        border-radius: 999px;
        background: #fff;
        color: #6f757d;
        font: 500 10px/16px Arial, Helvetica, sans-serif;
        white-space: nowrap;
        box-shadow: 0 1px 1px rgba(60, 64, 67, .04);
      }

      @media print {
        .editor-route .editor-page [data-fwo-page-break] {
          display: block;
          width: auto;
          height: 0;
          margin: 0;
          border: 0;
          background: transparent;
        }

        .editor-route .editor-page [data-fwo-page-break]::before,
        .editor-route .editor-page [data-fwo-page-break] span {
          display: none;
        }
      }
    `}</style>
  );
}
