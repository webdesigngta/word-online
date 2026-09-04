'use client';

import { useEffect } from 'react';

const PAGE_CLASS = 'fwo-page-sheet';
const FIXED_NODE_SELECTOR = '[data-fwo-header],[data-fwo-footer]';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function directPages(root: HTMLElement) {
  return Array.from(root.children).filter(
    (node): node is HTMLDivElement => node instanceof HTMLDivElement && node.classList.contains(PAGE_CLASS),
  );
}

function makePage(after: HTMLElement) {
  const page = document.createElement('div');
  page.className = PAGE_CLASS;
  page.setAttribute('data-fwo-page', 'true');
  after.insertAdjacentElement('afterend', page);
  return page;
}

function pixels(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
    if (node instanceof HTMLElement && node.matches(FIXED_NODE_SELECTOR)) return false;
    if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) return false;
    return true;
  });
}

function lastContentNode(page: HTMLElement) {
  const nodes = contentNodes(page);
  return nodes[nodes.length - 1] ?? null;
}

function contentLimit(page: HTMLElement) {
  const rect = page.getBoundingClientRect();
  const style = getComputedStyle(page);
  return rect.bottom - pixels(style.paddingBottom) - pixels(style.borderBottomWidth);
}

function pageOverflows(page: HTMLElement) {
  // scrollHeight is the most reliable signal for fixed-height A4 sheets with
  // overflow:hidden. The geometry fallback also catches margin/line-box cases.
  if (page.clientHeight > 0 && page.scrollHeight > page.clientHeight + 2) return true;
  const last = lastContentNode(page);
  return Boolean(last && nodeBottom(last) > contentLimit(page) + 1);
}

function insertionPoint(page: HTMLElement) {
  return Array.from(page.childNodes).find((node) => {
    return !(node instanceof HTMLElement && node.matches('[data-fwo-header]'));
  }) ?? null;
}

function prependContent(page: HTMLElement, node: Node) {
  page.insertBefore(node, insertionPoint(page));
}

function rangeBottom(range: Range) {
  const rects = Array.from(range.getClientRects());
  return rects[rects.length - 1]?.bottom ?? range.getBoundingClientRect().bottom;
}

function textLength(root: Node): number {
  if (root.nodeType === Node.TEXT_NODE) return (root as Text).data.length;
  let total = 0;
  root.childNodes.forEach((child) => { total += textLength(child); });
  return total;
}

function boundaryAtTextOffset(root: HTMLElement, target: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let node = walker.nextNode();
  let last: Text | null = null;
  while (node) {
    const text = node as Text;
    last = text;
    const next = consumed + text.data.length;
    if (target <= next) {
      return { node: text, offset: Math.max(0, Math.min(text.data.length, target - consumed)) };
    }
    consumed = next;
    node = walker.nextNode();
  }
  return last ? { node: last, offset: last.data.length } : null;
}

function nearestWordOffset(element: HTMLElement, offset: number) {
  const text = element.textContent ?? '';
  if (offset <= 1 || offset >= text.length) return offset;
  const before = text.slice(0, offset);
  const boundary = Math.max(before.lastIndexOf(' '), before.lastIndexOf('\n'), before.lastIndexOf('\t'));
  return boundary >= Math.max(1, offset - 80) ? boundary + 1 : offset;
}

function splitOversizedElement(page: HTMLElement, nextPage: HTMLElement, element: HTMLElement) {
  if (element.matches('table,img,video,canvas,svg')) return false;
  const total = textLength(element);
  if (total <= 1) return false;

  const limit = contentLimit(page);
  let low = 1;
  let high = total - 1;
  let best = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const boundary = boundaryAtTextOffset(element, middle);
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
  const boundary = boundaryAtTextOffset(element, best);
  if (!boundary) return false;

  const tailRange = document.createRange();
  tailRange.setStart(boundary.node, boundary.offset);
  tailRange.setEnd(element, element.childNodes.length);
  const fragment = tailRange.extractContents();
  tailRange.detach?.();
  if (!fragment.childNodes.length) return false;

  const continuation = element.cloneNode(false) as HTMLElement;
  continuation.removeAttribute('id');
  continuation.dataset.fwoBlockContinuation = 'true';
  continuation.append(fragment);
  prependContent(nextPage, continuation);
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
  if (node.nodeType === Node.TEXT_NODE) return offset >= 0 && offset <= (node as Text).data.length;
  return offset >= 0 && offset <= node.childNodes.length;
}

