'use client';

import dynamic from 'next/dynamic';
import type { EditorIntentMode } from '@/components/EditorIntentPrompt';
import {
  WordEditorClientRuntime,
  type SerializableEditorRuntimeOptions,
} from '@/components/WordEditorClientRuntime';

/*
 * Keep the editor client-only, but do not put the runtime behind a second
 * network-loaded dynamic-import boundary. On production hosting that extra
 * chunk request could occasionally stall after the page shell had already
 * hydrated, leaving users on "Loading editor…" indefinitely.
 *
 * The runtime is now part of the editor route's normal client dependency
 * graph. `ssr: false` still prevents browser-only editor UI from rendering
 * during static/server pre-rendering, while Promise.resolve means there is no
 * extra post-hydration module request that can get stuck.
 */
const ClientOnlyWordEditorRuntime = dynamic(
  () => Promise.resolve(WordEditorClientRuntime),
  {
    ssr: false,
    loading: () => (
      <div className="fwo-editor-loading" role="status" aria-live="polite">
        <div className="fwo-editor-loading-card">
          <strong>Opening editor…</strong>
          <span>Your document workspace is starting.</span>
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
  return <ClientOnlyWordEditorRuntime runtimeOptions={runtimeOptions} intentPrompt={intentPrompt} />;
}
