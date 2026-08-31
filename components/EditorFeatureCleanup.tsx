'use client';

import { useEffect } from 'react';

export function EditorFeatureCleanup() {
  useEffect(() => {
    const cleanup = () => {
      const commentButtons = document.querySelectorAll<HTMLElement>(
        '.docs-topbar button[aria-label="Comments"], .docs-toolbar button[aria-label="Add comment"]',
      );
      commentButtons.forEach((button) => button.remove());

      const modeGroup = document.querySelector<HTMLElement>('.docs-toolbar-mode-group');
      if (modeGroup) {
        const previous = modeGroup.previousElementSibling;
        if (previous instanceof HTMLElement && previous.classList.contains('docs-toolbar-divider')) previous.remove();
        modeGroup.remove();
      }
    };

    cleanup();
    const observer = new MutationObserver(cleanup);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      .docs-topbar button[aria-label='Comments'],
      .docs-toolbar button[aria-label='Add comment'],
      .docs-toolbar .docs-toolbar-mode-group {
        display: none !important;
      }
    `}</style>
  );
}
