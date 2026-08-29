'use client';

import { useEffect } from 'react';

const OPEN_POPOVER_SELECTOR = [
  '.docs-menu-popover',
  '.fwo-gallery-popover',
  '.fwo-image-menu-popover',
  '.docs-menu-popover',
  '[role="menu"]',
  '[role="listbox"]',
].join(',');

/**
 * Gives Word Online one predictable dropdown rule: click anywhere outside the
 * currently open menu and it closes. Other menu triggers can then open their
 * own menu from the same click without leaving the previous menu behind.
 */
export function EditorMenuAutoDismiss() {
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Let clicks inside an open menu complete normally. Menu item actions
      // already close their own popover after the selection is made.
      if (target.closest(OPEN_POPOVER_SELECTOR)) return;

      // The File/Edit/View/Insert/Format/Tools/Help menus live in WordEditor
      // state, so close the active trigger through its existing toggle.
      const expanded = document.querySelector<HTMLButtonElement>('.docs-menu-button[aria-expanded="true"]');
      if (expanded) {
        const activeWrap = expanded.closest<HTMLElement>('.docs-menu-wrap');
        if (!activeWrap?.contains(target)) expanded.click();
      }

      // Enhancer menus (toolbar galleries, image menu, font/style menus,
      // download/history menus) already support Escape. Broadcasting Escape
      // keeps those independent menu implementations synchronized.
      const escape = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escape);
      window.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
        cancelable: true,
      }));
    };

    document.addEventListener('pointerdown', dismiss, true);
    return () => document.removeEventListener('pointerdown', dismiss, true);
  }, []);

  return null;
}
