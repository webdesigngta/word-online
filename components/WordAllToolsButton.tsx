'use client';

import { useEffect } from 'react';

export function WordAllToolsButton() {
  useEffect(() => {
    const ensureButton = () => {
      const host = document.querySelector<HTMLElement>('.docs-topbar .docs-right');
      if (!host || host.querySelector('.fwo-all-tools-link')) return;

      const link = document.createElement('a');
      link.className = 'fwo-all-tools-link';
      link.href = '/tools';
      link.textContent = 'All Tools';
      link.setAttribute('aria-label', 'View all DOC321 tools');
      link.setAttribute('title', 'All DOC321 tools');
      host.prepend(link);
    };

    ensureButton();
    const observer = new MutationObserver(ensureButton);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <style jsx global>{`
      .docs-word-app .fwo-all-tools-link {
        min-height: 34px;
        padding: 0 12px;
        border: 1px solid #d7dce3;
        border-radius: 999px;
        background: #fff;
        color: #24324a;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        font: 700 12px/1 Arial, Helvetica, sans-serif;
        text-decoration: none;
        white-space: nowrap;
        box-shadow: 0 1px 2px rgba(32, 33, 36, .06);
      }
      .docs-word-app .fwo-all-tools-link:hover {
        background: #f3f6fb;
        border-color: #c9d2df;
        color: #174ea6;
      }
      @media (max-width: 720px) {
        .docs-word-app .fwo-all-tools-link {
          min-height: 32px;
          padding: 0 9px;
          font-size: 11px;
        }
      }
      @media (max-width: 420px) {
        .docs-word-app .fwo-all-tools-link {
          padding: 0 8px;
          font-size: 10.5px;
        }
      }
    `}</style>
  );
}
