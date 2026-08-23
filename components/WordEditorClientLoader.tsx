'use client';

import dynamic from 'next/dynamic';
import type { EditorIntentMode } from '@/components/EditorIntentPrompt';
import type { SerializableEditorRuntimeOptions } from '@/components/WordEditorClientRuntime';

const LazyWordEditorClientRuntime = dynamic(
  () => import('@/components/WordEditorClientRuntime').then((module) => module.WordEditorClientRuntime),
  {
    ssr: false,
    loading: () => (
      <div className="fwo-editor-loading" role="status" aria-live="polite">
        <div className="fwo-editor-loading-card">
          <strong>Loading editor…</strong>
          <span>The page shell is ready. The document editor loads separately.</span>
        </div>
      </div>
    ),
  },
);

export function WordEditorClientLoader({
  runtimeOptions = {},
  intentPrompt,
}: {
  runtimeOptions?: SerializableEditorRuntimeOptions;
  intentPrompt?: EditorIntentMode;
}) {
  return <LazyWordEditorClientRuntime runtimeOptions={runtimeOptions} intentPrompt={intentPrompt} />;
}
