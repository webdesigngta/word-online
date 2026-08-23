export function ResponsiveDropdownStyles() {
  return (
    <style>{`
      .editor-route .docs-menu-row {
        overflow: visible !important;
      }

      .editor-route .docs-menu-popover,
      .editor-route .fwo-local-popover,
      .editor-route .fwo-local-panel,
      .editor-route .fwo-download-menu {
        overscroll-behavior: contain;
        scrollbar-width: thin;
        scrollbar-color: #c4c7c5 transparent;
      }

      .editor-route .docs-menu-popover {
        top: calc(100% + 4px);
        width: min(224px, calc(100vw - 16px));
        max-height: calc(100dvh - 104px);
        overflow-y: auto;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(60, 64, 67, .22), 0 2px 6px rgba(60, 64, 67, .10);
      }

      .editor-route .fwo-local-popover {
        max-height: calc(100dvh - 118px);
        overflow-y: auto;
        border-radius: 10px;
      }

      .editor-route .fwo-local-panel {
        max-height: calc(100dvh - 118px);
      }

      .editor-route .fwo-download-menu {
        max-height: calc(100dvh - 72px);
        overflow-y: auto;
      }

      .editor-route .docs-menu-popover::-webkit-scrollbar,
      .editor-route .fwo-local-popover::-webkit-scrollbar,
      .editor-route .fwo-local-panel::-webkit-scrollbar,
      .editor-route .fwo-download-menu::-webkit-scrollbar {
        width: 10px;
      }

      .editor-route .docs-menu-popover::-webkit-scrollbar-thumb,
      .editor-route .fwo-local-popover::-webkit-scrollbar-thumb,
      .editor-route .fwo-local-panel::-webkit-scrollbar-thumb,
      .editor-route .fwo-download-menu::-webkit-scrollbar-thumb {
        background: #c4c7c5;
        border: 3px solid #fff;
        border-radius: 10px;
      }

      @media (max-width: 650px) {
        .editor-route .docs-menu-popover {
          max-height: calc(100dvh - 102px);
        }

        .editor-route .docs-menu-wrap:nth-child(n+4) .docs-menu-popover {
          left: auto;
          right: 0;
        }

        .editor-route .fwo-local-popover,
        .editor-route .fwo-local-panel {
          max-height: calc(100dvh - 112px);
        }
      }

      @media (max-width: 420px) {
        .editor-route .docs-menu-popover {
          width: min(214px, calc(100vw - 12px));
        }
      }
    `}</style>
  );
}
