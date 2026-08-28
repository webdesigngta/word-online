'use client';

import { useEffect } from 'react';

const uploadText = /^(choose|select|upload|open|add|browse|pick|load|import|attach)\b[\s\S]*(file|files|pdf|pdfs|docx|doc|document|documents|word|image|images|photo|photos|scan|scans|xlsx|xls|csv|pptx|ppt|presentation|presentations|rtf|odt|html|epub|markdown|md|txt)|^choose again$|^browse$/i;
const shortChooseText = /^(choose|select|upload|open|add|browse|pick|load|import|attach)\b[\s\S]{0,88}(file|files|pdf|pdfs|docx|doc|document|documents|word|image|images|photo|photos|scan|scans|xlsx|xls|csv|pptx|ppt|presentation|presentations|rtf|odt|html|epub|markdown|md|txt)[.!]?$/i;
const explicitUploadAction = /^(choose|select|upload|open|add|browse|pick|load|import|attach)\b/i;
const nonUploadAction = /\b(convert|process|download|save|merge|split|compare|extract|repair|compress|remove|protect|unlock|rotate|crop|run|create|generate|apply|submit|reset|copy)\b/i;

const dropSurfaceSelector = [
  '.fwo-single-drop',
  '.fwo-merge-picker',
  '.fwo-viewer-empty',
  '.fwo-split-picker',
  '.fwo-compare-picker',
  '.fwo-image-picker',
  '.fwo-info-picker',
  '.swt-drop',
  '.iwt-drop',
  '.pdf-tool-input',
  '[class$="-drop"]',
  '[class$="-picker"]',
].join(',');

function textOf(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
}

