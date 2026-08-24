'use client';

import { useEffect } from 'react';

const QUICK_LABELS = ['Templates', 'Meeting notes', 'Email draft', 'More'];
const REMOVABLE_SELECTORS = [
  '.docs-pdf-button',
  '.docs-right > .docs-top-icon',
  '.docs-right > .docs-share-button',
  '.docs-right > .docs-upgrade-button',
  '.docs-right > .docs-gem',
  '.docs-right > .docs-avatar',
  '.fwo-top-actions',
];

function labelFor(element: HTMLElement) {
  return (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim();
}

function removeQuickActionRows() {
  const controls = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
    .filter((element) => QUICK_LABELS.includes(labelFor(element)));

  if (controls.length < 3) return;

  for (const control of controls) {
    let candidate: HTMLElement | null = control.parentElement;
    let depth = 0;

    while (candidate && depth < 7) {
      const labels = Array.from(candidate.querySelectorAll<HTMLElement>('button,[role="button"]'))
        .map(labelFor)
        .filter((label) => QUICK_LABELS.includes(label));
      const rect = candidate.getBoundingClientRect();

      if (new Set(labels).size >= 3 && rect.height <= 180) {
        candidate.remove();
        return;
      }

      candidate = candidate.parentElement;
      depth += 1;
    }
  }
}

function removeLegacyVisibleUi() {
  for (const selector of REMOVABLE_SELECTORS) {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => element.remove());
  }

  removeQuickActionRows();

  // Keep the original menu controls only as invisible action hooks because
  // several no-login features reuse their working document actions.
  const legacyMenuRow = document.querySelector<HTMLElement>('.docs-menu-row');
  if (legacyMenuRow) {
    legacyMenuRow.hidden = true;
    legacyMenuRow.setAttribute('aria-hidden', 'true');
    legacyMenuRow.style.setProperty('display', 'none', 'important');
  }
}

export function RemoveLegacyDesign() {
  useEffect(() => {
    removeLegacyVisibleUi();

    const observer = new MutationObserver(removeLegacyVisibleUi);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
