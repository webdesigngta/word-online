'use client';

import type { ReactNode } from 'react';

interface DocumentCanvasProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Word document surface boundary.
 *
 * Keeps the page rendering layer separate from editor controls so future
 * document tools can reuse the canvas model.
 */
export function DocumentCanvas({ children, className = '' }: DocumentCanvasProps) {
  return (
    <div className={`word-document-canvas ${className}`.trim()}>
      {children}
    </div>
  );
}
