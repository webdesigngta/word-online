'use client';

import { useEffect } from 'react';

const uploadText = /^(choose|select|upload|open|add|browse|pick|load|import|attach)\b[\s\S]*(file|files|pdf|pdfs|docx|doc|document|documents|word|image|images|photo|photos|scan|scans|xlsx|xls|csv|pptx|ppt|presentation|presentations|rtf|odt|html|epub|markdown|md|txt)|^choose again$|^browse$/i;
const shortChooseText = /^(choose|select|upload|open|add|browse|pick|load|import|attach)\b[\s\S]{0,88}(file|files|pdf|pdfs|docx|doc|document|documents|word|image|images|photo|photos|scan|scans|xlsx|xls|csv|pptx|ppt|presentation|presentations|rtf|odt|html|epub|markdown|md|txt)[.!]?$/i;
const explicitUploadAction = /^(choose|select|upload|open|add|browse|pick|load|import|attach)\b/i;
const nonUploadAction = /\b(convert|process|download|save|merge|split|compare|extract|repair|compress|remove|protect|unlock|rotate|crop|run|create|generate|apply|submit|reset|copy)\b/i;
const readyClass = 'doc321-tool-ui-ready';

const dropSurfaceSelector = [
  '.fwo-single-drop',
  '.fwo-merge-picker',
  '.fwo-viewer-empty',
  '.document-viewer-empty',
  '.fwo-split-picker',
  '.fwo-compare-picker',
  '.fwo-image-picker',
  '.fwo-info-picker',
  '.rr-empty',
  '.swt-drop',
  '.iwt-drop',
  '.pdf-tool-input',
  '[class$="-drop"]',
  '[class$="-picker"]',
].join(',');

function textOf(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
}

function acceptMatches(input: HTMLInputElement, file: File) {
  const accept = (input.accept || '').trim().toLowerCase();
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.split(',').map((item) => item.trim()).filter(Boolean).some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

function firstMatchingInput(root: Element, files: File[]) {
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="file"]')).filter((input) => !input.disabled);
  if (!inputs.length) return null;
  if (files.length > 1) {
    const multipleMatch = inputs.find((input) => input.multiple && files.every((file) => acceptMatches(input, file)));
    if (multipleMatch) return multipleMatch;
  }
  return inputs.find((input) => acceptMatches(input, files[0])) ?? inputs[0];
}

function fileInputForTrigger(root: Element, element: HTMLElement) {
  if (element instanceof HTMLLabelElement && element.htmlFor) {
    const associated = root.querySelector<HTMLInputElement>(`#${CSS.escape(element.htmlFor)}`);
    if (associated?.type === 'file') return associated;
  }

  const dropzone = element.closest<HTMLElement>('[data-uniform-dropzone="true"]');
  const local = dropzone?.querySelector<HTMLInputElement>('input[type="file"]');
  return local ?? root.querySelector<HTMLInputElement>('input[type="file"]');
}

function isAssociatedFileLabel(root: Element, element: HTMLElement) {
  if (!(element instanceof HTMLLabelElement) || !element.htmlFor) return false;
  const target = root.querySelector<HTMLInputElement>(`#${CSS.escape(element.htmlFor)}`);
  return target?.type === 'file';
}

function buildUploadIcon() {
  const icon = document.createElement('span');
  icon.className = 'uniform-upload-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<svg class="uniform-upload-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14a2 2 0 0 0 2-2v-3"/><path d="M3 15v3a2 2 0 0 0 2 2"/></svg>';
  return icon;
}

function normalizeStandaloneEmptyPicker(surface: HTMLElement) {
  if (!(surface instanceof HTMLButtonElement)) return;
  if (!surface.matches('.document-viewer-empty,.rr-empty')) return;

  surface.setAttribute('data-uniform-empty-picker', 'true');
  surface.setAttribute('aria-label', 'Choose Files');

  if (surface.matches('.rr-empty')) {
    const strong = surface.querySelector<HTMLElement>(':scope > strong');
    const hint = surface.querySelector<HTMLElement>(':scope > span:not(.uniform-upload-icon)');
    if (strong) strong.textContent = 'Choose Files';
    if (hint) hint.textContent = 'or drag & drop files here';
    if (!surface.querySelector(':scope > .uniform-upload-icon')) surface.prepend(buildUploadIcon());
    return;
  }

  const inner = surface.querySelector<HTMLElement>(':scope > div');
  if (!inner) return;
  const strong = inner.querySelector<HTMLElement>(':scope > strong');
  const hint = Array.from(inner.children).find((child) => child instanceof HTMLElement && child.tagName === 'DIV') as HTMLElement | undefined;
  if (strong) strong.textContent = 'Choose Files';
  if (hint) hint.textContent = 'or drag & drop files here';
  if (!inner.querySelector(':scope > .uniform-upload-icon')) inner.prepend(buildUploadIcon());
}

