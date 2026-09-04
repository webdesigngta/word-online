'use client';

import { useEffect } from 'react';

export function NotepadHeaderBridge({ targetId }: { targetId: string }) {
  useEffect(() => {
    let sourceObserver: MutationObserver | null = null;
    let frame = 0;
    let attempts = 0;

    const attach = () => {
      const target = document.getElementById(targetId);
      const source = document.querySelector<HTMLElement>('.notepad-is-shell .np-save');

      if (!target || !source) {
        attempts += 1;
        if (attempts < 90) frame = window.requestAnimationFrame(attach);
        return;
      }

      const syncStatus = () => {
        const next = source.textContent?.trim() || 'Saved locally';
        if (target.textContent !== next) target.textContent = next;
      };

      syncStatus();
      sourceObserver = new MutationObserver(syncStatus);
      sourceObserver.observe(source, { childList: true, subtree: true, characterData: true });
    };

    attach();

    return () => {
      window.cancelAnimationFrame(frame);
      sourceObserver?.disconnect();
    };
  }, [targetId]);

  return null;
}
