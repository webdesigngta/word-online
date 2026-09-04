'use client';

import { useEffect } from 'react';

export function NotepadHeaderBridge({ targetId }: { targetId: string }) {
  useEffect(() => {
    let sourceObserver: MutationObserver | null = null;
    let currentSource: HTMLElement | null = null;

    const sync = () => {
      const target = document.getElementById(targetId);
      const source = document.querySelector<HTMLElement>('.notepad-is-shell .np-save');
      if (!target) return;

      if (source) {
        target.textContent = source.textContent?.trim() || 'Saved locally';
        if (source !== currentSource) {
          sourceObserver?.disconnect();
          currentSource = source;
          sourceObserver = new MutationObserver(sync);
          sourceObserver.observe(source, { childList: true, subtree: true, characterData: true });
        }
      }
    };

    sync();
    const pageObserver = new MutationObserver(sync);
    pageObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      pageObserver.disconnect();
      sourceObserver?.disconnect();
    };
  }, [targetId]);

  return null;
}