function markDropSurfaces(root: Element) {
  if (root instanceof HTMLElement) root.removeAttribute('data-uniform-dropzone');

  const surfaces = Array.from(root.querySelectorAll<HTMLElement>(dropSurfaceSelector));
  if (!surfaces.length && root.querySelector('input[type="file"]')) {
    // The legacy DOC tools and the document viewer have a real empty-state upload
    // surface while empty and compact file controls after a file has been loaded.
    // Never turn the whole task card into a dropzone after that empty state disappears.
    if (!root.querySelector('.rr-tool,.document-viewer-tool')) {
      (root as HTMLElement).setAttribute('data-uniform-dropzone', 'true');
    }
    return;
  }

  surfaces.forEach((surface) => {
    surface.setAttribute('data-uniform-dropzone', 'true');
    normalizeStandaloneEmptyPicker(surface);
  });
}

function ensureUploadMeta(root: Element, element: HTMLElement) {
  const input = fileInputForTrigger(root, element);
  if (!input) return;

  if (!element.querySelector(':scope > .uniform-upload-icon')) element.prepend(buildUploadIcon());

  const previous = element.previousElementSibling instanceof HTMLElement && element.previousElementSibling.classList.contains('uniform-upload-meta')
    ? element.previousElementSibling
    : null;
  const next = element.nextElementSibling instanceof HTMLElement && element.nextElementSibling.classList.contains('uniform-upload-meta')
    ? element.nextElementSibling
    : null;
  let meta = previous || next;

  if (!meta) {
    meta = document.createElement('div');
    meta.className = 'uniform-upload-meta';
    meta.innerHTML = '<span class="uniform-drop-hint">or drag &amp; drop files here</span>';
    element.insertAdjacentElement('afterend', meta);
  } else {
    if (meta !== next) element.insertAdjacentElement('afterend', meta);
    const hint = meta.querySelector<HTMLElement>('.uniform-drop-hint');
    if (hint && hint.textContent !== 'or drag & drop files here') hint.textContent = 'or drag & drop files here';
    meta.querySelector('.uniform-upload-meta-dot')?.remove();
    meta.querySelector('.uniform-upload-format')?.remove();
  }
}

function shouldNormalizeTrigger(root: Element, element: HTMLElement) {
  if (element.hasAttribute('data-uniform-empty-picker')) return false;
  const text = textOf(element);
  if (!text) return isAssociatedFileLabel(root, element);
  if (uploadText.test(text) || isAssociatedFileLabel(root, element)) return true;

  const dropzone = element.closest<HTMLElement>('[data-uniform-dropzone="true"]');
  if (!dropzone || !root.querySelector('input[type="file"]')) return false;
  return explicitUploadAction.test(text) && !nonUploadAction.test(text) && text.length <= 64;
}

function markUploadTriggers(root: Element) {
  root.querySelectorAll<HTMLElement>('[data-uniform-file-picker="true"]').forEach((element) => element.removeAttribute('data-uniform-file-picker'));
  root.querySelectorAll<HTMLElement>('[data-uniform-redundant-picker="true"]').forEach((element) => element.removeAttribute('data-uniform-redundant-picker'));

  root.querySelectorAll<HTMLElement>('button,label,[role="button"],a').forEach((element) => {
    if (!shouldNormalizeTrigger(root, element)) return;
    element.setAttribute('data-uniform-file-picker', 'true');
    element.setAttribute('aria-label', 'Choose Files');

    // Only the large upload surface gets the DOC321 upload icon and drag/drop hint.
    // Compact "open another" controls keep their native icon and do not gain a second hint.
    if (element.closest('[data-uniform-dropzone="true"]')) ensureUploadMeta(root, element);
  });

  const emptyPicker = root.querySelector<HTMLElement>('[data-uniform-empty-picker="true"]');
  if (emptyPicker) {
    root.querySelectorAll<HTMLElement>('[data-uniform-file-picker="true"]').forEach((element) => {
      if (!emptyPicker.contains(element)) element.setAttribute('data-uniform-redundant-picker', 'true');
    });
  }
}

function normalizeHelperText(root: Element) {
  root.querySelectorAll<HTMLElement>('.fwo-single-meta').forEach((element) => {
    element.removeAttribute('data-uniform-upload-helper');
  });

  root.querySelectorAll<HTMLElement>('span,small,p,div').forEach((element) => {
    if (element.matches('.fwo-single-meta') || element.children.length || element.closest('button,label,[role="button"],a,.uniform-upload-meta')) return;
    const text = textOf(element);
    if (!text || !shortChooseText.test(text)) return;
    element.setAttribute('data-uniform-upload-helper', 'true');
  });
}

