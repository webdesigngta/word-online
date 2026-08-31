'use client';

import { useEffect } from 'react';

const PAGE_SELECTOR = ':scope > .fwo-page-sheet';
const LEGACY_PAGE_BREAK_SELECTOR = '[data-fwo-page-break]';
const A4_HEIGHT_TO_WIDTH = 297 / 210;

type SelectionSnapshot = {
  range: Range;
  anchorNode: Node | null;
  anchorOffset: number;
  focusNode: Node | null;
  focusOffset: number;
};

function makePage(): HTMLDivElement {
  const page = document.createElement('div');
  page.className = 'fwo-page-sheet';
  page.setAttribute('data-fwo-page', 'true');
  return page;
}

function appendPage(root: HTMLElement): HTMLDivElement {
  const page = makePage();
  root.append(page);
  return page;
}

function isPageNode(node: Node): node is HTMLDivElement {
  return node instanceof HTMLDivElement && node.classList.contains('fwo-page-sheet');
}

function directPages(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLDivElement>(PAGE_SELECTOR));
}

function selectionInside(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;
  const range = selection.getRangeAt(0);
  return root.contains(range.startContainer) && root.contains(range.endContainer);
}

function captureSelection(root: HTMLElement): SelectionSnapshot | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selectionInside(root)) return null;

  return {
    range: selection.getRangeAt(0).cloneRange(),
    anchorNode: selection.anchorNode,
    anchorOffset: selection.anchorOffset,
    focusNode: selection.focusNode,
    focusOffset: selection.focusOffset,
  };
}

function restoreSelection(root: HTMLElement, snapshot: SelectionSnapshot | null) {
  if (!snapshot) return;
  const selection = window.getSelection();
  if (!selection) return;

  try {
    if (
      snapshot.anchorNode
      && snapshot.focusNode
      && root.contains(snapshot.anchorNode)
      && root.contains(snapshot.focusNode)
      && typeof selection.setBaseAndExtent === 'function'
    ) {
      selection.removeAllRanges();
      selection.setBaseAndExtent(
        snapshot.anchorNode,
        snapshot.anchorOffset,
        snapshot.focusNode,
        snapshot.focusOffset,
      );
      return;
    }

    if (
      root.contains(snapshot.range.startContainer)
      && root.contains(snapshot.range.endContainer)
    ) {
      selection.removeAllRanges();
      selection.addRange(snapshot.range);
    }
  } catch {
    // The browser keeps its current native selection if a boundary disappeared.
  }
}

function removeLegacyPageBreaks(root: HTMLElement) {
  const markers = Array.from(root.querySelectorAll<HTMLElement>(LEGACY_PAGE_BREAK_SELECTOR));
  markers.forEach((marker) => marker.remove());
  return markers.length > 0;
}

function needsPageNormalization(root: HTMLElement) {
  if (root.querySelector(LEGACY_PAGE_BREAK_SELECTOR)) return true;
  if (!root.childNodes.length) return true;
  return Array.from(root.childNodes).some((node) => !isPageNode(node));
}

/**
 * Keep the editable DOM stable while the user types.
 *
 * Older pagination rebuilt the complete contenteditable tree on every input.
 * That invalidated native browser caret positions at structural boundaries,
 * especially after Enter, replacing a selection, Backspace/Delete, or moving
 * between an empty paragraph and surrounding text. Shift+Enter appeared to work
 * more often only because it inserts a BR inside the existing block.
 *
 * This normalizer only wraps root-level document nodes when wrapping is actually
 * required. Existing page wrappers and their descendants are never torn down
 * during normal typing, so browser editing semantics remain native and stable.
 */
function normalizePageStructure(root: HTMLElement) {
  const children = Array.from(root.childNodes);
  let currentPage: HTMLDivElement | null = null;

  for (const node of children) {
    if (isPageNode(node)) {
      currentPage = node;
      continue;
    }

    if (!currentPage) {
      currentPage = makePage();
      root.insertBefore(currentPage, node);
    }

    currentPage.append(node);
  }

  const pages = directPages(root);
  if (!pages.length) {
    const page = appendPage(root);
    page.innerHTML = '<p><br></p>';
    return [page];
  }

  return pages;
}

function pixels(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function targetPageHeight(page: HTMLElement, root: HTMLElement) {
  const pageRect = page.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const width = Math.max(1, pageRect.width || rootRect.width || 794);
  const computed = window.getComputedStyle(page);
  const minHeight = pixels(computed.minHeight);
  return Math.max(minHeight, width * A4_HEIGHT_TO_WIDTH);
}

function nodeBottom(node: Node) {
  if (node instanceof HTMLElement) return node.getBoundingClientRect().bottom;
  const range = document.createRange();
  range.selectNode(node);
  const rect = range.getBoundingClientRect();
  range.detach?.();
  return rect.bottom;
}

function lastRenderedNode(page: HTMLElement) {
  const nodes = Array.from(page.childNodes).reverse();
  return nodes.find((node) => {
    if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent?.trim());
    return node instanceof HTMLElement && !node.matches('[data-fwo-header],[data-fwo-footer]');
  }) ?? null;
}

function pageOverflows(page: HTMLElement, root: HTMLElement) {
  const last = lastRenderedNode(page);
  if (!last) return false;
  const rect = page.getBoundingClientRect();
  const computed = window.getComputedStyle(page);
  const bottomPadding = pixels(computed.paddingBottom);
  const limit = rect.top + targetPageHeight(page, root) - bottomPadding;
  return nodeBottom(last) > limit + 1;
}

