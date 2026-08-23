'use client';

import { createContext, useContext, useState } from 'react';
import { WordEditor as LegacyWordEditor } from '@/components/WordEditor';
import type { WordRuntime } from '../runtime';
import {
  createEditorRuntime,
  type EditorRuntime,
  type EditorRuntimeOptions,
} from './EditorRuntime';

const defaultEditorRuntime = createEditorRuntime();
const EditorRuntimeContext = createContext<EditorRuntime>(defaultEditorRuntime);

export function useEditorRuntime(): EditorRuntime {
  return useContext(EditorRuntimeContext);
}

/**
 * Backwards-compatible access to the lower-level Word runtime while callers
 * migrate to the editor lifecycle boundary.
 */
export function useWordRuntime(): WordRuntime {
  return useEditorRuntime().getWordRuntime();
}

function WordEditorRuntime() {
  return <LegacyWordEditor runtime={useEditorRuntime()} />;
}

export function WordEditorTool(options: EditorRuntimeOptions = {}) {
  const [runtime] = useState(() => createEditorRuntime(options));

  return (
    <EditorRuntimeContext.Provider value={runtime}>
      <WordEditorRuntime />
    </EditorRuntimeContext.Provider>
  );
}
