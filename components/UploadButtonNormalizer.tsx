'use client';

import { useEffect } from 'react';

const uploadText = /^(choose|select|upload|open|add)\b[\s\S]*(file|files|pdf|pdfs|docx|doc|document|documents|word|image|images|photo|photos|scan|scans|xlsx|xls|csv|pptx|ppt|presentation|presentations|rtf|odt|html|epub|markdown|md|txt)|^choose again$/i;
const shortChooseText = /^(choose|select|upload|open)\b[\s\S]{0,88}(file|files|pdf|pdfs|docx|doc|document|documents|word|image|images|photo|photos|scan|scans|xlsx|xls|csv|pptx|ppt|presentation|presentations|rtf|odt|html|epub|markdown|md|txt)[.!]?$/i;
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

function inputFileLabel(input: HTMLInputElement | null) {
  if (!input) return 'Supported files only.';
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
  if (/image\//.test(accept) && !labels.some((label) => ['JPG', 'PNG', 'WEBP'].includes(label))) add('image');

  if (!labels.length) return accept ? 'Supported files only.' : 'Choose a supported file.';
  const joined = labels.length === 1 ? labels[0] : labels.length === 2 ? `${labels[0]} and ${labels[1]}` : `${labels.slice(0, -1).join(', ')}, or ${labels.at(-1)}`;
  return `${joined} ${labels.length === 1 ? 'files' : 'files'} only.`;
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

function markDropSurfaces(root: Element) {
  const surfaces = Array.from(root.querySelectorAll<HTMLElement>(dropSurfaceSelector));
  if (!surfaces.length && root.querySelector('input[type="file"]')) {
    (root as HTMLElement).setAttribute('data-uniform-dropzone', 'true');
    return;
  }
  surfaces.forEach((surface) => surface.setAttribute('data-uniform-dropzone', 'true'));
}

function markUploadTriggers(root: Element) {
  root.querySelectorAll<HTMLElement>('button,label,[role="button"],a').forEach((element) => {
    const text = textOf(element);
    if (!text || !uploadText.test(text)) return;
    element.setAttribute('data-uniform-file-picker', 'true');
    element.setAttribute('aria-label', 'Choose Files');

    const dropzone = element.closest<HTMLElement>('[data-uniform-dropzone="true"]');
    if (dropzone && !element.nextElementSibling?.classList.contains('uniform-drop-hint')) {
      const hint = document.createElement('span');
      hint.className = 'uniform-drop-hint';
      hint.textContent = 'or drag & drop files here';
      element.insertAdjacentElement('afterend', hint);
    }
  });
}

function normalizeHelperText(root: Element) {
  const input = root.querySelector<HTMLInputElement>('input[type="file"]');
  const label = inputFileLabel(input);
  root.querySelectorAll<HTMLElement>('span,small,p,div').forEach((element) => {
    if (element.children.length || element.closest('button,label,[role="button"],a')) return;
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
      const selected = input.multiple ? files : files.slice(0, 1);
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
