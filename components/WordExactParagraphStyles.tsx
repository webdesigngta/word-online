'use client';

import { useEffect } from 'react';

type StyleValue = 'p' | 'title' | 'subtitle' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type TagName = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type StyleSpec = {
  value: StyleValue;
  label: string;
  tag: TagName;
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

function clearPresentation(block: HTMLElement) {
  delete block.dataset.fwoParagraphStyle;
  block.style.removeProperty('font-size');
  block.style.removeProperty('font-weight');
  block.style.removeProperty('color');
  block.style.removeProperty('margin-top');
  block.style.removeProperty('margin-bottom');
}

function applyPresentation(block: HTMLElement, spec: StyleSpec) {
  clearPresentation(block);
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

function makeBlock(spec: StyleSpec, source: HTMLElement | null, contents: DocumentFragment) {
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
  const replacement = makeBlock(spec, block, contents);
  block.replaceWith(replacement);
  return replacement;
}

function styleSingleBlockSelection(range: Range, block: HTMLElement, spec: StyleSpec) {
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
  const beforeExists = hasContent(before);
  const afterExists = hasContent(after);

  if (!beforeExists && !afterExists) {
    const replacement = replaceWholeBlock(block, spec);
    selectContents(replacement);
    return replacement;
  }

  const replacements: HTMLElement[] = [];
  if (beforeExists) {
    const beforeBlock = cloneShell(block);
    beforeBlock.appendChild(before);
    replacements.push(beforeBlock);
  }

  const selectedBlock = makeBlock(spec, block, selected);
  replacements.push(selectedBlock);

  if (afterExists) {
    const afterBlock = cloneShell(block);
    afterBlock.appendChild(after);
    replacements.push(afterBlock);
  }

  block.replaceWith(...replacements);
  selectContents(selectedBlock);
  return selectedBlock;
}

function styleLooseSelection(range: Range, spec: StyleSpec) {
  const selected = range.extractContents();
  const block = makeBlock(spec, null, selected);
  range.insertNode(block);
  selectContents(block);
  return block;
}

function intersects(range: Range, node: Node) {
  try {
    return range.intersectsNode(node);
  } catch {
    return false;
  }
}

function styleRange(editor: HTMLElement, range: Range, spec: StyleSpec) {
  const startBlock = blockForNode(editor, range.startContainer);
  const endBlock = blockForNode(editor, range.endContainer);

  if (range.collapsed) {
    if (!startBlock) return null;
    const replacement = replaceWholeBlock(startBlock, spec);
    selectContents(replacement);
    return replacement;
  }

  if (startBlock && startBlock === endBlock) {
    return styleSingleBlockSelection(range, startBlock, spec);
  }

  if (!startBlock && !endBlock) {
    return styleLooseSelection(range, spec);
  }

  const blocks = Array.from(editor.querySelectorAll<HTMLElement>(BLOCK_SELECTOR))
    .filter((block) => intersects(range, block));
  if (!blocks.length) return null;

  const replacements = blocks.map((block) => replaceWholeBlock(block, spec));
  const selection = window.getSelection();
  const next = document.createRange();
  next.setStart(replacements[0], 0);
  const last = replacements[replacements.length - 1];
  next.setEnd(last, last.childNodes.length);
  selection?.removeAllRanges();
  selection?.addRange(next);
  return replacements[0];
}

/** Exact-selection paragraph styles for Word Online. */
export function WordExactParagraphStyles() {
  useEffect(() => {
    const editor = editorElement();
    const original = document.querySelector<HTMLSelectElement>('select.docs-style-select[aria-label="Paragraph style"]');
    if (!editor || !original) return;

    const select = document.createElement('select');
    select.className = `${original.className} fwo-exact-style-select`;
    select.setAttribute('aria-label', 'Paragraph style');
    STYLES.forEach((spec) => {
      const option = document.createElement('option');
      option.value = spec.value;
      option.textContent = spec.label;
      select.appendChild(option);
    });
    select.value = 'p';

    original.style.display = 'none';
    original.tabIndex = -1;
    original.parentElement?.insertBefore(select, original);

    let savedRange: Range | null = null;

    const remember = () => {
      const range = rangeInside(editor);
      if (range) savedRange = range.cloneRange();
    };

    const onSelectionChange = () => {
      if (document.activeElement === select) return;
      remember();
    };

    const onChange = () => {
      const spec = STYLES.find((item) => item.value === select.value) ?? STYLES[0];
      if (!savedRange) return;

      try {
        const selection = window.getSelection();
        editor.focus({ preventScroll: true });
        selection?.removeAllRanges();
        selection?.addRange(savedRange.cloneRange());
        const active = rangeInside(editor);
        if (!active) return;
        const changed = styleRange(editor, active, spec);
        if (changed) {
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new CustomEvent('fwo:force-pagination', { bubbles: true }));
          const current = rangeInside(editor);
          if (current) savedRange = current.cloneRange();
        }
      } catch {
        // Keep document unchanged if the saved browser range became stale.
      }
    };

    select.addEventListener('pointerdown', remember, true);
    select.addEventListener('mousedown', remember, true);
    select.addEventListener('change', onChange);
    document.addEventListener('selectionchange', onSelectionChange);

    return () => {
      select.removeEventListener('pointerdown', remember, true);
      select.removeEventListener('mousedown', remember, true);
      select.removeEventListener('change', onChange);
      document.removeEventListener('selectionchange', onSelectionChange);
      select.remove();
      original.style.display = '';
      original.tabIndex = 0;
    };
  }, []);

  return null;
}
