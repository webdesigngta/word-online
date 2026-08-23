'use client';

import type { ReactNode } from 'react';

export type WordToolbarAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  run: () => void;
};

export function WordToolbar({ actions }: { actions: WordToolbarAction[] }) {
  return (
    <div className="docs-toolbar" aria-label="Word editing toolbar">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className="docs-toolbar-icon"
          title={action.label}
          aria-label={action.label}
          onClick={action.run}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
