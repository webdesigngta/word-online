'use client';

import { useEffect } from 'react';

export function WordEditorMobileUsability() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;

    const updateMetrics = () => {
      const visibleHeight = Math.max(360, Math.round(viewport?.height ?? window.innerHeight));
      root.style.setProperty('--doc321-editor-vvh', `${visibleHeight}px`);

      const width = Math.round(viewport?.width ?? window.innerWidth);
      if (width > 760 && width <= 1024) {
        const scale = Math.min(1, Math.max(0.86, (width - 32) / 794));
        root.style.setProperty('--doc321-tablet-scale', scale.toFixed(4));
      } else {
        root.style.removeProperty('--doc321-tablet-scale');
      }
    };

    updateMetrics();
    window.addEventListener('resize', updateMetrics, { passive: true });
    window.addEventListener('orientationchange', updateMetrics, { passive: true });
    viewport?.addEventListener('resize', updateMetrics, { passive: true });
    viewport?.addEventListener('scroll', updateMetrics, { passive: true });

    return () => {
      window.removeEventListener('resize', updateMetrics);
      window.removeEventListener('orientationchange', updateMetrics);
      viewport?.removeEventListener('resize', updateMetrics);
      viewport?.removeEventListener('scroll', updateMetrics);
      root.style.removeProperty('--doc321-editor-vvh');
      root.style.removeProperty('--doc321-tablet-scale');
    };
  }, []);

  return (
    <style jsx global>{`
      @media (max-width: 1024px) {
        .editor-route {
          width: 100vw !important;
          max-width: 100vw !important;
          min-height: var(--doc321-editor-vvh, 100dvh) !important;
          height: var(--doc321-editor-vvh, 100dvh) !important;
          overflow: hidden !important;
          overscroll-behavior: none;
        }
        .editor-route .word-app.docs-word-app {
          width: 100% !important;
          max-width: 100vw !important;
          min-height: var(--doc321-editor-vvh, 100dvh) !important;
          height: var(--doc321-editor-vvh, 100dvh) !important;
          overflow: hidden !important;
        }
        .editor-route .fwo-outline,
        .editor-route .docs-statusbar {
          display: none !important;
        }
        .editor-route .docs-toolbar {
          min-height: 44px !important;
          height: 44px !important;
          padding: 0 7px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          overscroll-behavior-x: contain;
          scroll-behavior: smooth;
          scroll-padding-inline: 8px;
          touch-action: pan-x;
          -webkit-overflow-scrolling: touch;
        }
        .editor-route .docs-toolbar-group {
          height: 38px !important;
        }
        .editor-route .docs-toolbar-button,
        .editor-route .docs-toolbar-split,
        .editor-route .docs-color-tool {
          min-width: 34px !important;
          width: 34px !important;
          height: 34px !important;
          flex-basis: 34px !important;
          border-radius: 10px !important;
        }
        .editor-route .docs-toolbar-combo {
          height: 34px !important;
        }
        .editor-route .docs-toolbar-select,
        .editor-route .fwo-style-trigger,
        .editor-route .fwo-font-trigger,
        .editor-route .fwo-font-size-trigger {
          min-height: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
        }
        .editor-route .docs-toolbar-divider {
          height: 26px !important;
          margin-inline: 5px !important;
        }
        .editor-route .docs-editor-workspace {
          min-height: 0 !important;
          height: 100% !important;
          overflow: auto !important;
          overscroll-behavior: contain;
          touch-action: pan-x pan-y;
          -webkit-overflow-scrolling: touch;
        }
        .editor-route .docs-editor-workspace .paper-stage {
          min-height: 100% !important;
          padding-bottom: max(48px, env(safe-area-inset-bottom)) !important;
        }
        .fwo-menu-layer,
        .fwo-gallery-popover,
        .fwo-local-popover,
        .fwo-local-panel,
        .fwo-font-menu,
        .fwo-font-size-menu,
        .fwo-style-menu {
          max-width: calc(100vw - 12px) !important;
        }
      }

      /* Tablets keep A4 proportions but fit the page to the available width.
         The scale never drops below .86 so editing text stays comfortably readable. */
      @media (min-width: 761px) and (max-width: 1024px) {
        .editor-route .word-app.docs-word-app {
          grid-template-rows: 100px minmax(0, 1fr) 0 !important;
        }
        .editor-route .docs-chrome {
          height: 100px !important;
        }
        .editor-route .docs-toolbar {
          margin-top: 3px !important;
        }
        .editor-route .docs-editor-workspace .paper-stage {
          justify-content: center !important;
          padding: 12px 12px 64px !important;
        }
        .editor-route .docs-editor-workspace .editor-page {
          zoom: var(--doc321-tablet-scale, 1) !important;
          transform: none !important;
          transform-origin: top center !important;
          margin-inline: auto !important;
        }
      }

      /* Phones use a reflowed document page instead of shrinking a desktop A4
         sheet to 35–50%. This keeps text, the caret, and selection handles usable. */
      @media (max-width: 760px) {
        .editor-route .word-app.docs-word-app {
          grid-template-rows: 106px minmax(0, 1fr) 0 !important;
        }
        .editor-route .docs-chrome {
          height: 106px !important;
          min-height: 106px !important;
        }
        .editor-route .docs-topbar {
          height: 60px !important;
          min-height: 60px !important;
          padding: 0 6px !important;
        }
        .editor-route .docs-file-link {
          width: 88px !important;
          flex: 0 0 88px !important;
          height: 28px !important;
          margin-right: 5px !important;
        }
        .editor-route .docs-title-stack {
          grid-template-rows: 30px 26px !important;
        }
        .editor-route .docs-document-title {
          width: min(116px, 30vw) !important;
          max-width: min(116px, 30vw) !important;
          font-size: 14px !important;
        }
        .editor-route .fwo-main-menu-row {
          height: 26px !important;
        }
        .editor-route .fwo-main-menu-trigger {
          height: 26px !important;
          min-height: 26px !important;
          padding: 0 7px !important;
          font-size: 12.5px !important;
        }
        .editor-route .docs-toolbar {
          width: calc(100% - 6px) !important;
          max-width: calc(100% - 6px) !important;
          min-height: 43px !important;
          height: 43px !important;
          margin: 3px 3px 0 !important;
          padding-inline: 5px !important;
          border-radius: 16px !important;
        }

        /* Reduce horizontal travel before the most-used formatting controls. */
        .editor-route .docs-toolbar button[aria-label='Search menus'],
        .editor-route .docs-toolbar button[aria-label='Print'],
        .editor-route .docs-toolbar button[aria-label^='Spelling'],
        .editor-route .docs-toolbar button[aria-label='Paint format'],
        .editor-route .docs-toolbar-zoom-group {
          display: none !important;
        }
        .editor-route .docs-toolbar-history-group {
          padding-left: 1px !important;
        }

        .editor-route .docs-editor-workspace .paper-stage {
          display: block !important;
          width: 100% !important;
          padding: 6px 4px max(54px, env(safe-area-inset-bottom)) !important;
          background: #eef2f7 !important;
        }
        .editor-route .docs-editor-workspace .editor-page {
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          margin: 0 !important;
          zoom: 1 !important;
          transform: none !important;
          transform-origin: top left !important;
          line-height: 1.55 !important;
        }
        .editor-route .docs-editor-workspace .fwo-page-sheet {
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          height: auto !important;
          min-height: max(640px, calc((100vw - 8px) * 1.30)) !important;
          padding: 30px 22px 50px !important;
          overflow: visible !important;
          border: 1px solid #d3d7dc !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 5px rgba(60,64,67,.16) !important;
        }
        .editor-route .docs-editor-workspace .fwo-page-sheet + .fwo-page-sheet {
          margin-top: 10px !important;
        }
        .editor-route .docs-editor-workspace .fwo-page-sheet p,
        .editor-route .docs-editor-workspace .fwo-page-sheet li,
        .editor-route .docs-editor-workspace .fwo-page-sheet td,
        .editor-route .docs-editor-workspace .fwo-page-sheet th {
          overflow-wrap: anywhere;
        }
        .editor-route .docs-editor-workspace .fwo-page-sheet table {
          max-width: 100% !important;
          overflow-x: auto;
        }
        .editor-route .docs-toolbar-mode-group .docs-toolbar-combo[data-fwo-single-trigger='true'] {
          min-width: 102px !important;
        }
        .editor-route input,
        .editor-route select,
        .editor-route textarea,
        .editor-route button {
          touch-action: manipulation;
        }
      }

      @media (max-width: 480px) {
        .editor-route .docs-file-link {
          width: 78px !important;
          flex-basis: 78px !important;
        }
        .editor-route .docs-document-title {
          width: min(96px, 27vw) !important;
          max-width: min(96px, 27vw) !important;
        }
        .editor-route .docs-toolbar-button,
        .editor-route .docs-toolbar-split,
        .editor-route .docs-color-tool {
          min-width: 33px !important;
          width: 33px !important;
          height: 33px !important;
          flex-basis: 33px !important;
        }
        .editor-route .docs-editor-workspace .fwo-page-sheet {
          min-height: 620px !important;
          padding: 26px 17px 44px !important;
        }
      }
    `}</style>
  );
}
