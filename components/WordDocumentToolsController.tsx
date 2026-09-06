'use client';

import { useEffect } from 'react';

type IndentDirection = 'increase' | 'decrease';

const INDENT_STEP = 36;
const MAX_INDENT = 360;
const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,td,th';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page[contenteditable="true"]');
}

function rangeInsideEditor(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null;
  return range.cloneRange();
}

function restoreRange(editor: HTMLElement, range: Range | null) {
  if (!range) return false;
  try {
    const selection = window.getSelection();
    editor.focus({ preventScroll: true });
    selection?.removeAllRanges();
    selection?.addRange(range);
    return true;
  } catch {
    return false;
  }
}

function closestBlock(editor: HTMLElement, node: Node | null) {
  if (!node) return null;
  const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
  const block = element?.closest<HTMLElement>(BLOCK_SELECTOR) ?? null;
  return block && editor.contains(block) ? block : null;
}

function blocksForRange(editor: HTMLElement, range: Range) {
  if (range.collapsed) {
    const block = closestBlock(editor, range.startContainer);
    return block ? [block] : [];
  }

  const candidates = Array.from(editor.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)).filter((block) => {
    try {
      return range.intersectsNode(block);
    } catch {
      return false;
    }
  });

  // Prefer the deepest editable blocks so a paragraph inside a list item is not indented twice.
  return candidates.filter((candidate) => !candidates.some((other) => other !== candidate && candidate.contains(other)));
}

function numericMarginLeft(block: HTMLElement) {
  const value = Number.parseFloat(getComputedStyle(block).marginLeft);
  return Number.isFinite(value) ? value : 0;
}

function applyIndent(editor: HTMLElement, range: Range, direction: IndentDirection) {
  const blocks = blocksForRange(editor, range);
  if (!blocks.length) return false;

  let changed = false;
  for (const block of blocks) {
    const current = numericMarginLeft(block);
    const next = direction === 'increase'
      ? Math.min(MAX_INDENT, current + INDENT_STEP)
      : Math.max(0, current - INDENT_STEP);

    if (Math.abs(next - current) < 0.5) continue;
    if (next <= 0) block.style.removeProperty('margin-left');
    else block.style.setProperty('margin-left', `${Math.round(next)}px`);
    changed = true;
  }

  if (changed) editor.dispatchEvent(new Event('input', { bubbles: true }));
  return changed;
}

function labelForButton(button: HTMLButtonElement) {
  return (
    button.getAttribute('aria-label') ||
    button.getAttribute('title') ||
    button.textContent ||
    ''
  ).trim();
}

function indentDirectionForTarget(target: EventTarget | null): IndentDirection | null {
  if (!(target instanceof Element)) return null;
  const button = target.closest<HTMLButtonElement>('button');
  if (!button) return null;
  const label = labelForButton(button);
  if (label === 'Increase indent') return 'increase';
  if (label === 'Decrease indent') return 'decrease';
  return null;
}

function placeCaretAtStart(editor: HTMLElement) {
  const target = editor.querySelector<HTMLElement>('p') ?? editor;
  const range = document.createRange();
  range.selectNodeContents(target);
  range.collapse(true);
  const selection = window.getSelection();
  editor.focus({ preventScroll: true });
  selection?.removeAllRanges();
  selection?.addRange(range);
  return range.cloneRange();
}

export function WordDocumentToolsController() {
  useEffect(() => {
    const editor = editorElement();
    const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
    if (!editor || !toolbar) return;

    let savedRange: Range | null = rangeInsideEditor(editor);

    const rememberSelection = () => {
      const live = rangeInsideEditor(editor);
      if (live) savedRange = live;
    };

    const runIndent = (direction: IndentDirection) => {
      const live = rangeInsideEditor(editor);
      if (live) savedRange = live;
      if (!savedRange || !restoreRange(editor, savedRange)) return;
      const workingRange = window.getSelection()?.rangeCount
        ? window.getSelection()!.getRangeAt(0).cloneRange()
        : savedRange.cloneRange();
      if (!applyIndent(editor, workingRange, direction)) return;
      savedRange = workingRange.cloneRange();
      restoreRange(editor, savedRange);
    };

    const onPointerDownCapture = (event: PointerEvent) => {
      const direction = indentDirectionForTarget(event.target);
      if (!direction) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      runIndent(direction);
    };

    const onClickCapture = (event: MouseEvent) => {
      const direction = indentDirectionForTarget(event.target);
      if (!direction) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      // Keyboard/programmatic button activation has no pointerdown, so handle it here.
      if (event.detail === 0) runIndent(direction);
    };

    const clearDocument = () => {
      if (!window.confirm('Clear the entire document? This will remove all text and formatting.')) return;
      editor.innerHTML = '<p><br></p>';
      savedRange = placeCaretAtStart(editor);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const ensureClearButton = () => {
      const clearFormatting = toolbar.querySelector<HTMLButtonElement>('button[aria-label="Clear formatting"]');
      if (!clearFormatting?.parentElement) return;

      let button = toolbar.querySelector<HTMLButtonElement>('button.fwo-clear-document-button');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'docs-toolbar-button fwo-clear-document-button';
        button.title = 'Clear document';
        button.setAttribute('aria-label', 'Clear document');
        button.innerHTML = '<span class="material-symbols-rounded" aria-hidden="true">delete_sweep</span>';
        button.addEventListener('pointerdown', (event) => event.preventDefault());
        button.addEventListener('click', clearDocument);
      }

      if (clearFormatting.nextElementSibling !== button) {
        clearFormatting.insertAdjacentElement('afterend', button);
      }
    };

    editor.addEventListener('pointerup', rememberSelection);
    editor.addEventListener('keyup', rememberSelection);
    document.addEventListener('selectionchange', rememberSelection);
    document.addEventListener('pointerdown', onPointerDownCapture, true);
    document.addEventListener('click', onClickCapture, true);

    ensureClearButton();
    const observer = new MutationObserver(ensureClearButton);
    observer.observe(toolbar, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      editor.removeEventListener('pointerup', rememberSelection);
      editor.removeEventListener('keyup', rememberSelection);
      document.removeEventListener('selectionchange', rememberSelection);
      document.removeEventListener('pointerdown', onPointerDownCapture, true);
      document.removeEventListener('click', onClickCapture, true);
      toolbar.querySelector<HTMLButtonElement>('button.fwo-clear-document-button')?.remove();
    };
  }, []);

  return null;
}
