'use client';

import { useEffect } from 'react';

const PAGE_SELECTOR = ':scope > .fwo-page-sheet';
const LEGACY_PAGE_BREAK_SELECTOR = '[data-fwo-page-break]';

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

    // Moving the existing node preserves its text nodes, formatting, live Range
    // boundaries, and undo semantics. Nothing is cloned or recreated here.
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

    const onInput = () => {
      // Normal text edits stay completely untouched. Only repair the wrapper if
      // the browser/importer placed a new block directly under the editor root.
      if (!composing && needsPageNormalization(root)) schedule();
    };

    const onCompositionStart = () => {
      composing = true;
      cancelAnimationFrame(frame);
    };

    const onCompositionEnd = () => {
      composing = false;
      if (needsPageNormalization(root)) schedule();
    };

    observer.observe(root, { childList: true, subtree: true, characterData: true });
    root.addEventListener('input', onInput);
    root.addEventListener('compositionstart', onCompositionStart);
    root.addEventListener('compositionend', onCompositionEnd);

    // Initial content and asynchronously restored drafts may begin unwrapped.
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener('input', onInput);
      root.removeEventListener('compositionstart', onCompositionStart);
      root.removeEventListener('compositionend', onCompositionEnd);
    };
  }, []);

  return null;
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
