'use client';

import { useEffect } from 'react';

type StyleItem = {
  label: string;
  tag: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size: string;
  weight: string;
  kind?: 'title' | 'subtitle';
};

const STYLE_ITEMS: StyleItem[] = [
  { label: 'Normal text', tag: 'p', size: '13px', weight: '400' },
  { label: 'Title', tag: 'p', size: '18px', weight: '600', kind: 'title' },
  { label: 'Subtitle', tag: 'p', size: '14px', weight: '400', kind: 'subtitle' },
  { label: 'Heading 1', tag: 'h1', size: '17px', weight: '600' },
  { label: 'Heading 2', tag: 'h2', size: '16px', weight: '600' },
  { label: 'Heading 3', tag: 'h3', size: '15px', weight: '600' },
  { label: 'Heading 4', tag: 'h4', size: '14px', weight: '600' },
  { label: 'Heading 5', tag: 'h5', size: '13px', weight: '600' },
  { label: 'Heading 6', tag: 'h6', size: '12px', weight: '600' },
];

const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6';

function labelForBlock(block: HTMLElement | null) {
  if (!block) return 'Normal text';
  if (block.dataset.fwoParagraphStyle === 'title') return 'Title';
  if (block.dataset.fwoParagraphStyle === 'subtitle') return 'Subtitle';
  const tag = block.tagName.toLowerCase();
  return STYLE_ITEMS.find((item) => item.tag === tag && !item.kind)?.label ?? 'Normal text';
}

function clearSpecialStyle(block: HTMLElement | null) {
  if (!block) return;
  delete block.dataset.fwoParagraphStyle;
  block.style.removeProperty('font-size');
  block.style.removeProperty('font-weight');
  block.style.removeProperty('color');
  block.style.removeProperty('margin-top');
  block.style.removeProperty('margin-bottom');
}

function applySpecialStyle(block: HTMLElement, item: StyleItem) {
  clearSpecialStyle(block);
  if (item.kind === 'title') {
    block.dataset.fwoParagraphStyle = 'title';
    block.style.fontSize = '26pt';
    block.style.fontWeight = '500';
    block.style.marginTop = '0.6em';
    block.style.marginBottom = '0.3em';
  } else if (item.kind === 'subtitle') {
    block.dataset.fwoParagraphStyle = 'subtitle';
    block.style.fontSize = '15pt';
    block.style.fontWeight = '400';
    block.style.color = '#5f6368';
    block.style.marginTop = '0.3em';
    block.style.marginBottom = '0.6em';
  }
}

function selectionRange(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return editor.contains(range.startContainer) && editor.contains(range.endContainer) ? range : null;
}

function blockForNode(editor: HTMLElement, node: Node) {
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node instanceof HTMLElement ? node : null;
  const block = element?.closest<HTMLElement>(BLOCK_SELECTOR) ?? null;
  return block && editor.contains(block) ? block : null;
}

function currentBlock(editor: HTMLElement) {
  const range = selectionRange(editor);
  return range ? blockForNode(editor, range.startContainer) : null;
}

function fragmentHasContent(fragment: DocumentFragment) {
  return Boolean(fragment.textContent?.length || fragment.querySelector('*'));
}

function cloneBlockShell(block: HTMLElement) {
  const clone = block.cloneNode(false) as HTMLElement;
  clone.removeAttribute('id');
  return clone;
}

function makeStyledBlock(item: StyleItem, source: HTMLElement | null, contents: DocumentFragment): HTMLElement {
  const block = document.createElement(item.tag) as HTMLElement;
  if (source) {
    if (source.dir) block.dir = source.dir;
    if (source.style.textAlign) block.style.textAlign = source.style.textAlign;
    if (source.style.marginLeft) block.style.marginLeft = source.style.marginLeft;
    if (source.style.marginRight) block.style.marginRight = source.style.marginRight;
  }
  if (fragmentHasContent(contents)) block.appendChild(contents);
  else block.appendChild(document.createElement('br'));
  applySpecialStyle(block, item);
  return block;
}

