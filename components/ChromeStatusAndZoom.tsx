'use client';

import { useEffect } from 'react';

export function ChromeStatusAndZoom() {
  useEffect(() => {
    const folderButton = document.querySelector<HTMLButtonElement>('button[aria-label="Move document"]');
    const saveButton = document.querySelector<HTMLButtonElement>('.docs-save-cloud');
    const fileInput = document.querySelector<HTMLInputElement>('input.hidden-input[type="file"][accept*=".docx"]');
    const zoomSelect = document.querySelector<HTMLSelectElement>('.docs-zoom-select');
    const editor = document.querySelector<HTMLElement>('.editor-page');

    if (!folderButton || !saveButton || !zoomSelect) return;

    folderButton.setAttribute('aria-label', 'Open document');
    folderButton.setAttribute('title', 'Open document');
    folderButton.classList.add('fwo-open-document');

    const onFolderClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      fileInput?.click();
    };
    folderButton.addEventListener('click', onFolderClick, true);

    saveButton.classList.add('fwo-save-status');

    const updateSaveStatus = () => {
      const offline = !navigator.onLine;
      const saving = saveButton.dataset.saving === 'true';
      const label = offline ? 'Offline' : saving ? 'Saving…' : 'Saved';
      saveButton.dataset.fwoStatus = label;
      saveButton.dataset.offline = String(offline);
      saveButton.setAttribute('aria-label', label);
      saveButton.setAttribute('title', label);
    };

    updateSaveStatus();
    window.addEventListener('online', updateSaveStatus);
    window.addEventListener('offline', updateSaveStatus);

    const saveObserver = new MutationObserver(updateSaveStatus);
    saveObserver.observe(saveButton, { attributes: true, attributeFilter: ['data-saving'] });

    zoomSelect.style.display = 'none';

    const zoomWrap = document.createElement('div');
    zoomWrap.className = 'fwo-zoom-wrap';

    const zoomTrigger = document.createElement('button');
    zoomTrigger.type = 'button';
    zoomTrigger.className = 'fwo-zoom-trigger';
    zoomTrigger.setAttribute('aria-haspopup', 'menu');
    zoomTrigger.setAttribute('aria-expanded', 'false');
    zoomTrigger.setAttribute('aria-label', 'Zoom');
    zoomTrigger.setAttribute('title', 'Zoom');
    zoomTrigger.innerHTML = '<span class="fwo-zoom-label">100%</span><span class="fwo-zoom-caret">▾</span>';

    const zoomMenu = document.createElement('div');
    zoomMenu.className = 'fwo-zoom-menu';
    zoomMenu.setAttribute('role', 'menu');
    zoomMenu.setAttribute('aria-label', 'Zoom level');
    zoomMenu.hidden = true;
    document.body.appendChild(zoomMenu);

    const currentZoomText = () => {
      const option = zoomSelect.options[zoomSelect.selectedIndex];
      return option?.textContent?.trim() || `${zoomSelect.value || 100}%`;
    };

    const updateZoomLabel = () => {
      const label = zoomTrigger.querySelector<HTMLElement>('.fwo-zoom-label');
      if (label) label.textContent = currentZoomText();
      if (!zoomMenu.hidden) renderZoomItems();
    };

    const positionZoomMenu = () => {
      const rect = zoomTrigger.getBoundingClientRect();
      const edge = 8;
      const gap = 6;
      const width = Math.min(184, Math.max(132, window.innerWidth - edge * 2));
      const left = Math.min(Math.max(edge, rect.left), Math.max(edge, window.innerWidth - width - edge));
      const top = rect.bottom + gap;
      const availableHeight = Math.max(96, window.innerHeight - top - edge);

      zoomMenu.style.left = `${left}px`;
      zoomMenu.style.top = `${top}px`;
      zoomMenu.style.width = `${width}px`;
      zoomMenu.style.maxHeight = `${Math.min(320, availableHeight)}px`;
    };

    const closeZoomMenu = () => {
      zoomMenu.hidden = true;
      zoomTrigger.setAttribute('aria-expanded', 'false');
    };

    const chooseZoom = (value: string) => {
      zoomSelect.value = value;
      zoomSelect.dispatchEvent(new Event('change', { bubbles: true }));
      updateZoomLabel();
      closeZoomMenu();
      editor?.focus({ preventScroll: true });
    };

    const renderZoomItems = () => {
      zoomMenu.replaceChildren();
      Array.from(zoomSelect.options).forEach((option) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fwo-zoom-item';
        button.setAttribute('role', 'menuitemradio');
        button.setAttribute('aria-checked', String(option.value === zoomSelect.value));
        button.dataset.selected = String(option.value === zoomSelect.value);
        button.innerHTML = `<span class="fwo-zoom-check">${option.value === zoomSelect.value ? '✓' : ''}</span><span class="fwo-zoom-option"></span>`;
        const text = button.querySelector<HTMLElement>('.fwo-zoom-option');
        if (text) text.textContent = option.textContent || `${option.value}%`;
        button.addEventListener('mousedown', (event) => event.preventDefault());
        button.addEventListener('click', () => chooseZoom(option.value));
        zoomMenu.appendChild(button);
      });
    };

    updateZoomLabel();
    renderZoomItems();

    zoomTrigger.addEventListener('mousedown', (event) => event.preventDefault());
    zoomTrigger.addEventListener('click', () => {
      if (!zoomMenu.hidden) {
        closeZoomMenu();
        return;
      }
      renderZoomItems();
      positionZoomMenu();
      zoomMenu.hidden = false;
      zoomTrigger.setAttribute('aria-expanded', 'true');
    });

    zoomTrigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (zoomMenu.hidden) {
          renderZoomItems();
          positionZoomMenu();
          zoomMenu.hidden = false;
          zoomTrigger.setAttribute('aria-expanded', 'true');
        }
        zoomMenu.querySelector<HTMLButtonElement>('button')?.focus();
      }
    });

    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!zoomWrap.contains(target) && !zoomMenu.contains(target)) closeZoomMenu();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !zoomMenu.hidden) {
        event.preventDefault();
        closeZoomMenu();
        zoomTrigger.focus();
      }
    };

    const reposition = () => {
      if (!zoomMenu.hidden) positionZoomMenu();
    };

    zoomSelect.addEventListener('change', updateZoomLabel);
    document.addEventListener('mousedown', closeOutside);
    window.addEventListener('keydown', onEscape);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    const zoomObserver = new MutationObserver(updateZoomLabel);
    if (editor) zoomObserver.observe(editor, { attributes: true, attributeFilter: ['style'] });

    zoomWrap.appendChild(zoomTrigger);
    zoomSelect.parentElement?.insertBefore(zoomWrap, zoomSelect);

    const style = document.createElement('style');
    style.dataset.fwoChromeStatusZoom = 'true';
    style.textContent = `
      .docs-title-line .fwo-open-document {
        display: inline-grid !important;
      }

      .docs-title-line .fwo-save-status {
        display: inline-grid !important;
        color: #5f6368;
      }

      .docs-title-line .fwo-save-status .material-symbols-rounded {
        font-size: 18px;
      }

      .docs-title-line .fwo-save-status[data-saving='true']:not([data-offline='true']) {
        color: #0b57d0;
      }

      .docs-title-line .fwo-save-status[data-saving='true']:not([data-offline='true']) .material-symbols-rounded {
        animation: fwo-save-pulse 850ms ease-in-out infinite alternate;
      }

      .docs-title-line .fwo-save-status[data-offline='true'] {
        color: #5f6368;
        background: #eef0f2;
      }

      @keyframes fwo-save-pulse {
        from { opacity: .45; }
        to { opacity: 1; }
      }

      .fwo-zoom-wrap {
        position: relative;
        flex: 0 0 auto;
        min-width: 0;
        font-family: Arial, Helvetica, sans-serif;
      }

      .fwo-zoom-trigger {
        height: 28px;
        min-width: 72px;
        padding: 0 8px 0 10px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #3c4043;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 13px;
        cursor: pointer;
      }

      .fwo-zoom-trigger:hover,
      .fwo-zoom-trigger[aria-expanded='true'] {
        background: #e8eaed;
      }

      .fwo-zoom-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .fwo-zoom-caret {
        flex: 0 0 auto;
        color: #5f6368;
        font-size: 10px;
      }

      .fwo-zoom-menu {
        position: fixed;
        z-index: 5000;
        box-sizing: border-box;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 5px;
        background: #fff;
        border: 1px solid #dadce0;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(60,64,67,.24), 0 2px 6px rgba(60,64,67,.12);
        font-family: Arial, Helvetica, sans-serif;
        scrollbar-gutter: stable;
      }

      .fwo-zoom-menu[hidden] {
        display: none !important;
      }

      .fwo-zoom-item {
        width: 100%;
        min-height: 36px;
        padding: 5px 9px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        color: #202124;
        display: grid;
        grid-template-columns: 18px minmax(0,1fr);
        align-items: center;
        gap: 7px;
        text-align: left;
        font: 400 13px/1.25 Arial, Helvetica, sans-serif;
        cursor: pointer;
      }

      .fwo-zoom-item:hover,
      .fwo-zoom-item:focus-visible {
        background: #f1f3f4;
        outline: 0;
      }

      .fwo-zoom-item[data-selected='true'] {
        background: #eef3fb;
        color: #0b57d0;
      }

      .fwo-zoom-check {
        width: 18px;
        font-weight: 700;
      }

      .fwo-zoom-menu::-webkit-scrollbar { width: 10px; }
      .fwo-zoom-menu::-webkit-scrollbar-thumb {
        background: #c4c7c5;
        border: 3px solid #fff;
        border-radius: 10px;
      }

      @media (max-width: 650px) {
        .fwo-zoom-trigger {
          min-width: 64px;
          padding-left: 8px;
          font-size: 12px;
        }
        .fwo-zoom-item {
          min-height: 40px;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      folderButton.removeEventListener('click', onFolderClick, true);
      folderButton.classList.remove('fwo-open-document');
      saveButton.classList.remove('fwo-save-status');
      delete saveButton.dataset.fwoStatus;
      delete saveButton.dataset.offline;
      saveObserver.disconnect();
      window.removeEventListener('online', updateSaveStatus);
      window.removeEventListener('offline', updateSaveStatus);
      zoomObserver.disconnect();
      zoomSelect.removeEventListener('change', updateZoomLabel);
      document.removeEventListener('mousedown', closeOutside);
      window.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      zoomWrap.remove();
      zoomMenu.remove();
      style.remove();
      zoomSelect.style.display = '';
    };
  }, []);

  return null;
}
