export function ChecklistVisibilityFix() {
  return (
    <style>{`
      .editor-page .fwo-checklist {
        list-style: none !important;
        padding-left: 30px !important;
      }

      .editor-page .fwo-checklist li[data-fwo-check-item] {
        position: relative !important;
        min-height: 1.55em !important;
      }

      .editor-page .fwo-checklist li[data-fwo-check-item]::before,
      .editor-page .fwo-check-check li[data-fwo-check-item]::before {
        content: '' !important;
        position: absolute !important;
        left: -24px !important;
        top: 0.2em !important;
        width: 15px !important;
        height: 15px !important;
        box-sizing: border-box !important;
        display: block !important;
        border: 1.5px solid #5f6368 !important;
        border-radius: 2px !important;
        background: #fff !important;
        color: transparent !important;
        line-height: 15px !important;
      }

      .editor-page .fwo-checklist li[data-fwo-check-item][data-checked='true']::before,
      .editor-page .fwo-check-check li[data-fwo-check-item][data-checked='true']::before {
        border-color: #0b57d0 !important;
        background: #0b57d0 !important;
      }

      .editor-page .fwo-checklist li[data-fwo-check-item]::after {
        content: '';
        pointer-events: none;
      }

      .editor-page .fwo-checklist li[data-fwo-check-item][data-checked='true']::after {
        content: '✓' !important;
        position: absolute !important;
        left: -22px !important;
        top: 0.02em !important;
        width: 11px !important;
        height: 15px !important;
        display: grid !important;
        place-items: center !important;
        color: #fff !important;
        font: 700 11px/1 Arial, Helvetica, sans-serif !important;
        text-decoration: none !important;
      }

      .fwo-check-grid button span {
        color: #3c4043 !important;
        font-family: Arial, 'Segoe UI Symbol', sans-serif !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        line-height: 1.35 !important;
        white-space: nowrap !important;
      }

      @media (max-width: 520px) {
        .editor-page .fwo-checklist li[data-fwo-check-item]::before,
        .editor-page .fwo-check-check li[data-fwo-check-item]::before {
          width: 16px !important;
          height: 16px !important;
        }

        .editor-page .fwo-checklist li[data-fwo-check-item][data-checked='true']::after {
          width: 12px !important;
          height: 16px !important;
          font-size: 12px !important;
        }
      }
    `}</style>
  );
}
