'use client';

import { History } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function VersionHistoryToolbarButton() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const findTarget = () => setTarget(document.querySelector<HTMLElement>('.docs-toolbar'));
    findTarget();
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!target) return null;

  return createPortal(
    <button
      type="button"
      className="docs-toolbar-icon"
      aria-label="Version history"
      title="Version history"
    >
      <History />
    </button>,
    target,
  );
}
