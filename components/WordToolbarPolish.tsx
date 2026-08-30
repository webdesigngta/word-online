'use client';

import { useEffect } from 'react';

const SINGLE_TRIGGER_COMBOS = [
  ['Image options', 'Insert image'],
  ['Alignment options', 'Align left'],
  ['Checklist options', 'Checklist'],
  ['Editing mode options', 'Editing mode'],
] as const;

function getEditor() {
  return document.querySelector<HTMLElement>('.editor-page');
}

export function WordToolbarPolish() {
  useEffect(() => {
    const toolbar = document.querySelector<HTMLElement>('.docs-toolbar');
    const editor = getEditor();
    if (!toolbar || !editor) return;

    const syncMode = () => {
      const combo = toolbar.querySelector<HTMLElement>('.docs-toolbar-mode-group .docs-toolbar-combo');
      if (!combo) return;
      const mode = editor.dataset.fwoMode || 'editing';
      combo.dataset.fwoMode = mode;
      const main = combo.querySelector<HTMLButtonElement>('button[aria-label="Editing mode"]');
      const menuTrigger = combo.querySelector<HTMLButtonElement>('button[aria-label="Editing mode options"]');
      menuTrigger?.setAttribute('aria-haspopup', 'menu');
      if (main && !main.querySelector('.fwo-editing-mode-text')) {
        const text = document.createElement('span');
        text.className = 'fwo-editing-mode-text';
        main.appendChild(text);
      }
      const text = main?.querySelector<HTMLElement>('.fwo-editing-mode-text');
      if (text) text.textContent = mode === 'suggesting' ? 'Suggesting' : mode === 'viewing' ? 'Viewing' : 'Editing';
    };

    const polishColorIcon = (label: 'Text color' | 'Highlight color', glyph: string, kind: 'text' | 'highlight') => {
      const input = toolbar.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
      const tool = toolbar.querySelector<HTMLElement>(`label[title="${label}"]`) ?? input?.closest<HTMLElement>('.docs-color-tool');
      if (!tool) return;
      tool.dataset.fwoColorKind = kind;
      const icon = tool.querySelector<HTMLElement>('.material-symbols-rounded,.material-symbols-outlined,.material-icons');
      if (!icon) return;
      if (icon.textContent?.trim() !== glyph) icon.textContent = glyph;
      icon.style.setProperty('color', '#3c4043', 'important');
    };

    const polishCombos = () => {
      for (const [arrowLabel, mainLabel] of SINGLE_TRIGGER_COMBOS) {
        const arrow = toolbar.querySelector<HTMLButtonElement>(`button[aria-label="${arrowLabel}"]`);
        const main = toolbar.querySelector<HTMLButtonElement>(`button[aria-label="${mainLabel}"]`);
        const combo = arrow?.closest<HTMLElement>('.docs-toolbar-combo') ?? main?.closest<HTMLElement>('.docs-toolbar-combo');
        if (combo) combo.dataset.fwoSingleTrigger = 'true';
      }
      const hideToolbar = toolbar.querySelector<HTMLElement>('[aria-label="Hide toolbar"]');
      if (hideToolbar) hideToolbar.dataset.fwoRemovedControl = 'true';

      polishColorIcon('Text color', 'format_color_text', 'text');
      polishColorIcon('Highlight color', 'format_color_fill', 'highlight');
      syncMode();
    };

    polishCombos();

    const toolbarObserver = new MutationObserver(polishCombos);
    toolbarObserver.observe(toolbar, { childList: true, subtree: true });

    const modeObserver = new MutationObserver(syncMode);
    modeObserver.observe(editor, { attributes: true, attributeFilter: ['data-fwo-mode'] });

    return () => {
      toolbarObserver.disconnect();
      modeObserver.disconnect();
    };
  }, []);

  return (
    <style jsx global>{`
      .docs-toolbar [data-fwo-removed-control='true'],
      .fwo-show-toolbar {
        display: none !important;
      }

      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true'] {
        position: relative;
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding-right: 16px;
        border-radius: 15px;
        transition: background-color .12s ease, border-color .12s ease, box-shadow .12s ease;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true']:hover {
        background: #e2e7ec;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true'] > .docs-toolbar-button {
        pointer-events: none;
        width: auto !important;
        min-width: 28px;
        padding-left: 6px !important;
        padding-right: 3px !important;
        background: transparent !important;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true'] > .docs-toolbar-split {
        position: absolute !important;
        inset: 0 !important;
        z-index: 4;
        width: 100% !important;
        height: 100% !important;
        opacity: 0 !important;
        cursor: pointer;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true']::after,
      .docs-toolbar button[aria-label='Line spacing']::after,
      .docs-toolbar button[aria-label='Bulleted list']::after,
      .docs-toolbar button[aria-label='Numbered list']::after {
        content: '' !important;
        position: absolute;
        width: 5px;
        height: 5px;
        border-right: 1.4px solid #5f6368;
        border-bottom: 1.4px solid #5f6368;
        transform: rotate(45deg) !important;
        pointer-events: none;
      }
      .docs-toolbar .docs-toolbar-combo[data-fwo-single-trigger='true']::after {
        right: 6px;
        top: 10px;
      }
      .docs-toolbar button[aria-label='Line spacing'],
      .docs-toolbar button[aria-label='Bulleted list'],
      .docs-toolbar button[aria-label='Numbered list'] {
        position: relative;
        width: auto !important;
        min-width: 38px;
        padding-right: 14px !important;
      }
      .docs-toolbar button[aria-label='Line spacing']::after,
      .docs-toolbar button[aria-label='Bulleted list']::after,
      .docs-toolbar button[aria-label='Numbered list']::after {
        right: 4px;
        top: 10px;
      }

      .docs-toolbar-select {
        appearance: none !important;
        -webkit-appearance: none !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3.25 4.75 6 7.5l2.75-2.75' fill='none' stroke='%235f6368' stroke-width='1.35' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
        background-repeat: no-repeat !important;
        background-position: right 6px center !important;
        background-size: 12px 12px !important;
        padding-right: 23px !important;
      }
      .fwo-font-caret,
      .fwo-style-caret {
        box-sizing: border-box;
        width: 6px !important;
        height: 6px !important;
        margin: -3px 2px 0 3px !important;
        border-right: 1.4px solid #5f6368 !important;
        border-bottom: 1.4px solid #5f6368 !important;
        color: transparent !important;
        font-size: 0 !important;
        line-height: 0 !important;
        transform: rotate(45deg);
        flex: 0 0 6px !important;
      }

      /* Editing/Suggesting/Viewing is a real menu, so give it the visual
         treatment of a dropdown instead of leaving it looking like plain text. */
      .docs-toolbar-mode-group .docs-toolbar-combo[data-fwo-single-trigger='true'] {
        box-sizing: border-box;
        min-width: 108px !important;
        height: 30px !important;
        padding: 0 24px 0 3px !important;
        border: 1px solid #c4c7c5 !important;
        border-radius: 8px !important;
        background: #fff !important;
        box-shadow: 0 1px 1px rgba(60,64,67,.08);
      }
      .docs-toolbar-mode-group .docs-toolbar-combo[data-fwo-single-trigger='true']:hover {
        background: #f8fafd !important;
        border-color: #9aa0a6 !important;
      }
      .docs-toolbar-mode-group .docs-toolbar-combo[data-fwo-single-trigger='true']:focus-within {
        border-color: #0b57d0 !important;
        box-shadow: 0 0 0 1px #0b57d0;
      }
      .docs-toolbar-mode-group .docs-toolbar-combo[data-fwo-single-trigger='true']::after {
        right: 9px !important;
        top: 9px !important;
        width: 7px !important;
        height: 7px !important;
        border-right-width: 1.5px !important;
        border-bottom-width: 1.5px !important;
      }
      .docs-toolbar-mode-group .docs-toolbar-button {
        gap: 6px;
        min-width: 78px !important;
        padding-left: 5px !important;
      }
      .docs-toolbar-mode-group .docs-toolbar-button .material-symbols-rounded,
      .docs-toolbar-mode-group .docs-toolbar-button .material-symbols-outlined,
      .docs-toolbar-mode-group .docs-toolbar-button .material-icons {
        font-size: 18px !important;
      }
      .fwo-editing-mode-text {
        color: #3c4043;
        font: 500 12.5px/1 Arial, Helvetica, sans-serif;
        white-space: nowrap;
      }

      .docs-color-tool[data-fwo-color-kind='text'] .material-symbols-rounded,
      .docs-color-tool[data-fwo-color-kind='text'] .material-symbols-outlined,
      .docs-color-tool[data-fwo-color-kind='text'] .material-icons,
      .docs-color-tool[data-fwo-color-kind='highlight'] .material-symbols-rounded,
      .docs-color-tool[data-fwo-color-kind='highlight'] .material-symbols-outlined,
      .docs-color-tool[data-fwo-color-kind='highlight'] .material-icons {
        color: #3c4043 !important;
      }

      .fwo-outline {
        padding: 20px 14px 18px !important;
        background: #f8fafc !important;
        border-right: 1px solid #e5eaf0 !important;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }
      .fwo-outline-label {
        margin: 0 8px 13px !important;
        color: #1f2937 !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        letter-spacing: .01em;
      }
      .fwo-outline-tree {
        margin: 0 !important;
        padding: 0 0 10px !important;
      }
      .fwo-outline-item {
        min-height: 35px !important;
        margin: 2px 0 !important;
        padding-top: 7px !important;
        padding-right: 9px !important;
        padding-bottom: 7px !important;
        border-radius: 8px !important;
        color: #475569 !important;
        font-size: 13px !important;
        line-height: 1.35 !important;
        transition: background-color .12s ease, color .12s ease !important;
      }
      .fwo-outline-item:hover {
        background: #eef4fb !important;
        color: #174ea6 !important;
      }
      .fwo-outline-item.is-active {
        background: #e8f0fe !important;
        color: #0b57d0 !important;
        font-weight: 600 !important;
      }
      .fwo-outline-item.is-active::before {
        left: 1px !important;
        top: 8px !important;
        bottom: 8px !important;
        width: 3px !important;
        border-radius: 3px !important;
      }
    `}</style>
  );
}
