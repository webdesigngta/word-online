'use client';

import { useEffect } from 'react';

const MAX_HISTORY = 120;

export function LocalUndoManager() {
  useEffect(() => {
    const editor = document.querySelector<HTMLElement>('.editor-page');
    if (!editor) return;

    let history = [editor.innerHTML];
    let index = 0;
    let suppress = false;
    let timer = 0;

    const pushSnapshot = () => {
      if (suppress) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (suppress) return;
        const html = editor.innerHTML;
        if (history[index] === html) return;
        history = history.slice(0, index + 1);
        history.push(html);
        if (history.length > MAX_HISTORY) history.shift();
        index = history.length - 1;
      }, 60);
    };

    const restore = (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= history.length || nextIndex === index) return;
      suppress = true;
      index = nextIndex;
      editor.innerHTML = history[index];
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      window.setTimeout(() => { suppress = false; }, 0);
    };

    const undo = () => restore(index - 1);
    const redo = () => restore(index + 1);

    const observer = new MutationObserver(pushSnapshot);
    observer.observe(editor, { childList: true, subtree: true, characterData: true, attributes: true });
    editor.addEventListener('input', pushSnapshot);

    const onClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button');
      if (!button) return;
      const label = button.getAttribute('aria-label')?.trim();
      if (label !== 'Undo' && label !== 'Redo') return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (label === 'Undo') undo(); else redo();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const command = event.ctrlKey || event.metaKey;
      if (!command) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    document.addEventListener('click', onClickCapture, true);
    editor.addEventListener('keydown', onKeyDown, true);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      editor.removeEventListener('input', pushSnapshot);
      document.removeEventListener('click', onClickCapture, true);
      editor.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  return null;
}
