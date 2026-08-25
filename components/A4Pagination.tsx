'use client';

import { useEffect } from 'react';

const PAGE_SELECTOR = ':scope > .fwo-page-sheet';

function makePage() {
  const page = document.createElement('div');
  page.className = 'fwo-page-sheet';
  page.setAttribute('data-fwo-page', 'true');
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

/** Turns the editable document into real, independently bounded A4 sheets. */
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
      const caret = caretOffset(root);
      const existingPages = Array.from(root.querySelectorAll<HTMLElement>(PAGE_SELECTOR));
      const nodes = existingPages.length
        ? existingPages.flatMap((page) => Array.from(page.childNodes))
        : Array.from(root.childNodes);

      // Empty text nodes between pages are layout artefacts, not document content.
      const content = nodes.filter((node) => node.nodeType !== Node.TEXT_NODE || Boolean(node.textContent?.trim()));
      root.replaceChildren();
      let page = makePage();
      root.append(page);

      for (let index = 0; index < content.length; index += 1) {
        const node = content[index];
        page.append(node);
        if (page.scrollHeight <= page.clientHeight + 1) continue;
        // Split a very large plain paragraph (common after a multi-page paste) at a word boundary.
        if (page.childNodes.length === 1 && node instanceof HTMLElement && !node.querySelector('img,table,ul,ol')) {
          const words = (node.textContent ?? '').split(/(\s+)/);
          if (words.length > 2) {
            let low = 1;
            let high = words.length;
            while (low < high) {
              const middle = Math.ceil((low + high) / 2);
              node.textContent = words.slice(0, middle).join('');
              if (page.scrollHeight <= page.clientHeight + 1) low = middle;
              else high = middle - 1;
            }
            node.textContent = words.slice(0, low).join('');
            const continuation = node.cloneNode(false) as HTMLElement;
            continuation.textContent = words.slice(low).join('').replace(/^\s+/, '');
            if (continuation.textContent) content.splice(index + 1, 0, continuation);
            continue;
          }
          // Keep an intrinsically oversized object on one sheet rather than making a blank page.
          continue;
        }
        page.removeChild(node);
        page = makePage();
        root.append(page);
        page.append(node);
      }

      if (!content.length) page.innerHTML = '<p><br></p>';
      restoreCaret(root, caret);
      root.dataset.pageCount = String(root.querySelectorAll(PAGE_SELECTOR).length);
      root.dispatchEvent(new CustomEvent('fwo:pages', { bubbles: true }));
      observer.observe(root, { childList: true });
      paginating = false;
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paginate);
    };
    observer.observe(root, { childList: true });
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
