'use client';

import { useEffect, useRef, useState } from 'react';

type TooltipState = {
  text: string;
  left: number;
  top: number;
} | null;

const TOOL_SELECTOR = [
  '.docs-toolbar button',
  '.docs-toolbar label',
  '.docs-toolbar select',
  '.docs-toolbar input',
  '.fwo-style-trigger',
  '.fwo-font-trigger',
].join(',');

const SHORTCUTS: Record<string, string> = {
  'Search menus': '⌘F',
  Undo: '⌘Z',
  Redo: '⌘⇧Z',
  Print: '⌘P',
  Bold: '⌘B',
  Italic: '⌘I',
  Underline: '⌘U',
  'Insert link': '⌘K',
};

function tooltipLabel(element: HTMLElement) {
  const stored = element.dataset.fwoTooltipLabel;
  if (stored) return stored;

  const aria = element.getAttribute('aria-label')?.trim();
  const title = element.getAttribute('title')?.trim();
  let label = aria || title || '';

  if (!label && element instanceof HTMLSelectElement) {
    label = element.getAttribute('aria-label') || element.value || 'Options';
  }

  if (!label && element instanceof HTMLInputElement) {
    label = element.getAttribute('aria-label') || 'Input';
  }

  if (!label) return '';

  // The spelling button changes between on/off labels; keep the tooltip human friendly.
  if (label === 'Spelling on' || label === 'Spelling off') label = 'Spelling & grammar';

  const shortcut = SHORTCUTS[label];
  const finalLabel = shortcut ? `${label} (${shortcut})` : label;
  element.dataset.fwoTooltipLabel = finalLabel;
  return finalLabel;
}

function prepareElement(element: HTMLElement) {
  if (element.dataset.fwoTooltipPrepared === 'true') return;
  const label = tooltipLabel(element);
  if (!label) return;

  const nativeTitle = element.getAttribute('title');
  if (nativeTitle) {
    element.dataset.fwoNativeTitle = nativeTitle;
    element.removeAttribute('title');
  }
  element.dataset.fwoTooltipPrepared = 'true';
}

function prepareAll(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(TOOL_SELECTOR).forEach(prepareElement);
}

export function DelayedTooltips() {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const hide = () => {
      clearTimer();
      activeRef.current = null;
      setTooltip(null);
    };

    const schedule = (element: HTMLElement) => {
      prepareElement(element);
      const text = tooltipLabel(element);
      if (!text) return;

      clearTimer();
      setTooltip(null);
      activeRef.current = element;

      timerRef.current = window.setTimeout(() => {
        if (activeRef.current !== element || !element.isConnected) return;

        const rect = element.getBoundingClientRect();
        const estimatedWidth = Math.min(280, Math.max(72, text.length * 7 + 20));
        const viewportPadding = 8;
        const left = Math.min(
          window.innerWidth - estimatedWidth - viewportPadding,
          Math.max(viewportPadding, rect.left + rect.width / 2 - estimatedWidth / 2),
        );
        const below = rect.bottom + 8;
        const top = below + 34 <= window.innerHeight ? below : Math.max(viewportPadding, rect.top - 38);

        setTooltip({ text, left, top });
        timerRef.current = null;
      }, 1000);
    };

    const findTool = (target: EventTarget | null) => {
      const node = target instanceof Element ? target : null;
      return node?.closest<HTMLElement>(TOOL_SELECTOR) || null;
    };

    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const tool = findTool(event.target);
      if (!tool) return;
      const related = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (related && tool.contains(related)) return;
      schedule(tool);
    };

    const onPointerOut = (event: PointerEvent) => {
      const tool = findTool(event.target);
      if (!tool) return;
      const related = event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (related && tool.contains(related)) return;
      if (activeRef.current === tool) hide();
    };

    const onFocusIn = (event: FocusEvent) => {
      const tool = findTool(event.target);
      if (tool) schedule(tool);
    };

    const onFocusOut = (event: FocusEvent) => {
      const tool = findTool(event.target);
      if (tool && activeRef.current === tool) hide();
    };

    const onPointerDown = () => hide();
    const onScroll = () => hide();

    prepareAll();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(TOOL_SELECTOR)) prepareElement(node);
          prepareAll(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('pointerout', onPointerOut, true);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', hide);

    return () => {
      hide();
      observer.disconnect();
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('pointerout', onPointerOut, true);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', hide);

      document.querySelectorAll<HTMLElement>('[data-fwo-tooltip-prepared="true"]').forEach((element) => {
        const nativeTitle = element.dataset.fwoNativeTitle;
        if (nativeTitle) element.setAttribute('title', nativeTitle);
        delete element.dataset.fwoNativeTitle;
        delete element.dataset.fwoTooltipLabel;
        delete element.dataset.fwoTooltipPrepared;
      });
    };
  }, []);

  if (!tooltip) return null;

  return (
    <div
      className="fwo-delayed-tooltip"
      role="tooltip"
      style={{ left: tooltip.left, top: tooltip.top }}
    >
      {tooltip.text}
      <style jsx global>{`
        .fwo-delayed-tooltip {
          position: fixed;
          z-index: 5000;
          max-width: min(280px, calc(100vw - 16px));
          padding: 6px 9px;
          border-radius: 4px;
          background: #2f3033;
          color: #fff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, .22);
          font: 500 12px/1.25 Arial, Helvetica, sans-serif;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
          animation: fwo-tooltip-in 90ms ease-out;
        }

        @keyframes fwo-tooltip-in {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 520px) {
          .fwo-delayed-tooltip {
            white-space: normal;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fwo-delayed-tooltip { animation: none; }
        }

        @media print {
          .fwo-delayed-tooltip { display: none !important; }
        }
      `}</style>
    </div>
  );
}