function acceptedLabels(input: HTMLInputElement | null) {
  if (!input) return [] as string[];
  const accept = (input.accept || '').toLowerCase();
  const labels: string[] = [];
  const add = (label: string) => { if (!labels.includes(label)) labels.push(label); };

  if (/\.docx\b|officedocument\.wordprocessingml/.test(accept)) add('DOCX');
  if (/(^|,)\.doc\b|msword/.test(accept)) add('DOC');
  if (/\.pdf\b|application\/pdf/.test(accept)) add('PDF');
  if (/\.xlsx\b|spreadsheetml/.test(accept)) add('XLSX');
  if (/(^|,)\.xls\b|application\/vnd\.ms-excel/.test(accept)) add('XLS');
  if (/\.csv\b|text\/csv/.test(accept)) add('CSV');
  if (/\.pptx\b|presentationml/.test(accept)) add('PPTX');
  if (/(^|,)\.ppt\b|application\/vnd\.ms-powerpoint/.test(accept)) add('PPT');
  if (/\.odt\b|opendocument\.text/.test(accept)) add('ODT');
  if (/\.rtf\b|application\/rtf|text\/rtf/.test(accept)) add('RTF');
  if (/\.html?\b|text\/html/.test(accept)) add('HTML');
  if (/\.txt\b|text\/plain/.test(accept)) add('TXT');
  if (/\.md\b|markdown/.test(accept)) add('Markdown');
  if (/image\/jpeg|\.jpe?g\b/.test(accept)) add('JPG');
  if (/image\/png|\.png\b/.test(accept)) add('PNG');
  if (/image\/webp|\.webp\b/.test(accept)) add('WEBP');
  if (/image\//.test(accept) && !labels.some((label) => ['JPG', 'PNG', 'WEBP'].includes(label))) add('Images');

  return labels;
}

function compactAcceptedLabel(input: HTMLInputElement | null) {
  const labels = acceptedLabels(input);
  if (!labels.length) return 'Supported files';
  if (labels.length === 1) return `${labels[0]} only`;
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')} or ${labels.at(-1)}`;
}

function helperAcceptedLabel(input: HTMLInputElement | null) {
  const labels = acceptedLabels(input);
  if (!labels.length) return 'Supported files only.';
  if (labels.length === 1) return `${labels[0]} files only.`;
  if (labels.length === 2) return `${labels[0]} or ${labels[1]} files only.`;
  return `${labels.slice(0, -1).join(', ')}, or ${labels.at(-1)} files only.`;
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

function markDropSurfaces(root: Element) {
  const surfaces = Array.from(root.querySelectorAll<HTMLElement>(dropSurfaceSelector));
  if (!surfaces.length && root.querySelector('input[type="file"]')) {
    (root as HTMLElement).setAttribute('data-uniform-dropzone', 'true');
    return;
  }
  surfaces.forEach((surface) => surface.setAttribute('data-uniform-dropzone', 'true'));
}

function buildUploadIcon() {
  const icon = document.createElement('span');
  icon.className = 'uniform-upload-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<svg class="uniform-upload-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14a2 2 0 0 0 2-2v-3"/><path d="M3 15v3a2 2 0 0 0 2 2"/></svg>';
  return icon;
}

function ensureUploadMeta(root: Element, element: HTMLElement) {
  const input = fileInputForTrigger(root, element);
  if (!input) return;

  if (!element.querySelector(':scope > .uniform-upload-icon')) element.prepend(buildUploadIcon());

  let meta = element.nextElementSibling instanceof HTMLElement && element.nextElementSibling.classList.contains('uniform-upload-meta')
    ? element.nextElementSibling
    : null;

  if (!meta) {
    meta = document.createElement('div');
    meta.className = 'uniform-upload-meta';
    meta.innerHTML = '<span class="uniform-drop-hint">Drag & drop files here</span><span class="uniform-upload-meta-dot" aria-hidden="true">•</span><span class="uniform-upload-format"></span>';
    element.insertAdjacentElement('afterend', meta);
  }

  const format = meta.querySelector<HTMLElement>('.uniform-upload-format');
  if (format) {
    const compact = compactAcceptedLabel(input);
    format.textContent = compact;
    format.setAttribute('aria-label', `Accepted file types: ${compact}`);
  }
}

function shouldNormalizeTrigger(root: Element, element: HTMLElement) {
  const text = textOf(element);
  if (!text) return isAssociatedFileLabel(root, element);
  if (uploadText.test(text) || isAssociatedFileLabel(root, element)) return true;

  const dropzone = element.closest<HTMLElement>('[data-uniform-dropzone="true"]');
  if (!dropzone || !dropzone.querySelector('input[type="file"]')) return false;
  return explicitUploadAction.test(text) && !nonUploadAction.test(text) && text.length <= 64;
}

function markUploadTriggers(root: Element) {
  root.querySelectorAll<HTMLElement>('button,label,[role="button"],a').forEach((element) => {
    if (!shouldNormalizeTrigger(root, element)) return;
    element.setAttribute('data-uniform-file-picker', 'true');
    element.setAttribute('aria-label', 'Choose Files');
    ensureUploadMeta(root, element);
  });
}

function normalizeHelperText(root: Element) {
  const input = root.querySelector<HTMLInputElement>('input[type="file"]');
  const label = helperAcceptedLabel(input);
  root.querySelectorAll<HTMLElement>('span,small,p,div').forEach((element) => {
    if (element.children.length || element.closest('button,label,[role="button"],a,.uniform-upload-meta')) return;
    const text = textOf(element);
    if (!text || !shortChooseText.test(text)) return;
    element.textContent = label;
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
    const card = document.querySelector<HTMLElement>('.platform-task-card');
    if (!card) return;

    refresh(card);
    let dragDepth = 0;

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
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) card.classList.remove('is-uniform-dragover');
    };
    const onDrop = (event: DragEvent) => {
      const files = Array.from(event.dataTransfer?.files || []);
      if (!files.length) return;
      event.preventDefault();
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

    const observer = new MutationObserver(() => refresh(card));
    observer.observe(card, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      card.removeEventListener('dragenter', onDragEnter);
      card.removeEventListener('dragover', onDragOver);
      card.removeEventListener('dragleave', onDragLeave);
      card.removeEventListener('drop', onDrop);
    };
  }, []);

  return null;
}
