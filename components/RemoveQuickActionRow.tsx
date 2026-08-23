'use client';

import { useEffect } from 'react';

const QUICK_LABELS = ['Templates', 'Meeting notes', 'Email draft', 'More'];

function labelFor(element: HTMLElement) {
  return (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim();
}

function removeQuickActionRow() {
  const controls = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
    .filter((element) => QUICK_LABELS.includes(labelFor(element)));

  if (controls.length < 3) return;

  for (const control of controls) {
    let candidate: HTMLElement | null = control.parentElement;
    let depth = 0;

    while (candidate && depth < 6) {
      const matches = Array.from(candidate.querySelectorAll<HTMLElement>('button,[role="button"]'))
        .map(labelFor)
        .filter((label) => QUICK_LABELS.includes(label));
      const uniqueMatches = new Set(matches);
      const rect = candidate.getBoundingClientRect();

      if (uniqueMatches.size >= 3 && rect.height <= 140) {
        candidate.dataset.fwoRemovedQuickActions = 'true';
        candidate.style.setProperty('display', 'none', 'important');
        return;
      }

      candidate = candidate.parentElement;
      depth += 1;
    }
  }
}

export function RemoveQuickActionRow() {
  useEffect(() => {
    removeQuickActionRow();
    const observer = new MutationObserver(removeQuickActionRow);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
