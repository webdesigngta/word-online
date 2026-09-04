'use client';

import { useEffect } from 'react';

const STYLE_ID = 'doc321-notepad-header-bridge-style';

export function NotepadHeaderBridge({ targetId }: { targetId: string }) {
  useEffect(() => {
    let sourceObserver: MutationObserver | null = null;
    let currentSource: HTMLElement | null = null;

    const ensureStyle = () => {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        /* Online Notebook keeps All Tools beside the primary download action. */
        .notepad-is-shell .np-toolbar .np-notebook-download-action,
        .notepad-is-shell .np-toolbar .np-all-tools-action {
          box-sizing: border-box !important;
          height: 32px !important;
          min-width: 88px !important;
          padding: 0 11px !important;
          border-radius: 7px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 7px !important;
          flex: 0 0 auto !important;
          white-space: nowrap !important;
          text-decoration: none !important;
        }
        .notepad-is-shell .np-toolbar .np-all-tools-action {
          border: 1px solid #d7dce3 !important;
          background: #fff !important;
          color: #28313d !important;
          font: 650 12px/1 Arial,Helvetica,sans-serif !important;
        }
        .notepad-is-shell .np-toolbar .np-all-tools-action:hover {
          background: #f4f6f8 !important;
        }
        .notepad-is-shell.is-dark .np-toolbar .np-all-tools-action {
          border-color: #3a404a !important;
          background: #23272e !important;
          color: #f3f5f7 !important;
        }
        /* The page-specific All Tools action replaces the duplicate global nav item. */
        .product-site-header .site-nav a[href='/tools'] { display: none !important; }
        @media(max-width:760px) {
          .notepad-is-shell .np-toolbar .np-notebook-download-action,
          .notepad-is-shell .np-toolbar .np-all-tools-action {
            min-width: 82px !important;
          }
        }
      `;
      document.head.appendChild(style);
    };

    const ensureAllToolsButton = () => {
      const toolbar = document.querySelector<HTMLElement>('.notepad-is-shell .np-toolbar');
      if (!toolbar) return;

      const buttons = Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button.np-btn'));
      const download = buttons.find((button) => button.title === 'Download PDF')
        ?? buttons.find((button) => button.textContent?.trim() === 'PDF');
      if (!download) return;

      download.classList.add('np-notebook-download-action');

      let allTools = toolbar.querySelector<HTMLAnchorElement>('.np-all-tools-action');
      if (!allTools) {
        allTools = document.createElement('a');
        allTools.href = '/tools';
        allTools.className = 'np-btn np-all-tools-action';
        allTools.textContent = 'All Tools';
        allTools.setAttribute('aria-label', 'View all DOC321 tools');
        allTools.setAttribute('title', 'All DOC321 tools');
      }

      if (download.nextElementSibling !== allTools) download.insertAdjacentElement('afterend', allTools);
    };

    const sync = () => {
      ensureStyle();
      ensureAllToolsButton();

      const title = document.querySelector<HTMLElement>('.product-site-header .site-context-title');
      const context = title?.closest<HTMLElement>('.site-context');
      if (title) title.textContent = 'Online Notebook';
      if (context) context.setAttribute('aria-label', 'Online Notebook');

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
      document.getElementById(STYLE_ID)?.remove();
    };
  }, [targetId]);

  return null;
}
