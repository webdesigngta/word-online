'use client';

import { useEffect } from 'react';

function editorElement() {
  return document.querySelector<HTMLElement>('.editor-page');
}

function keepSpellcheckOn() {
  const editor = editorElement();
  if (!editor) return;
  editor.spellcheck = true;
  editor.setAttribute('spellcheck', 'true');
}

function removeHelpInfoItem() {
  document.querySelectorAll<HTMLButtonElement>('.fwo-main-menu-item').forEach((button) => {
    if (button.textContent?.trim() !== 'Info') return;
    button.closest<HTMLElement>('.fwo-main-menu-item-wrap')?.remove();
  });
}

function markSpellcheckStatus() {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>('.docs-toolbar button')).find((item) =>
    (item.getAttribute('aria-label') || '').startsWith('Spelling'),
  );
  if (!button) return;
  button.setAttribute('aria-label', 'Spelling on');
  button.setAttribute('title', 'Browser spelling and grammar check is on');
  button.dataset.fwoSpellcheckFixed = 'true';
}

export function WordEditorBrandMobilePolish() {
  useEffect(() => {
    const apply = () => {
      keepSpellcheckOn();
      removeHelpInfoItem();
      markSpellcheckStatus();
    };

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['spellcheck'] });

    const preventSpellcheckToggle = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const toolbarButton = target?.closest<HTMLButtonElement>('.docs-toolbar button[aria-label^="Spelling"]');
      const menuButton = target?.closest<HTMLButtonElement>('.fwo-main-menu-item');
      const isMenuSpellcheck = menuButton?.textContent?.trim() === 'Spelling and grammar';
      if (!toolbarButton && !isMenuSpellcheck) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      keepSpellcheckOn();
      markSpellcheckStatus();
    };

    document.addEventListener('click', preventSpellcheckToggle, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', preventSpellcheckToggle, true);
    };
  }, []);

  return (
    <style jsx global>{`
      /* DOC321 brand in the editor chrome. */
      .editor-route .docs-file-link {
        width: 132px !important;
        height: 38px !important;
        margin-right: 10px !important;
        background: url('/doc321-logo.svg') left center / contain no-repeat !important;
      }
      .editor-route .docs-file-glyph { display: none !important; }

      /* Browser spelling and grammar stays enabled while editing. */
      .docs-toolbar button[data-fwo-spellcheck-fixed='true'] {
        color: #0b57d0 !important;
        background: #e8f0fe !important;
        cursor: default !important;
      }

      /* Clear document heading hierarchy. Inline document formatting can still override these defaults. */
      .docs-editor-workspace .fwo-page-sheet h1,
      .docs-editor-workspace .fwo-page-sheet h2,
      .docs-editor-workspace .fwo-page-sheet h3,
      .docs-editor-workspace .fwo-page-sheet h4,
      .docs-editor-workspace .fwo-page-sheet h5,
      .docs-editor-workspace .fwo-page-sheet h6 {
        color: inherit;
        font-family: inherit;
        font-weight: 700;
        letter-spacing: normal;
      }
      .docs-editor-workspace .fwo-page-sheet h1 { margin: 0 0 14pt; font-size: 28pt; line-height: 1.16; }
      .docs-editor-workspace .fwo-page-sheet h2 { margin: 18pt 0 10pt; font-size: 22pt; line-height: 1.2; }
      .docs-editor-workspace .fwo-page-sheet h3 { margin: 16pt 0 8pt; font-size: 18pt; line-height: 1.24; }
      .docs-editor-workspace .fwo-page-sheet h4 { margin: 14pt 0 7pt; font-size: 15pt; line-height: 1.28; }
      .docs-editor-workspace .fwo-page-sheet h5 { margin: 12pt 0 6pt; font-size: 13pt; line-height: 1.3; }
      .docs-editor-workspace .fwo-page-sheet h6 { margin: 10pt 0 5pt; font-size: 11pt; line-height: 1.35; }

      @media (max-width: 900px) {
        .editor-route { min-height: 100dvh; height: 100dvh; overflow: hidden; }
        .word-app.docs-word-app {
          min-height: 100dvh !important;
          height: 100dvh !important;
        }
        .editor-route .docs-file-link { width: 108px !important; height: 32px !important; margin-right: 6px !important; }
        .editor-route .docs-document-title { max-width: 150px !important; font-size: 15px !important; }
        .editor-route .docs-title-icon { display: none !important; }
        .editor-route .docs-right { padding-left: 4px !important; gap: 2px !important; }
        .editor-route .docs-right > *:not(.fwo-header-download-host) { display: none !important; }
        .editor-route .fwo-header-download-host { display: flex !important; }
        .editor-route .fwo-main-menu-row {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .editor-route .fwo-main-menu-row::-webkit-scrollbar { display: none; }
      }

      @media (max-width: 720px) {
        .word-app.docs-word-app {
          grid-template-rows: 104px minmax(0, 1fr) 0 !important;
          background: #f3f6fa !important;
        }
        .editor-route .docs-chrome { height: 104px !important; }
        .editor-route .docs-topbar {
          height: 62px !important;
          min-height: 62px !important;
          padding: 0 6px !important;
          align-items: center !important;
        }
        .editor-route .docs-left { min-width: 0 !important; align-items: center !important; }
        .editor-route .docs-file-link { width: 96px !important; height: 28px !important; flex: 0 0 96px !important; }
        .editor-route .docs-title-stack {
          min-width: 0 !important;
          grid-template-rows: 30px 28px !important;
          align-content: center !important;
        }
        .editor-route .docs-title-line { height: 30px !important; }
        .editor-route .docs-document-title {
          width: 118px !important;
          max-width: 118px !important;
          height: 27px !important;
          font-size: 14px !important;
          line-height: 25px !important;
        }
        .editor-route .docs-right { height: 62px !important; flex: 0 0 auto !important; }
        .editor-route .fwo-header-download-button {
          width: 38px !important;
          min-width: 38px !important;
          height: 36px !important;
          padding: 0 !important;
          border-radius: 18px !important;
        }
        .editor-route .fwo-header-download-button .fwo-header-download-chevron { display: none !important; }
        .editor-route .fwo-main-menu-trigger { height: 28px !important; padding: 0 7px !important; font-size: 13px !important; }
        .editor-route .docs-toolbar {
          box-sizing: border-box !important;
          width: calc(100% - 8px) !important;
          max-width: calc(100% - 8px) !important;
          height: 40px !important;
          min-height: 40px !important;
          margin: 2px 4px 0 !important;
          padding: 0 6px !important;
          border-radius: 18px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scroll-padding-inline: 6px;
        }
        .editor-route .docs-toolbar-divider { margin-inline: 4px !important; }
        .editor-route .docs-editor-workspace {
          min-height: 0 !important;
          overflow: auto !important;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .editor-route .docs-editor-workspace .paper-stage {
          min-height: 100% !important;
          justify-content: flex-start !important;
          padding: 8px 6px 54px !important;
        }
        .editor-route .docs-editor-workspace .editor-page {
          width: 210mm !important;
          min-width: 210mm !important;
          margin: 0 !important;
          zoom: calc((100vw - 12px) / 794) !important;
          transform-origin: top left !important;
        }
        .editor-route .docs-editor-workspace .fwo-page-sheet + .fwo-page-sheet { margin-top: 18px !important; }
        .editor-route .docs-statusbar { display: none !important; }
        .editor-route .fwo-outline { display: none !important; }
        .fwo-menu-layer { left: 6px !important; right: 6px !important; max-width: calc(100vw - 12px) !important; }
        .fwo-main-menu-panel { width: auto !important; max-width: 100% !important; }
      }

      @media (max-width: 420px) {
        .editor-route .docs-file-link { width: 86px !important; flex-basis: 86px !important; }
        .editor-route .docs-document-title { width: 102px !important; max-width: 102px !important; }
        .editor-route .docs-toolbar .docs-toolbar-divider { margin-inline: 3px !important; }
      }
    `}</style>
  );
}
