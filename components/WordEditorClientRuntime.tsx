'use client';

import type { EditorIntentMode } from '@/components/EditorIntentPrompt';
import { WordEditorTool } from '@/tools/word/editor';

export type SerializableEditorRuntimeOptions = {
  documentId?: string;
  initialContent?: string;
};

export function WordEditorClientRuntime({ runtimeOptions = {} }: {
  runtimeOptions?: SerializableEditorRuntimeOptions;
  intentPrompt?: EditorIntentMode;
}) {
  return <WordEditorTool {...runtimeOptions} />;
}
