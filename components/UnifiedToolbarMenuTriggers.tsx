'use client';

import { useEffect, useRef, useState } from 'react';

type Point = { left: number; top: number };

function findCombo(label: string) {
  const button = document.querySelector<HTMLButtonElement>(`.docs-toolbar button[aria-label="${label}"]`);
  return button?.closest<HTMLElement>('.docs-toolbar-combo') ?? null;
}

export function UnifiedToolbarMenuTriggers() {
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [point, setPoint] = useState<Point>({ left: 8, top: 100 });
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const combos = [findCombo('Alignment options'), findCombo('Checklist options'), findCombo('Image options')].filter(Boolean) as HTMLElement[];
    combos.forEach((combo) => combo.dataset.fwoUnifiedMenu = 'true');

    const saveRange = () => {
      const editor = document.querySelector<HTMLElement>('.editor-page');
      const selection = window.getSelection();
      if (!editor || !selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) savedRangeRef.current = range.cloneRange();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button');
      if (!button) return;
      const combo = button.closest<HTMLElement>('.docs-toolbar-combo[data-fwo-unified-menu="true"]');
      if (!combo) return;

      const alignmentArrow = combo.querySelector<HTMLButtonElement>('button[aria-label="Alignment options"]');
      const checklistArrow = combo.querySelector<HTMLButtonElement>('button[aria-label="Checklist options"]');
      const imageArrow = combo.querySelector<HTMLButtonElement>('button[aria-label="Image options"]');

      if (alignmentArrow) {
        if (button !== alignmentArrow) {
          event.preventDefault();
          event.stopPropagation();
          saveRange();
          alignmentArrow.click();
        }
        return;
      }

      if (checklistArrow) {
        if (button !== checklistArrow) {
          event.preventDefault();
          event.stopPropagation();
          saveRange();
          checklistArrow.click();
        }
        return;
      }

      if (imageArrow) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        saveRange();
        const rect = combo.getBoundingClientRect();
        const width = 220;
        setPoint({
          left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
          top: Math.min(window.innerHeight - 90, rect.bottom + 6),
        });
        setImageMenuOpen((open) => !open);
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!imageMenuOpen) return;
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.fwo-image-menu-popover')) setImageMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImageMenuOpen(false);
    };
    window.setTimeout(() => document.addEventListener('mousedown', close), 0);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', escape);
    };
  }, [imageMenuOpen]);

  function restoreRange() {
    const editor = document.querySelector<HTMLElement>('.editor-page');
    const range = savedRangeRef.current;
    if (!editor || !range) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    editor.focus({ preventScroll: true });
  }

  function uploadImage() {
    setImageMenuOpen(false);
    const input = document.querySelector<HTMLInputElement>('input[type="file"][accept="image/*"]');
    input?.click();
  }

  function insertImageUrl() {
    const url = window.prompt('Image URL');
    if (!url) return;
    restoreRange();
    document.execCommand('insertImage', false, url);
    document.querySelector<HTMLElement>('.editor-page')?.dispatchEvent(new Event('input', { bubbles: true }));
    setImageMenuOpen(false);
  }

  return (
    <>
      {imageMenuOpen && (
        <div className="fwo-image-menu-popover" style={{ left: point.left, top: point.top }} role="menu" aria-label="Image options">
          <button type="button" role="menuitem" onClick={uploadImage}>Upload from computer</button>
          <button type="button" role="menuitem" onClick={insertImageUrl}>Insert image from URL</button>
        </div>
      )}
      <style jsx global>{`
        .docs-toolbar-combo[data-fwo-unified-menu='true'] {
          position: relative;
          border-radius: 14px;
          transition: background-color .12s ease;
        }
        .docs-toolbar-combo[data-fwo-unified-menu='true']:hover {
          background: #e2e7ec;
        }
        .docs-toolbar-combo[data-fwo-unified-menu='true'] > .docs-toolbar-button,
        .docs-toolbar-combo[data-fwo-unified-menu='true'] > .docs-toolbar-split {
          background: transparent !important;
        }
        .docs-toolbar-combo[data-fwo-unified-menu='true'] > .docs-toolbar-button:hover,
        .docs-toolbar-combo[data-fwo-unified-menu='true'] > .docs-toolbar-split:hover {
          background: transparent !important;
        }
        .fwo-image-menu-popover {
          position: fixed;
          z-index: 6200;
          width: 220px;
          padding: 7px;
          border: 1px solid #dfe3e7;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(60,64,67,.24), 0 2px 5px rgba(60,64,67,.12);
          font-family: Arial, Helvetica, sans-serif;
        }
        .fwo-image-menu-popover button {
          width: 100%;
          min-height: 36px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          padding: 8px 11px;
          color: #202124;
          text-align: left;
          font-size: 13px;
          cursor: pointer;
        }
        .fwo-image-menu-popover button:hover { background: #f1f3f4; }
      `}</style>
    </>
  );
}
