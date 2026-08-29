'use client';

import { useEffect } from 'react';

const PAGE_SELECTOR = ':scope > .fwo-page-sheet';

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

function pageOverflows(page: HTMLElement) {
  return page.scrollHeight > page.clientHeight + 1;
}

function canSplitAcrossPages(node: Node): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false;
  if (!node.textContent?.trim()) return false;
  if (node.matches('img,table,ul,ol,figure,pre,hr')) return false;
  return !node.querySelector('img,table,ul,ol,figure,pre');
}

function fitTextAcrossPages(root: HTMLElement, startPage: HTMLDivElement, source: HTMLElement): HTMLDivElement {
  let page = startPage;
  let remaining = source.textContent ?? '';

  while (remaining) {
    const before = remaining;
    const piece = source.cloneNode(false) as HTMLElement;
    page.append(piece);

    let low = 1;
    let high = remaining.length;
    let best = 0;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      piece.textContent = remaining.slice(0, middle);
      if (!pageOverflows(page)) {
        best = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    if (best === 0) {
      piece.remove();

      // If this sheet already contains earlier content, continue on a fresh A4 page
      // and measure the same remaining text again there.
      if (page.childNodes.length) {
        page = appendPage(root);
        continue;
      }

      // A pathological unbreakable element should not lock the pagination loop.
      // Keep it on one page and allow later document blocks to continue after it.
      piece.textContent = remaining;
      page.append(piece);
      remaining = '';
      break;
    }

    let cut = best;
    if (cut < remaining.length) {
      const boundary = Math.max(
        remaining.lastIndexOf(' ', cut),
        remaining.lastIndexOf('\n', cut),
        remaining.lastIndexOf('\t', cut),
      );
      if (boundary > Math.floor(cut * 0.6)) cut = boundary + 1;
    }

    piece.textContent = remaining.slice(0, cut).replace(/\s+$/u, '');
    remaining = remaining.slice(cut).replace(/^\s+/u, '');

    // Safety is based on forward progress, not a page-count ceiling.
    if (remaining === before) {
      remaining = '';
      break;
    }

    if (remaining) page = appendPage(root);
  }

  return page;
}

function caretOffset(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !root.contains(selection.anchorNode)) return null;
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(selection.anchorNode!, selection.anchorOffset);
  return range.toString().length;
}

function restoreCaret(root: HTMLElement, offset: number | null) {
  if (offset === null) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    remaining -= length;
  }
}

/** Turns the editable document into as many independently bounded A4 sheets as the content requires. */
export function A4Pagination() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.editor-page');
    if (!root) return;
    let frame = 0;
    let paginating = false;
    const observer = new MutationObserver(() => schedule());

    const paginate = () => {
      if (paginating) return;
      paginating = true;
      observer.disconnect();

      try {
        const caret = caretOffset(root);
        const existingPages = Array.from(root.querySelectorAll<HTMLDivElement>(PAGE_SELECTOR));
        const nodes = existingPages.length
          ? existingPages.flatMap((page) => Array.from(page.childNodes))
          : Array.from(root.childNodes);

        // Empty text nodes between pages are layout artefacts, not document content.
        const content = nodes.filter((node) => node.nodeType !== Node.TEXT_NODE || Boolean(node.textContent?.trim()));
        root.replaceChildren();
        let page: HTMLDivElement = appendPage(root);

        for (const node of content) {
          page.append(node);
          if (!pageOverflows(page)) continue;

          node.remove();

          if (canSplitAcrossPages(node)) {
            page = fitTextAcrossPages(root, page, node);
            continue;
          }

          if (page.childNodes.length) page = appendPage(root);
          page.append(node);
        }

        if (!content.length) page.innerHTML = '<p><br></p>';
        restoreCaret(root, caret);
        root.dataset.pageCount = String(root.querySelectorAll(PAGE_SELECTOR).length);
        root.dispatchEvent(new CustomEvent('fwo:pages', { bubbles: true }));
      } finally {
        observer.observe(root, { childList: true, subtree: true, characterData: true });
        paginating = false;
      }
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paginate);
    };

    observer.observe(root, { childList: true, subtree: true, characterData: true });
    root.addEventListener('input', schedule);
    window.addEventListener('resize', schedule);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener('input', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return null;
}

/** Removes visual page containers while retaining the original document blocks. */
export function serializableEditorHtml(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;
  const pages = Array.from(clone.querySelectorAll<HTMLElement>(PAGE_SELECTOR));
  if (!pages.length) return clone.innerHTML;
  const fragment = document.createDocumentFragment();
  pages.forEach((page) => fragment.append(...Array.from(page.childNodes)));
  clone.replaceChildren(fragment);
  return clone.innerHTML;
}