function restoreSelection(root: HTMLElement, snapshot: ReturnType<typeof selectionSnapshot>) {
  if (!snapshot) return;
  const selection = window.getSelection();
  if (!selection || typeof selection.setBaseAndExtent !== 'function') return;
  if (!root.contains(snapshot.anchorNode) || !root.contains(snapshot.focusNode)) return;
  if (!validOffset(snapshot.anchorNode, snapshot.anchorOffset) || !validOffset(snapshot.focusNode, snapshot.focusOffset)) return;
  try {
    selection.setBaseAndExtent(
      snapshot.anchorNode,
      snapshot.anchorOffset,
      snapshot.focusNode,
      snapshot.focusOffset,
    );
  } catch {
    // Keep the browser's current caret if a very long block had to be split.
  }
}

function flowPages(root: HTMLElement) {
  let pages = directPages(root);
  if (!pages.length) return false;
  if (!pages.some(pageOverflows)) return false;

  const snapshot = selectionSnapshot(root);
  let changed = false;
  let index = 0;
  let guard = 0;

  while (index < pages.length && guard < 1000) {
    guard += 1;
    const page = pages[index];

    while (pageOverflows(page) && guard < 1000) {
      guard += 1;
      let nextPage = pages[index + 1];
      if (!nextPage) {
        nextPage = makePage(page);
        pages = directPages(root);
      }

      const movable = contentNodes(page);
      if (!movable.length) break;

      if (movable.length === 1) {
        const only = movable[0];
        if (only instanceof HTMLElement && splitOversizedElement(page, nextPage, only)) {
          changed = true;
          continue;
        }
        break;
      }

      prependContent(nextPage, movable[movable.length - 1]);
      changed = true;
    }

    index += 1;
    pages = directPages(root);
  }

  if (changed) {
    root.dataset.pageCount = String(pages.length);
    restoreSelection(root, snapshot);
    root.dispatchEvent(new CustomEvent('fwo:pages', { bubbles: true }));
  }
  return changed;
}

/**
 * Secondary safety net for A4 flow. The primary paginator remains responsible
 * for normal page structure; this guard only acts when a fixed A4 sheet is
 * actually overflowing. That makes large paste, restored drafts and heading
 * size changes paginate immediately without rebuilding the editor on every key.
 */
export function WordPageFlowGuard() {
  useEffect(() => {
    const root = editorElement();
    if (!root) return;

    let frame = 0;
    let secondFrame = 0;
    let timer = 0;
    let running = false;

    const run = () => {
      if (running) return;
      running = true;
      try {
        flowPages(root);
      } finally {
        running = false;
      }
    };

    const schedule = (delay = 0) => {
      if (delay > 0) {
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

    const onRichPaste = () => {
      schedule();
      window.setTimeout(run, 90);
      window.setTimeout(run, 260);
    };
    const onInput = () => schedule();
    const onResize = () => schedule(40);

    root.addEventListener('fwo:rich-paste', onRichPaste);
    root.addEventListener('input', onInput);
    window.addEventListener('resize', onResize);

    // Also repairs an already-saved one-page draft immediately after load.
    schedule();
    window.setTimeout(run, 120);
    window.setTimeout(run, 420);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(secondFrame);
      window.clearTimeout(timer);
      observer.disconnect();
      root.removeEventListener('fwo:rich-paste', onRichPaste);
      root.removeEventListener('input', onInput);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return null;
}
