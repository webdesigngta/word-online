'use client';

import { createContext, useContext } from 'react';
import { WordEditor as LegacyWordEditor } from '@/components/WordEditor';
import { initializePlatform } from '@/core/platform';
import { wordRuntime, type WordRuntime } from '../runtime';

const WordRuntimeContext = createContext<WordRuntime>(wordRuntime);
initializePlatform();

export function useWordRuntime(): WordRuntime {
  return useContext(WordRuntimeContext);
}

function WordEditorRuntime() {
  return <LegacyWordEditor runtime={useWordRuntime()} />;
}

export function WordEditorTool() {
  return (
    <WordRuntimeContext.Provider value={wordRuntime}>
      <WordEditorRuntime />
    </WordRuntimeContext.Provider>
  );
}