function refresh(root: Element) {
  markDropSurfaces(root);
  markUploadTriggers(root);
  normalizeHelperText(root);
}

export function UploadButtonNormalizer() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove(readyClass);

    const card = document.querySelector<HTMLElement>('.platform-task-card');
    if (!card) {
      html.classList.add(readyClass);
      return () => html.classList.remove(readyClass);
    }

    // Native editors and native upload interfaces already render their final controls on the server.
    if (card.querySelector('.editor-route, .notepad-is-shell, [data-native-editor="true"], [data-native-upload-ui="true"]')) {
      html.classList.add(readyClass);
      return () => html.classList.remove(readyClass);
    }

    // Normalize before revealing the legacy upload workspace so an old design never flashes first.
    refresh(card);
    html.classList.add(readyClass);

    let dragDepth = 0;
    let refreshFrame = 0;

    const onDragEnter = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files') || !card.querySelector('input[type="file"]')) return;
      event.preventDefault();
      dragDepth += 1;
      card.classList.add('is-uniform-dragover');
    };
    const onDragOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files') || !card.querySelector('input[type="file"]')) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      card.classList.add('is-uniform-dragover');
    };
    const onDragLeave = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) return;
      event.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) card.classList.remove('is-uniform-dragover');
    };
    const onDrop = (event: DragEvent) => {
      const files = Array.from(event.dataTransfer?.files || []);
      event.preventDefault();
      if (!files.length) return;
      dragDepth = 0;
      card.classList.remove('is-uniform-dragover');
      const input = firstMatchingInput(card, files);
      if (!input) return;
      const valid = files.filter((file) => acceptMatches(input, file));
      if (!valid.length) return;
      const selected = input.multiple ? valid : valid.slice(0, 1);
      const transfer = new DataTransfer();
      selected.forEach((file) => transfer.items.add(file));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    card.addEventListener('dragenter', onDragEnter);
    card.addEventListener('dragover', onDragOver);
    card.addEventListener('dragleave', onDragLeave);
    card.addEventListener('drop', onDrop);

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => refresh(card));
    });
    observer.observe(card, { childList: true, subtree: true });

    return () => {
      html.classList.remove(readyClass);
      cancelAnimationFrame(refreshFrame);
      observer.disconnect();
      card.removeEventListener('dragenter', onDragEnter);
      card.removeEventListener('dragover', onDragOver);
      card.removeEventListener('dragleave', onDragLeave);
      card.removeEventListener('drop', onDrop);
    };
  }, []);

  return (
    <style jsx global>{`
      .platform-task-page [data-uniform-redundant-picker="true"] {
        display: none !important;
      }

      .platform-task-page [data-uniform-empty-picker="true"] {
        width: 100% !important;
        cursor: pointer !important;
        align-content: center !important;
        gap: 14px !important;
        color: #0f172a !important;
      }

      .platform-task-page [data-uniform-empty-picker="true"] > div {
        display: grid !important;
        place-items: center !important;
        gap: 14px !important;
      }

      .platform-task-page [data-uniform-empty-picker="true"] > svg,
      .platform-task-page [data-uniform-empty-picker="true"] > div > svg {
        display: none !important;
      }

      .platform-task-page [data-uniform-empty-picker="true"] .uniform-upload-icon {
        width: 54px !important;
        height: 54px !important;
        border-radius: 16px !important;
        display: grid !important;
        place-items: center !important;
        background: #eef4ff !important;
        color: #2563eb !important;
      }

      .platform-task-page [data-uniform-empty-picker="true"] .uniform-upload-icon-svg {
        width: 26px !important;
        height: 26px !important;
        display: block !important;
      }

      .platform-task-page [data-uniform-empty-picker="true"] strong {
        min-width: 208px !important;
        min-height: 56px !important;
        padding: 0 28px !important;
        border-radius: 12px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #2563eb !important;
        color: #fff !important;
        box-shadow: 0 8px 20px rgba(37, 99, 235, .20) !important;
        font-size: 15px !important;
        font-weight: 800 !important;
        line-height: 1 !important;
      }

      .platform-task-page [data-uniform-empty-picker="true"]:hover strong {
        transform: translateY(-1px);
        box-shadow: 0 11px 26px rgba(37, 99, 235, .25) !important;
      }

      .platform-task-page [data-uniform-empty-picker="true"] > span:not(.uniform-upload-icon),
      .platform-task-page [data-uniform-empty-picker="true"] > div > div:last-child {
        color: #64748b !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        line-height: 1.5 !important;
      }

      @media (max-width: 640px) {
        .platform-task-page [data-uniform-empty-picker="true"] strong {
          min-width: 190px !important;
          min-height: 54px !important;
          padding: 0 22px !important;
        }
      }
    `}</style>
  );
}
