'use client';

import { useEffect } from 'react';

type ParagraphStyle = {
  label: string;
  tag: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  kind?: 'title' | 'subtitle';
};

const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6';

const PARAGRAPH_STYLES: Record<string, ParagraphStyle> = {
  'Normal text': { label: 'Normal text', tag: 'p' },
  Title: { label: 'Title', tag: 'p', kind: 'title' },
  Subtitle: { label: 'Subtitle', tag: 'p', kind: 'subtitle' },
  'Heading 1': { label: 'Heading 1', tag: 'h1' },
  'Heading 2': { label: 'Heading 2', tag: 'h2' },
  'Heading 3': { label: 'Heading 3', tag: 'h3' },
  'Heading 4': { label: 'Heading 4', tag: 'h4' },
  'Heading 5': { label: 'Heading 5', tag: 'h5' },
  'Heading 6': { label: 'Heading 6', tag: 'h6' },
};

type SelectionSnapshot = {
  anchorNode: Node | null;
  anchorOffset: number;
  focusNode: Node | null;
  focusOffset: number;
};

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function selectionInside(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
  return selection;
}

function selectionIsBackward(selection: Selection) {
  if (!selection.rangeCount || selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  return selection.anchorNode === range.endContainer
    && selection.anchorOffset === range.endOffset
    && selection.focusNode === range.startContainer
    && selection.focusOffset === range.startOffset;
}

function captureSelection(editor: HTMLElement): SelectionSnapshot | null {
  const selection = selectionInside(editor);
  if (!selection) return null;
  return {
    anchorNode: selection.anchorNode,
    anchorOffset: selection.anchorOffset,
    focusNode: selection.focusNode,
    focusOffset: selection.focusOffset,
  };
}

function restoreSelection(editor: HTMLElement, snapshot: SelectionSnapshot | null) {
  if (!snapshot?.anchorNode || !snapshot.focusNode) return false;
  if (!editor.contains(snapshot.anchorNode) || !editor.contains(snapshot.focusNode)) return false;
  const selection = window.getSelection();
  if (!selection || typeof selection.setBaseAndExtent !== 'function') return false;

  try {
    editor.focus({ preventScroll: true });
    selection.removeAllRanges();
    selection.setBaseAndExtent(
      snapshot.anchorNode,
      snapshot.anchorOffset,
      snapshot.focusNode,
      snapshot.focusOffset,
    );
    return true;
  } catch {
    return false;
  }
}

function blockForNode(editor: HTMLElement, node: Node | null) {
  if (!node) return null;
  let element: Element | null = node instanceof Element ? node : node.parentElement;
  const block = element?.closest<HTMLElement>(BLOCK_SELECTOR) ?? null;
  return block && editor.contains(block) ? block : null;
}

function blocksForSelection(editor: HTMLElement, selection: Selection) {
  const range = selection.getRangeAt(0);
  const startBlock = blockForNode(editor, range.startContainer);
  const endBlock = blockForNode(editor, range.endContainer);
  if (!startBlock && !endBlock) return [];
  if (!startBlock || !endBlock || startBlock === endBlock) return [startBlock || endBlock].filter(Boolean) as HTMLElement[];

  const blocks = Array.from(editor.querySelectorAll<HTMLElement>(BLOCK_SELECTOR));
  const startIndex = blocks.indexOf(startBlock);
  const endIndex = blocks.indexOf(endBlock);
  if (startIndex < 0 || endIndex < 0) return [startBlock, endBlock];
  return blocks.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
}

function clearSpecialStyle(block: HTMLElement) {
  delete block.dataset.fwoParagraphStyle;
  block.style.removeProperty('font-size');
  block.style.removeProperty('font-weight');
  block.style.removeProperty('color');
  block.style.removeProperty('margin-top');
  block.style.removeProperty('margin-bottom');
}

function convertBlock(block: HTMLElement, style: ParagraphStyle) {
  let next = block;
  if (block.tagName.toLowerCase() !== style.tag) {
    next = document.createElement(style.tag);
    Array.from(block.attributes).forEach((attribute) => next.setAttribute(attribute.name, attribute.value));
    while (block.firstChild) next.appendChild(block.firstChild);
    block.replaceWith(next);
  }

  clearSpecialStyle(next);

  if (style.kind === 'title') {
    next.dataset.fwoParagraphStyle = 'title';
    next.style.fontSize = '26pt';
    next.style.fontWeight = '500';
    next.style.marginTop = '0.6em';
    next.style.marginBottom = '0.3em';
  } else if (style.kind === 'subtitle') {
    next.dataset.fwoParagraphStyle = 'subtitle';
    next.style.fontSize = '15pt';
    next.style.fontWeight = '400';
    next.style.color = '#5f6368';
    next.style.marginTop = '0.3em';
    next.style.marginBottom = '0.6em';
  }

  return next;
}

export function EditorNativeSelectionGuard() {
  useEffect(() => {
    const editor = editorElement();
    if (!editor) return;

    let draggingSelection = false;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      draggingSelection = Boolean(target && editor.contains(target));
    };

    const onPointerUp = () => {
      draggingSelection = false;
    };

    const onSelectionChange = (event: Event) => {
      const selection = selectionInside(editor);
      if (!selection || selection.isCollapsed) return;

      // The formatting bridge stores a normalized Range and restores it while
      // selectionchange is still firing. During a backwards selection that can
      // fight the browser on every mouse move/Shift+Arrow step. Let native
      // selection own backwards selection completely; toolbar actions can still
      // read the final Range when the user actually clicks a control.
      if (selectionIsBackward(selection)) {
        event.stopImmediatePropagation();
        return;
      }

      // While the pointer is actively extending a selection, do not allow a
      // later listener to rewrite it mid-drag. This keeps both drag directions
      // symmetrical and prevents the caret from snapping back to the anchor.
      if (draggingSelection) event.stopImmediatePropagation();
    };

    const onStyleClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('.fwo-style-item');
      if (!button) return;

      const label = button.textContent?.replace(/\s+/g, ' ').trim() || '';
      const style = PARAGRAPH_STYLES[label];
      if (!style) return;

      const selection = selectionInside(editor);
      if (!selection) return;
      const blocks = blocksForSelection(editor, selection);
      if (!blocks.length) return;

      const snapshot = captureSelection(editor);

      // Own paragraph-style application so a previous Title/Heading selection
      // cannot be replayed by the formatting bridge after choosing a new block.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      blocks.forEach((block) => convertBlock(block, style));
      restoreSelection(editor, snapshot);

      const trigger = document.querySelector<HTMLButtonElement>('.fwo-style-trigger');
      const triggerLabel = trigger?.querySelector<HTMLElement>('.fwo-style-label');
      if (triggerLabel) triggerLabel.textContent = style.label;
      trigger?.setAttribute('aria-expanded', 'false');
      const menu = document.querySelector<HTMLElement>('.fwo-style-menu');
      if (menu) menu.hidden = true;

      editor.dispatchEvent(new Event('input', { bubbles: true }));
      window.requestAnimationFrame(() => restoreSelection(editor, snapshot));
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', onPointerUp, true);
    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('click', onStyleClickCapture, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp, true);
      document.removeEventListener('pointercancel', onPointerUp, true);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('click', onStyleClickCapture, true);
    };
  }, []);

  return null;
}
