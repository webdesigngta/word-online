'use client';

import { useEffect } from 'react';

const OPEN_POPOVER_SELECTOR = [
  '.docs-menu-popover',
  '.fwo-gallery-popover',
  '.fwo-image-menu-popover',
  '.fwo-local-popover',
  '.fwo-local-panel',
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

      // The Editing / Suggesting / Viewing popup is owned by
      // NoLoginToolbarFeatures state. Choosing its already-selected mode is a
      // harmless state-aware way to close it when the user clicks elsewhere.
      const localPopover = document.querySelector<HTMLElement>('.fwo-local-popover');
      const selectedMode = localPopover?.querySelector<HTMLButtonElement>('button.selected');
      if (localPopover && selectedMode && !localPopover.contains(target)) selectedMode.click();

      // Side panels expose a close button, so use that rather than removing
      // React-owned DOM directly.
      const localPanel = document.querySelector<HTMLElement>('.fwo-local-panel');
      if (localPanel && !localPanel.contains(target)) {
        localPanel.querySelector<HTMLButtonElement>('.fwo-panel-title button')?.click();
      }

      // The File/Edit/View/Insert/Format/Tools/Help menus live in WordEditor
      // state, so close the active trigger through its existing toggle.
      const expanded = document.querySelector<HTMLButtonElement>('.docs-menu-button[aria-expanded="true"]');
      if (expanded) {
        const activeWrap = expanded.closest<HTMLElement>('.docs-menu-wrap');
        if (!activeWrap?.contains(target)) expanded.click();
      }

      // Enhancer menus already support Escape. Broadcasting Escape keeps those
      // independent menu implementations synchronized.
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
        cancelable: true,
      }));
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
