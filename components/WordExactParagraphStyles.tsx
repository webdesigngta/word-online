'use client';

import { useEffect } from 'react';

type StyleValue = 'p' | 'title' | 'subtitle' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type StyleSpec = {
  value: StyleValue;
  label: string;
  tag: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  special?: 'title' | 'subtitle';
};

const STYLES: StyleSpec[] = [
  { value: 'p', label: 'Normal text', tag: 'p' },
  { value: 'title', label: 'Title', tag: 'p', special: 'title' },
  { value: 'subtitle', label: 'Subtitle', tag: 'p', special: 'subtitle' },
  { value: 'h1', label: 'Heading 1', tag: 'h1' },
  { value: 'h2', label: 'Heading 2', tag: 'h2' },
  { value: 'h3', label: 'Heading 3', tag: 'h3' },
  { value: 'h4', label: 'Heading 4', tag: 'h4' },
  { value: 'h5', label: 'Heading 5', tag: 'h5' },
  { value: 'h6', label: 'Heading 6', tag: 'h6' },
];

const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function rangeInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return editor.contains(range.startContainer) && editor.contains(range.endContainer) ? range : null;
}

function blockForNode(editor: HTMLElement, node: Node) {
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node instanceof HTMLElement ? node : null;
  const block = element?.closest<HTMLElement>(BLOCK_SELECTOR) ?? null;
  if (!block || !editor.contains(block) || block.classList.contains('fwo-page-sheet')) return null;
  return block;
}

function hasContent(fragment: DocumentFragment) {
  return Boolean(fragment.textContent?.length || fragment.querySelector('*'));
}

function cloneShell(block: HTMLElement) {
  const clone = block.cloneNode(false) as HTMLElement;
  clone.removeAttribute('id');
  return clone;
}

function clearParagraphPresentation(block: HTMLElement) {
  delete block.dataset.fwoParagraphStyle;
  block.style.removeProperty('font-size');
  block.style.removeProperty('font-weight');
  block.style.removeProperty('color');
  block.style.removeProperty('margin-top');
  block.style.removeProperty('margin-bottom');
}

function applyPresentation(block: HTMLElement, spec: StyleSpec) {
  clearParagraphPresentation(block);
  if (spec.special === 'title') {
    block.dataset.fwoParagraphStyle = 'title';
    block.style.fontSize = '26pt';
    block.style.fontWeight = '500';
    block.style.marginTop = '0.6em';
    block.style.marginBottom = '0.3em';
  } else if (spec.special === 'subtitle') {
    block.dataset.fwoParagraphStyle = 'subtitle';
    block.style.fontSize = '15pt';
    block.style.fontWeight = '400';
    block.style.color = '#5f6368';
    block.style.marginTop = '0.3em';
    block.style.marginBottom = '0.6em';
  }
}

function styledBlock(spec: StyleSpec, source: HTMLElement | null, contents: DocumentFragment) {
  const block = document.createElement(spec.tag);
  if (source) {
    if (source.dir) block.dir = source.dir;
    if (source.style.textAlign) block.style.textAlign = source.style.textAlign;
    if (source.style.marginLeft) block.style.marginLeft = source.style.marginLeft;
    if (source.style.marginRight) block.style.marginRight = source.style.marginRight;
  }
  if (hasContent(contents)) block.appendChild(contents);
  else block.appendChild(document.createElement('br'));
  applyPresentation(block, spec);
  return block;
}

function selectContents(block: HTMLElement) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(block);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function replaceWholeBlock(block: HTMLElement, spec: StyleSpec) {
  const range = document.createRange();
  range.selectNodeContents(block);
  const contents = range.extractContents();
  range.detach?.();
  const replacement = styledBlock(spec, block, contents);
  block.replaceWith(replacement);
  selectContents(replacement);
  return replacement;
}

function applyWithinSingleBlock(editor: HTMLElement, range: Range, block: HTMLElement, spec: StyleSpec) {
  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(block);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  const before = beforeRange.cloneContents();
  beforeRange.detach?.();

  const afterRange = document.createRange();
  afterRange.selectNodeContents(block);
  afterRange.setStart(range.endContainer, range.endOffset);
  const after = afterRange.cloneContents();
  afterRange.detach?.();

  const selected = range.cloneContents();
  const hasBefore = hasContent(before);
  const hasAfter = hasContent(after);

  if (!hasBefore && !hasAfter) return replaceWholeBlock(block, spec);

  const replacements: HTMLElement[] = [];
  if (hasBefore) {
    const beforeBlock = cloneShell(block);
    beforeBlock.appendChild(before);
    replacements.push(beforeBlock);
  }

  const middle = styledBlock(spec, block, selected);
  replacements.push(middle);

  if (hasAfter) {
    const afterBlock = cloneShell(block);
    afterBlock.appendChild(after);
    replacements.push(afterBlock);
  }

  block.replaceWith(...replacements);
  selectContents(middle);
  return middle;
}

