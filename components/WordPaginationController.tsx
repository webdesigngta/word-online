'use client';

import { useEffect } from 'react';

const PAGE_CLASS = 'fwo-page-sheet';
const FIXED_SELECTOR = '[data-fwo-header],[data-fwo-footer]';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function isPage(node: Node): node is HTMLDivElement {
  return node instanceof HTMLDivElement && node.classList.contains(PAGE_CLASS);
}

function makePage() {
  const page = document.createElement('div');
  page.className = PAGE_CLASS;
  page.setAttribute('data-fwo-page', 'true');
  return page;
}

function directPages(root: HTMLElement) {
  return Array.from(root.children).filter(isPage);
}

function ensurePageStructure(root: HTMLElement) {
  const children = Array.from(root.childNodes);
  const existing = directPages(root);

  if (!existing.length) {
    const page = makePage();
    root.appendChild(page);
    children.forEach((node) => {
      if (node !== page) page.appendChild(node);
    });
    if (!page.childNodes.length) page.innerHTML = '<p><br></p>';
    return [page];
  }

  // Any loose root nodes left by a paste/import belong inside the nearest page,
  // never alongside the A4 page wrappers.
  let current = existing[0];
  for (const node of children) {
    if (isPage(node)) {
      current = node;
      continue;
    }
    current.appendChild(node);
  }

  return directPages(root);
}

function px(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function contentLimit(page: HTMLElement) {
  const rect = page.getBoundingClientRect();
  const style = getComputedStyle(page);
  return rect.bottom - px(style.paddingBottom) - px(style.borderBottomWidth);
}

function nodeBottom(node: Node) {
  if (node instanceof HTMLElement && node.tagName !== 'BR') return node.getBoundingClientRect().bottom;
  const range = document.createRange();
  try {
    range.selectNode(node);
    const rects = Array.from(range.getClientRects());
    return rects[rects.length - 1]?.bottom ?? range.getBoundingClientRect().bottom;
  } finally {
    range.detach?.();
  }
}

function contentNodes(page: HTMLElement) {
  return Array.from(page.childNodes).filter((node) => {
    if (node instanceof HTMLElement && node.matches(FIXED_SELECTOR)) return false;
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) return false;
    return true;
  });
}

function pageOverflows(page: HTMLElement) {
  if (page.clientHeight > 0 && page.scrollHeight > page.clientHeight + 1) return true;
  const nodes = contentNodes(page);
  const last = nodes[nodes.length - 1];
  return Boolean(last && nodeBottom(last) > contentLimit(page) + 1);
}

function firstContentPoint(page: HTMLElement) {
  return Array.from(page.childNodes).find((node) => {
    return !(node instanceof HTMLElement && node.matches('[data-fwo-header]'));
  }) ?? null;
}

function prepend(page: HTMLElement, node: Node) {
  page.insertBefore(node, firstContentPoint(page));
}

function textLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return (node as Text).data.length;
  let total = 0;
  node.childNodes.forEach((child) => { total += textLength(child); });
  return total;
}

function boundaryAtOffset(root: HTMLElement, target: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let current = walker.nextNode();
  let last: Text | null = null;

  while (current) {
    const text = current as Text;
    last = text;
    const next = consumed + text.data.length;
    if (target <= next) {
      return { node: text, offset: Math.max(0, Math.min(text.data.length, target - consumed)) };
    }
    consumed = next;
    current = walker.nextNode();
  }
  return last ? { node: last, offset: last.data.length } : null;
}

function rangeBottom(range: Range) {
  const rects = Array.from(range.getClientRects());
  return rects[rects.length - 1]?.bottom ?? range.getBoundingClientRect().bottom;
}

function nearestWordOffset(element: HTMLElement, offset: number) {
  const text = element.textContent ?? '';
  if (offset <= 1 || offset >= text.length) return offset;
  const before = text.slice(0, offset);
  const boundary = Math.max(before.lastIndexOf(' '), before.lastIndexOf('\n'), before.lastIndexOf('\t'));
  return boundary >= Math.max(1, offset - 80) ? boundary + 1 : offset;
}