function selectBlockContents(block: HTMLElement) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(block);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function selectBlocks(first: HTMLElement, last: HTMLElement) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(first, 0);
  range.setEnd(last, last.childNodes.length);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function isolateSingleBlockSelection(editor: HTMLElement, range: Range, item: StyleItem): HTMLElement | null {
  if (range.collapsed) return null;
  const startBlock = blockForNode(editor, range.startContainer);
  const endBlock = blockForNode(editor, range.endContainer);
  if (!startBlock || startBlock !== endBlock) return null;

  const beforeRange = document.createRange();
  beforeRange.selectNodeContents(startBlock);
  beforeRange.setEnd(range.startContainer, range.startOffset);
  const before = beforeRange.cloneContents();

  const afterRange = document.createRange();
  afterRange.selectNodeContents(startBlock);
  afterRange.setStart(range.endContainer, range.endOffset);
  const after = afterRange.cloneContents();

  const selected = range.cloneContents();
  const hasBefore = fragmentHasContent(before);
  const hasAfter = fragmentHasContent(after);

  // Full paragraph/heading selected: replace only that block, never ask the
  // browser to guess the formatting scope.
  if (!hasBefore && !hasAfter) {
    const selectedBlock = makeStyledBlock(item, startBlock, selected);
    startBlock.replaceWith(selectedBlock);
    selectBlockContents(selectedBlock);
    return selectedBlock;
  }

  const replacement: HTMLElement[] = [];
  if (hasBefore) {
    const beforeBlock = cloneBlockShell(startBlock);
    beforeBlock.appendChild(before);
    replacement.push(beforeBlock);
  }

  const selectedBlock = makeStyledBlock(item, startBlock, selected);
  replacement.push(selectedBlock);

  if (hasAfter) {
    const afterBlock = cloneBlockShell(startBlock);
    afterBlock.appendChild(after);
    replacement.push(afterBlock);
  }

  startBlock.replaceWith(...replacement);
  selectBlockContents(selectedBlock);
  return selectedBlock;
}

function isolateLooseSelection(editor: HTMLElement, range: Range, item: StyleItem): HTMLElement | null {
  if (range.collapsed) return null;
  if (blockForNode(editor, range.startContainer) || blockForNode(editor, range.endContainer)) return null;

  // Handles legacy pasted content that lives directly inside an A4 page as
  // text + BR nodes. Only the highlighted range is extracted and restyled.
  const selected = range.extractContents();
  const block = makeStyledBlock(item, null, selected);
  range.insertNode(block);
  selectBlockContents(block);
  return block;
}

function safelyIntersects(range: Range, node: Node) {
  try {
    return range.intersectsNode(node);
  } catch {
    return false;
  }
}

function styleIntersectingBlocks(editor: HTMLElement, range: Range, item: StyleItem): HTMLElement | null {
  if (range.collapsed) return null;
  const blocks = Array.from(editor.querySelectorAll<HTMLElement>(BLOCK_SELECTOR))
    .filter((block) => safelyIntersects(range, block));
  if (!blocks.length) return null;

  const replacements: HTMLElement[] = [];
  blocks.forEach((block) => {
    const contentsRange = document.createRange();
    contentsRange.selectNodeContents(block);
    const contents = contentsRange.cloneContents();
    contentsRange.detach?.();
    const styled = makeStyledBlock(item, block, contents);
    block.replaceWith(styled);
    replacements.push(styled);
  });

  if (replacements.length) selectBlocks(replacements[0], replacements[replacements.length - 1]);
  return replacements[0] ?? null;
}