function movableContentNodes(page: HTMLElement) {
  return Array.from(page.childNodes).filter((node) => {
    if (node instanceof HTMLElement && node.matches('[data-fwo-header],[data-fwo-footer]')) return false;
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) return false;
    return true;
  });
}

function splitTrailingListItem(page: HTMLElement, nextPage: HTMLElement) {
  const last = lastRenderedNode(page);
  if (!(last instanceof HTMLElement) || !['UL', 'OL'].includes(last.tagName) || last.children.length <= 1) return false;

  let continuation = nextPage.firstElementChild as HTMLElement | null;
  if (!continuation || continuation.tagName !== last.tagName || continuation.dataset.fwoListContinuation !== 'true') {
    continuation = last.cloneNode(false) as HTMLElement;
    continuation.dataset.fwoListContinuation = 'true';
    nextPage.insertBefore(continuation, nextPage.firstChild);
  }

  const item = last.lastElementChild;
  if (!item) return false;
  continuation.insertBefore(item, continuation.firstChild);
  return true;
}

/**
 * A normal keystroke never triggers live re-pagination. Rich paste is different:
 * a large external paste can add dozens of blocks at once. Flow only those
 * overflowing blocks onto additional A4 wrappers so the pasted document does not
 * run outside the white sheet, while keeping native typing/caret behavior stable.
 */
function paginateAfterRichPaste(root: HTMLElement) {
  if (needsPageNormalization(root)) {
    removeLegacyPageBreaks(root);
    normalizePageStructure(root);
  }

  const snapshot = captureSelection(root);
  let pages = directPages(root);
  let index = 0;
  let guard = 0;

  while (index < pages.length && guard < 500) {
    guard += 1;
    const page = pages[index];

    if (!pageOverflows(page, root)) {
      index += 1;
      continue;
    }

    let nextPage = pages[index + 1];
    if (!nextPage) {
      nextPage = appendPage(root);
      pages = directPages(root);
    }

    if (splitTrailingListItem(page, nextPage)) continue;

    const movable = movableContentNodes(page);
    if (movable.length <= 1) {
      // A single unusually tall paragraph is left intact rather than destructively
      // splitting its inline formatting or breaking the user's caret position.
      index += 1;
      continue;
    }

    const node = movable[movable.length - 1];
    nextPage.insertBefore(node, nextPage.firstChild);
  }

  pages = directPages(root);
  pages.forEach((page) => {
    const height = targetPageHeight(page, root);
    page.style.minHeight = `${Math.ceil(height)}px`;
  });

  root.dataset.pageCount = String(pages.length);
  restoreSelection(root, snapshot);
  root.dispatchEvent(new CustomEvent('fwo:pages', { bubbles: true }));
}

/**
 * Provides stable page wrappers without mutating the editable document after
 * every keystroke. This deliberately prioritizes correct Word-like editing
 * semantics over destructive live text splitting.
 */
export function A4Pagination() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.editor-page');
    if (!root) return;

    let frame = 0;
    let pasteFrame = 0;
    let normalizing = false;
    let composing = false;

    const observer = new MutationObserver(() => {
      if (!normalizing && !composing && needsPageNormalization(root)) schedule();
    });

    const normalize = () => {
      if (normalizing || composing || !needsPageNormalization(root)) return;
      normalizing = true;
      observer.disconnect();

      try {
        const selection = captureSelection(root);
        removeLegacyPageBreaks(root);
        const pages = normalizePageStructure(root);
        root.dataset.pageCount = String(pages.length);
        restoreSelection(root, selection);
        root.dispatchEvent(new CustomEvent('fwo:pages', { bubbles: true }));
      } finally {
        observer.observe(root, { childList: true, subtree: true, characterData: true });
        normalizing = false;
      }
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(normalize);
    };

    const schedulePastePagination = () => {
      cancelAnimationFrame(pasteFrame);
      pasteFrame = requestAnimationFrame(() => {
        pasteFrame = requestAnimationFrame(() => paginateAfterRichPaste(root));
      });
    };

    const onInput = () => {
      if (!composing && needsPageNormalization(root)) schedule();
    };

    const onRichPaste = () => {
      if (!composing) schedulePastePagination();
    };

    const onCompositionStart = () => {
      composing = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pasteFrame);
    };

    const onCompositionEnd = () => {
      composing = false;
      if (needsPageNormalization(root)) schedule();
    };

    observer.observe(root, { childList: true, subtree: true, characterData: true });
    root.addEventListener('input', onInput);
    root.addEventListener('fwo:rich-paste', onRichPaste);
    root.addEventListener('compositionstart', onCompositionStart);
    root.addEventListener('compositionend', onCompositionEnd);

    schedule();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pasteFrame);
      observer.disconnect();
      root.removeEventListener('input', onInput);
      root.removeEventListener('fwo:rich-paste', onRichPaste);
      root.removeEventListener('compositionstart', onCompositionStart);
      root.removeEventListener('compositionend', onCompositionEnd);
    };
  }, []);

  return (
    <style jsx global>{`
      .docs-editor-workspace .fwo-page-sheet + .fwo-page-sheet {
        margin-top: 18px;
      }
    `}</style>
  );
}

/** Removes visual page containers while retaining the original document blocks. */
export function serializableEditorHtml(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(LEGACY_PAGE_BREAK_SELECTOR).forEach((marker) => marker.remove());
  const pages = Array.from(clone.querySelectorAll<HTMLElement>(PAGE_SELECTOR));
  if (!pages.length) return clone.innerHTML;
  const fragment = document.createDocumentFragment();
  pages.forEach((page) => fragment.append(...Array.from(page.childNodes)));
  clone.replaceChildren(fragment);
  return clone.innerHTML;
}
