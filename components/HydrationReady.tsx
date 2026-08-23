'use client';

import { useEffect } from 'react';

const QUICK_LABELS = ['Templates', 'Meeting notes', 'Email draft', 'More'];
const LEGACY_SELECTOR = [
  '.docs-pdf-button',
  '.docs-right > .docs-top-icon',
  '.docs-right > .docs-share-button',
  '.docs-right > .docs-upgrade-button',
  '.docs-right > .docs-gem',
  '.docs-right > .docs-avatar',
  '.docs-title-icon[aria-label="Star document"]',
  '.fwo-top-actions',
].join(',');

function quickActionRowStillExists() {
  const controls = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
    .filter((element) => {
      const label = (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim();
      return QUICK_LABELS.includes(label);
    });
  return controls.length >= 3;
}

export function HydrationReady() {
  useEffect(() => {
    let frame = 0;
    let stopped = false;
    const started = performance.now();

    const reveal = () => {
      if (stopped) return;
      document.documentElement.classList.add('fwo-ui-ready');
    };

    const waitForLatestUi = () => {
      if (stopped) return;
      const menuReady = Boolean(document.querySelector('.fwo-main-menu-row'));
      const downloadReady = Boolean(document.querySelector('.fwo-header-download-wrap'));
      const legacyGone = !document.querySelector(LEGACY_SELECTOR);
      const quickActionsGone = !quickActionRowStillExists();
      const timeoutReached = performance.now() - started > 1800;

      if ((menuReady && downloadReady && legacyGone && quickActionsGone) || (timeoutReached && menuReady && downloadReady)) {
        window.requestAnimationFrame(reveal);
        return;
      }

      frame = window.requestAnimationFrame(waitForLatestUi);
    };

    frame = window.requestAnimationFrame(waitForLatestUi);

    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