export function CompactStyleMenu() {
  useEffect(() => {
    const editor = document.querySelector<HTMLElement>('.editor-page');
    const select = document.querySelector<HTMLSelectElement>('.docs-style-select');
    if (!editor || !select || document.querySelector('.fwo-style-wrap')) return;

    select.style.display = 'none';
    let savedRange: Range | null = null;

    const rememberRange = () => {
      const range = selectionRange(editor);
      if (range) savedRange = range.cloneRange();
    };

    const restoreRange = () => {
      if (!savedRange) return false;
      try {
        const selection = window.getSelection();
        editor.focus({ preventScroll: true });
        selection?.removeAllRanges();
        selection?.addRange(savedRange.cloneRange());
        return true;
      } catch {
        savedRange = null;
        return false;
      }
    };

    const wrap = document.createElement('div');
    wrap.className = 'fwo-style-wrap';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'fwo-style-trigger';
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span class="fwo-style-label">Normal text</span><span class="fwo-style-caret">▾</span>';

    const menu = document.createElement('div');
    menu.className = 'fwo-style-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Paragraph styles');
    menu.hidden = true;
    document.body.appendChild(menu);

    const positionMenu = () => {
      const rect = trigger.getBoundingClientRect();
      const edge = 8;
      const top = Math.max(edge, rect.bottom + 6);
      const width = Math.min(190, Math.max(150, window.innerWidth - edge * 2));
      menu.style.left = `${Math.min(Math.max(edge, rect.left), Math.max(edge, window.innerWidth - width - edge))}px`;
      menu.style.top = `${top}px`;
      menu.style.width = `${width}px`;
      menu.style.maxHeight = `${Math.min(390, Math.max(120, window.innerHeight - top - edge))}px`;
    };

    const closeMenu = () => {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    };

    const applyItem = (item: StyleItem) => {
      restoreRange();
      const range = selectionRange(editor);
      if (!range) {
        closeMenu();
        return;
      }

      let block: HTMLElement | null = null;

      if (!range.collapsed) {
        // Never use execCommand(formatBlock) for highlighted text. Browser scope
        // inference can promote an A4 container on legacy pasted markup.
        block = isolateSingleBlockSelection(editor, range, item)
          ?? isolateLooseSelection(editor, range, item)
          ?? styleIntersectingBlocks(editor, range, item);
      } else {
        const before = currentBlock(editor);
        if (before) {
          clearSpecialStyle(before);
          document.execCommand('formatBlock', false, item.tag);
          block = currentBlock(editor);
          if (block) applySpecialStyle(block, item);
        }
      }

      if (block) {
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        const active = window.getSelection();
        if (active?.rangeCount) savedRange = active.getRangeAt(0).cloneRange();
        (trigger.querySelector('.fwo-style-label') as HTMLElement).textContent = item.label;
      }

      closeMenu();
      editor.focus({ preventScroll: true });
    };

    STYLE_ITEMS.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fwo-style-item';
      button.setAttribute('role', 'menuitem');
      button.innerHTML = `<span class="fwo-style-preview" style="font-size:${item.size};font-weight:${item.weight}">${item.label}</span>`;
      button.addEventListener('mousedown', (event) => event.preventDefault());
      button.addEventListener('click', () => applyItem(item));
      menu.appendChild(button);
    });

    trigger.addEventListener('mousedown', (event) => {
      rememberRange();
      event.preventDefault();
    });
    trigger.addEventListener('click', () => {
      if (!menu.hidden) {
        closeMenu();
        return;
      }
      positionMenu();
      menu.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
    });

    const updateFromSelection = () => {
      if (menu.hidden) rememberRange();
      (trigger.querySelector('.fwo-style-label') as HTMLElement).textContent = labelForBlock(currentBlock(editor));
    };
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrap.contains(target) && !menu.contains(target)) closeMenu();
    };
    const reposition = () => { if (!menu.hidden) positionMenu(); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !menu.hidden) {
        event.preventDefault();
        closeMenu();
        trigger.focus();
      }
    };

    document.addEventListener('selectionchange', updateFromSelection);
    document.addEventListener('mousedown', closeOutside);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('keydown', onKeyDown);

    wrap.appendChild(trigger);
    select.parentElement?.insertBefore(wrap, select);

    const style = document.createElement('style');
    style.dataset.fwoCompactStyles = 'true';
    style.textContent = `
      .fwo-style-wrap{position:relative;flex:0 0 auto;min-width:0;font-family:Arial,Helvetica,sans-serif}
      .fwo-style-trigger{height:28px;min-width:108px;max-width:132px;padding:0 8px 0 10px;border:0;border-radius:6px;background:transparent;color:#3c4043;display:flex;align-items:center;justify-content:space-between;gap:9px;font-size:13px;cursor:pointer}
      .fwo-style-trigger:hover,.fwo-style-trigger[aria-expanded='true']{background:#e8eaed}
      .fwo-style-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fwo-style-caret{font-size:10px;color:#5f6368;flex:0 0 auto}
      .fwo-style-menu{position:fixed;z-index:5000;box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;padding:5px;background:#fff;border:1px solid #dadce0;border-radius:10px;box-shadow:0 8px 24px rgba(60,64,67,.24),0 2px 6px rgba(60,64,67,.12);font-family:Arial,Helvetica,sans-serif}
      .fwo-style-menu[hidden]{display:none!important}.fwo-style-item{width:100%;min-height:34px;padding:6px 10px;border:0;border-radius:7px;background:transparent;color:#202124;display:flex;align-items:center;text-align:left;cursor:pointer;white-space:nowrap}.fwo-style-item:hover,.fwo-style-item:focus-visible{background:#f1f3f4;outline:0}.fwo-style-preview{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      @media(max-width:850px){.fwo-style-trigger{min-width:88px;max-width:102px;padding-left:8px}.fwo-style-item{min-height:38px}}
      @media(max-width:480px){.fwo-style-trigger{min-width:78px;max-width:90px;font-size:12px}}
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('selectionchange', updateFromSelection);
      document.removeEventListener('mousedown', closeOutside);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('keydown', onKeyDown);
      wrap.remove();
      menu.remove();
      style.remove();
      select.style.display = '';
    };
  }, []);

  return null;
}
