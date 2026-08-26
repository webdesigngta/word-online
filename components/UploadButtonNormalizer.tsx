'use client';

import { useEffect } from 'react';

const uploadText = /^(choose|select|upload|open|add)\b[\s\S]*(file|files|pdf|pdfs|docx|doc|document|documents|word|image|images|photo|photos|scan|scans|xlsx|xls|csv|pptx|ppt|presentation|presentations|rtf|odt|html|epub|markdown|txt)|^choose again$/i;

function textOf(element: Element) {
  return (element.textContent || '').replace(/\s+/g, ' ').trim();
}

function markUploadTriggers(root: ParentNode) {
  root.querySelectorAll('button,label,[role="button"],a').forEach((element) => {
    const text = textOf(element);
    if (!text || !uploadText.test(text)) return;
    element.setAttribute('data-uniform-file-picker', 'true');
    element.setAttribute('aria-label', 'Choose Files');
  });
}

export function UploadButtonNormalizer() {
  useEffect(() => {
    const card = document.querySelector('.platform-task-card');
    if (!card) return;

    markUploadTriggers(card);
    const observer = new MutationObserver(() => markUploadTriggers(card));
    observer.observe(card, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
