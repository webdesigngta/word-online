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

function styleForBlock(block: HTMLElement | null): StyleSpec {
  if (!block) return STYLES[0];
  if (block.dataset.fwoParagraphStyle === 'title') return STYLES.find((item) => item.value === 'title')!;
  if (block.dataset.fwoParagraphStyle === 'subtitle') return STYLES.find((item) => item.value === 'subtitle')!;
  const tag = block.tagName.toLowerCase();
  return STYLES.find((item) => item.tag === tag && !item.special) ?? STYLES[0];
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

/** Selection-safe paragraph style control for Word Online. */
export function WordExactParagraphStyles() {
  useEffect(() => {
    let frame = 0;
    let attempts = 0;
    let cleanupMounted: (() => void) | null = null;

    const mount = () => {
      const editor = editorElement();
      const original = document.querySelector<HTMLSelectElement>('select.docs-style-select[aria-label="Paragraph style"]');
      const host = original?.parentElement;

      if (!editor || !original || !host) {
        attempts += 1;
        if (attempts < 120) frame = window.requestAnimationFrame(mount);
        return;
      }

      if (host.querySelector('.fwo-exact-style-wrap')) return;

      original.style.display = 'none';
      original.tabIndex = -1;
      original.setAttribute('aria-hidden', 'true');

      const wrap = document.createElement('div');
      wrap.className = 'fwo-exact-style-wrap';

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'fwo-style-trigger fwo-exact-style-trigger';
      trigger.setAttribute('aria-label', 'Paragraph style');
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.innerHTML = '<span class="fwo-style-label">Normal text</span><span class="fwo-style-caret">▾</span>';
      wrap.appendChild(trigger);
      host.insertBefore(wrap, original);

      const menu = document.createElement('div');
      menu.className = 'fwo-exact-style-menu';
      menu.setAttribute('role', 'menu');
      menu.setAttribute('aria-label', 'Paragraph styles');
      menu.hidden = true;
      document.body.appendChild(menu);

      let savedRange: Range | null = null;

      const triggerLabel = () => trigger.querySelector<HTMLElement>('.fwo-style-label');
      const setLabel = (label: string) => {
        const node = triggerLabel();
        if (node && node.textContent !== label) node.textContent = label;
      };

      const remember = () => {
        const range = rangeInside(editor);
        if (range) savedRange = range.cloneRange();
      };

      const restore = () => {
        if (!savedRange) return null;
        try {
          const selection = window.getSelection();
          editor.focus({ preventScroll: true });
          selection?.removeAllRanges();
          selection?.addRange(savedRange.cloneRange());
          return rangeInside(editor);
        } catch {
          savedRange = null;
          return null;
        }
      };

      const positionMenu = () => {
        if (menu.hidden) return;
        const rect = trigger.getBoundingClientRect();
        const width = Math.min(220, Math.max(172, window.innerWidth - 16));
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
        const top = Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 380));
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        menu.style.width = `${width}px`;
        menu.style.maxHeight = `${Math.max(160, window.innerHeight - top - 8)}px`;
      };

      const closeMenu = () => {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      };

      const apply = (spec: StyleSpec) => {
        const active = restore();
        if (!active) {
          closeMenu();
          return;
        }

        const changed = styleRange(editor, active, spec);
        if (changed) {
          setLabel(spec.label);
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new CustomEvent('fwo:force-pagination', { bubbles: true }));
          const current = rangeInside(editor);
          if (current) savedRange = current.cloneRange();
        }

        closeMenu();
        editor.focus({ preventScroll: true });
      };

      STYLES.forEach((spec) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fwo-exact-style-item';
        button.setAttribute('role', 'menuitem');
        button.dataset.styleValue = spec.value;
        button.textContent = spec.label;
        button.addEventListener('mousedown', (event) => event.preventDefault());
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          apply(spec);
        });
        menu.appendChild(button);
      });

      const onTriggerMouseDown = (event: MouseEvent) => {
        remember();
        event.preventDefault();
      };

      const onTriggerClick = () => {
        if (!menu.hidden) {
          closeMenu();
          return;
        }
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        positionMenu();
      };

      const onSelectionChange = () => {
        if (!menu.hidden) return;
        const range = rangeInside(editor);
        if (!range) return;
        savedRange = range.cloneRange();
        const start = blockForNode(editor, range.startContainer);
        const end = blockForNode(editor, range.endContainer);
        setLabel(start && start === end ? styleForBlock(start).label : 'Normal text');
      };

      const onOutsideMouseDown = (event: MouseEvent) => {
        const target = event.target as Node;
        if (wrap.contains(target) || menu.contains(target)) return;
        closeMenu();
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || menu.hidden) return;
        event.preventDefault();
        closeMenu();
        trigger.focus();
      };

      const onReposition = () => positionMenu();

      trigger.addEventListener('mousedown', onTriggerMouseDown);
      trigger.addEventListener('click', onTriggerClick);
      document.addEventListener('selectionchange', onSelectionChange);
      document.addEventListener('mousedown', onOutsideMouseDown);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('resize', onReposition);
      window.addEventListener('scroll', onReposition, true);

      cleanupMounted = () => {
        trigger.removeEventListener('mousedown', onTriggerMouseDown);
        trigger.removeEventListener('click', onTriggerClick);
        document.removeEventListener('selectionchange', onSelectionChange);
        document.removeEventListener('mousedown', onOutsideMouseDown);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('resize', onReposition);
        window.removeEventListener('scroll', onReposition, true);
        menu.remove();
        wrap.remove();
        original.style.display = '';
        original.tabIndex = 0;
        original.removeAttribute('aria-hidden');
      };
    };

    mount();

    return () => {
      window.cancelAnimationFrame(frame);
      cleanupMounted?.();
    };
  }, []);

  return (
    <style jsx global>{`
      .fwo-exact-style-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
        flex: 0 0 auto;
      }
      .fwo-exact-style-trigger {
        box-sizing: border-box;
        width: 116px;
        min-width: 116px;
        max-width: 116px;
        height: 28px;
        padding: 0 8px 0 10px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #3c4043;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font: 400 14px/28px Arial,Helvetica,sans-serif;
        cursor: pointer;
      }
      .fwo-exact-style-trigger:hover,
      .fwo-exact-style-trigger[aria-expanded='true'] { background: #e2e7ec; }
      .fwo-exact-style-trigger .fwo-style-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fwo-exact-style-trigger .fwo-style-caret { flex: 0 0 auto; color: #5f6368; font-size: 10px; }
      .fwo-exact-style-menu {
        position: fixed;
        z-index: 9500;
        box-sizing: border-box;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 6px;
        border: 1px solid #dadce0;
        border-radius: 10px;
        background: #fff;
        box-shadow: 0 8px 24px rgba(60,64,67,.24),0 2px 6px rgba(60,64,67,.12);
        font-family: Arial,Helvetica,sans-serif;
      }
      .fwo-exact-style-menu[hidden] { display: none !important; }
      .fwo-exact-style-item {
        width: 100%;
        min-height: 36px;
        padding: 7px 10px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: #202124;
        display: block;
        text-align: left;
        font: 500 13px/1.25 Arial,Helvetica,sans-serif;
        cursor: pointer;
      }
      .fwo-exact-style-item:hover,
      .fwo-exact-style-item:focus-visible { background: #f1f3f4; outline: 0; }
      .fwo-exact-style-item[data-style-value='title'] { font-size: 18px; }
      .fwo-exact-style-item[data-style-value='h1'] { font-size: 17px; font-weight: 700; }
      .fwo-exact-style-item[data-style-value='h2'] { font-size: 16px; font-weight: 700; }
      .fwo-exact-style-item[data-style-value='h3'] { font-size: 15px; font-weight: 700; }
      @media(max-width:720px) {
        .fwo-exact-style-trigger { width: 98px; min-width: 98px; max-width: 98px; font-size: 12.5px; }
        .fwo-exact-style-item { min-height: 40px; }
      }
    `}</style>
  );
}
