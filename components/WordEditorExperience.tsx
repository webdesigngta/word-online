import type { EditorIntentMode } from '@/components/EditorIntentPrompt';
import { ToolViewAnalytics } from '@/components/ToolViewAnalytics';
import { WordEditorClientLoader } from '@/components/WordEditorClientLoader';
import type { SerializableEditorRuntimeOptions } from '@/components/WordEditorClientRuntime';

export function WordEditorExperience({
  interfaceId,
  heading,
  runtimeOptions = {},
  intentPrompt,
}: {
  interfaceId: string;
  heading: string;
  runtimeOptions?: SerializableEditorRuntimeOptions;
  intentPrompt?: EditorIntentMode;
}) {
  return (
    <>
      <ToolViewAnalytics toolId={interfaceId} editor />
      <main className="editor-route" data-word-interface={interfaceId}>
        <style>{`
          .editor-route {
            position: relative;
          }

          html:not(.fwo-ui-ready) .editor-route .word-app.docs-word-app {
            visibility: hidden !important;
          }

          html:not(.fwo-ui-ready) .editor-route {
            min-height: 100vh;
            min-height: 100dvh;
            background: #f8f9fa;
          }

          html.fwo-ui-ready .editor-route .word-app.docs-word-app {
            visibility: visible !important;
          }

          .editor-route .docs-menu-row {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }

          .editor-route .docs-pdf-button {
            display: none !important;
          }

          .editor-route .word-app.docs-word-app {
            height: 100vh !important;
            min-height: 100vh !important;
            height: 100dvh !important;
            min-height: 100dvh !important;
            grid-template-rows: 94px minmax(0, 1fr) !important;
          }

          .editor-route .docs-statusbar {
            display: none !important;
          }

          .editor-route .fwo-outline-tree {
            border-left: 0 !important;
          }

          .fwo-editor-loading {
            min-height: 100vh;
            min-height: 100dvh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #f8f9fa;
            font-family: Arial, Helvetica, sans-serif;
          }

          .fwo-editor-loading-card {
            width: min(420px, 100%);
            border: 1px solid #e0e3e7;
            border-radius: 16px;
            background: #fff;
            padding: 22px;
            text-align: center;
            box-shadow: 0 10px 28px rgba(60, 64, 67, .08);
          }

          .fwo-editor-loading-card strong,
          .fwo-editor-loading-card span {
            display: block;
          }

          .fwo-editor-loading-card span {
            color: #5f6368;
            font-size: 13px;
            line-height: 1.5;
            margin-top: 7px;
          }
        `}</style>
        <h1 className="sr-only">{heading}</h1>
        <WordEditorClientLoader runtimeOptions={runtimeOptions} intentPrompt={intentPrompt} />
      </main>
    </>
  );
}