function applyLooseSelection(range: Range, spec: StyleSpec) {
  const selected = range.extractContents();
  const block = styledBlock(spec, null, selected);
  range.insertNode(block);
  selectContents(block);
  return block;
}

function safelyIntersects(range: Range, node: Node) {
  try {
    return range.intersectsNode(node);
  } catch {
    return false;
  }
}

function applyAcrossBlocks(editor: HTMLElement, range: Range, spec: StyleSpec) {
  const blocks = Array.from(editor.querySelectorAll<HTMLElement>(BLOCK_SELECTOR))
    .filter((block) => safelyIntersects(range, block));
  if (!blocks.length) return null;

  let first: HTMLElement | null = null;
  let last: HTMLElement | null = null;
  blocks.forEach((block) => {
    const replacement = replaceWholeBlock(block, spec);
    if (!first) first = replacement;
    last = replacement;
  });

  if (first && last) {
    const selection = window.getSelection();
    const next = document.createRange();
    next.setStart(first, 0);
    next.setEnd(last, last.childNodes.length);
    selection?.removeAllRanges();
    selection?.addRange(next);
  }
  return first;
}

function applyStyle(editor: HTMLElement, range: Range, spec: StyleSpec) {
  if (range.collapsed) {
    const block = blockForNode(editor, range.startContainer);
    return block ? replaceWholeBlock(block, spec) : null;
  }

  const startBlock = blockForNode(editor, range.startContainer);
  const endBlock = blockForNode(editor, range.endContainer);

  if (startBlock && startBlock === endBlock) return applyWithinSingleBlock(editor, range, startBlock, spec);
  if (!startBlock && !endBlock) return applyLooseSelection(range, spec);
  return applyAcrossBlocks(editor, range, spec);
}

/**
 * Owns the Word paragraph-style selector.
 * Highlighted text never calls execCommand(formatBlock): that browser command
 * can promote an A4 page container when pasted/legacy markup is loose.
 */
export function WordExactParagraphStyles() {
  useEffect(() => {
    const editor = editorElement();
    const select = document.querySelector<HTMLSelectElement>('select.docs-style-select[aria-label="Paragraph style"]');
    if (!editor || !select) return;

    select.replaceChildren(...STYLES.map((spec) => {
      const option = document.createElement('option');
      option.value = spec.value;
      option.textContent = spec.label;
      return option;
    }));
    select.value = 'p';

    let savedRange: Range | null = null;

    const remember = () => {
      const range = rangeInside(editor);
      if (range) savedRange = range.cloneRange();
    };

    const onSelectionChange = () => {
      if (document.activeElement === select) return;
      const range = rangeInside(editor);
      if (range) savedRange = range.cloneRange();
    };

    const onPointerDown = () => remember();

    const onChange = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const spec = STYLES.find((item) => item.value === select.value) ?? STYLES[0];
      if (!savedRange) {
        select.value = 'p';
        return;
      }

      try {
        const selection = window.getSelection();
        editor.focus({ preventScroll: true });
        selection?.removeAllRanges();
        selection?.addRange(savedRange.cloneRange());
        const active = rangeInside(editor);
        if (!active) return;
        const changed = applyStyle(editor, active, spec);
        if (changed) {
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new CustomEvent('fwo:force-pagination', { bubbles: true }));
          const current = rangeInside(editor);
          if (current) savedRange = current.cloneRange();
        }
      } finally {
        select.value = spec.value;
      }
    };

    select.addEventListener('pointerdown', onPointerDown, true);
    select.addEventListener('mousedown', onPointerDown, true);
    select.addEventListener('change', onChange, true);
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      select.removeEventListener('pointerdown', onPointerDown, true);
      select.removeEventListener('mousedown', onPointerDown, true);
      select.removeEventListener('change', onChange, true);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, []);

  return null;
}