function splitElement(page: HTMLElement, nextPage: HTMLElement, element: HTMLElement) {
  if (element.matches('table,img,video,canvas,svg')) return false;
  const total = textLength(element);
  if (total <= 1) return false;

  const limit = contentLimit(page);
  let low = 1;
  let high = total - 1;
  let best = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const boundary = boundaryAtOffset(element, middle);
    if (!boundary) break;
    const range = document.createRange();
    range.setStart(element, 0);
    range.setEnd(boundary.node, boundary.offset);
    const fits = rangeBottom(range) <= limit + 1;
    range.detach?.();
    if (fits) {
      best = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  best = nearestWordOffset(element, best);
  if (best <= 0 || best >= total) return false;
  const boundary = boundaryAtOffset(element, best);
  if (!boundary) return false;

  const tail = document.createRange();
  tail.setStart(boundary.node, boundary.offset);
  tail.setEnd(element, element.childNodes.length);
  const fragment = tail.extractContents();
  tail.detach?.();
  if (!fragment.childNodes.length) return false;

  const continuation = element.cloneNode(false) as HTMLElement;
  continuation.removeAttribute('id');
  continuation.dataset.fwoBlockContinuation = 'true';
  continuation.appendChild(fragment);
  prepend(nextPage, continuation);
  return true;
}

function selectionSnapshot(root: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.anchorNode || !selection.focusNode) return null;
  if (!root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) return null;
  return {
    anchorNode: selection.anchorNode,
    anchorOffset: selection.anchorOffset,
    focusNode: selection.focusNode,
    focusOffset: selection.focusOffset,
  };
}

function validOffset(node: Node, offset: number) {
  return node.nodeType === Node.TEXT_NODE
    ? offset >= 0 && offset <= (node as Text).data.length
    : offset >= 0 && offset <= node.childNodes.length;
}

function restoreSelection(root: HTMLElement, snapshot: ReturnType<typeof selectionSnapshot>) {
  if (!snapshot) return;
  const selection = window.getSelection();
  if (!selection || typeof selection.setBaseAndExtent !== 'function') return;
  if (!root.contains(snapshot.anchorNode) || !root.contains(snapshot.focusNode)) return;
  if (!validOffset(snapshot.anchorNode, snapshot.anchorOffset) || !validOffset(snapshot.focusNode, snapshot.focusOffset)) return;
  try {
    selection.setBaseAndExtent(snapshot.anchorNode, snapshot.anchorOffset, snapshot.focusNode, snapshot.focusOffset);
  } catch {
    // A split can replace one boundary. Keeping the current caret is safer.
  }
}

function flow(root: HTMLElement) {
  let pages = ensurePageStructure(root);
  const snapshot = selectionSnapshot(root);
  let changed = false;
  let index = 0;
  let guard = 0;

  while (index < pages.length && guard < 1500) {
    const page = pages[index];

    while (pageOverflows(page) && guard < 1500) {
      guard += 1;
      let nextPage = pages[index + 1];
      if (!nextPage) {
        nextPage = makePage();
        page.insertAdjacentElement('afterend', nextPage);
        pages = directPages(root);
      }

      const movable = contentNodes(page);
      if (!movable.length) break;

      if (movable.length === 1) {
        const only = movable[0];
        if (only instanceof HTMLElement && splitElement(page, nextPage, only)) {
          changed = true;
          continue;
        }
        break;
      }

      prepend(nextPage, movable[movable.length - 1]);
      changed = true;
    }

    index += 1;
    pages = directPages(root);
  }

  root.dataset.pageCount = String(pages.length);
  if (changed) restoreSelection(root, snapshot);
  root.dispatchEvent(new CustomEvent('fwo:pages', { bubbles: true }));
}

/**
 * Single deterministic A4 flow owner used by Word Online.
 * It repairs restored drafts, large plain-text paste, heading-size changes and
 * loose imported nodes without waiting for a reload.
 */
export function WordPaginationController() {
  useEffect(() => {
    const root = editorElement();
    if (!root) return;

    let running = false;
    let frame = 0;
    let secondFrame = 0;
    let timer = 0;

    const run = () => {
      if (running) return;
      running = true;
      try {
        flow(root);
      } finally {
        running = false;
      }
    };

    const schedule = (delay = 0) => {
      if (delay) {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => schedule(), delay);
        return;
      }
      cancelAnimationFrame(frame);
      cancelAnimationFrame(secondFrame);
      frame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(run);
      });
    };

    const observer = new MutationObserver(() => {
      if (!running) schedule();
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    const afterPaste = () => {
      schedule();
      window.setTimeout(run, 60);
      window.setTimeout(run, 180);
      window.setTimeout(run, 420);
    };
    const onInput = () => schedule();
    const onForce = () => afterPaste();
    const onResize = () => schedule(50);

    root.addEventListener('paste', afterPaste, true);
    root.addEventListener('fwo:rich-paste', afterPaste);
    root.addEventListener('fwo:force-pagination', onForce);
    root.addEventListener('input', onInput);
    window.addEventListener('resize', onResize);

    schedule();
    window.setTimeout(run, 80);
    window.setTimeout(run, 260);
    window.setTimeout(run, 700);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(timer);
      observer.disconnect();
      root.removeEventListener('paste', afterPaste, true);
      root.removeEventListener('fwo:rich-paste', afterPaste);
      root.removeEventListener('fwo:force-pagination', onForce);
      root.removeEventListener('input', onInput);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
