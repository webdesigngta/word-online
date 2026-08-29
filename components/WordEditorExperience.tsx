import type { EditorIntentMode } from '@/components/EditorIntentPrompt';
import { ToolViewAnalytics } from '@/components/ToolViewAnalytics';
import { WordEditorClientLoader } from '@/components/WordEditorClientLoader';
import type { SerializableEditorRuntimeOptions } from '@/components/WordEditorClientRuntime';

export function WordEditorExperience({
  interfaceId,
  heading,
  runtimeOptions = {},
  intentPrompt,
  embedded = false,
}: {
  interfaceId: string;
  heading: string;
  runtimeOptions?: SerializableEditorRuntimeOptions;
  intentPrompt?: EditorIntentMode;
  embedded?: boolean;
}) {
  const content = (
    <>
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

        .editor-route[data-word-interface="word-online"] .docs-editor-workspace .fwo-page-sheet > p {
          margin-top: 0;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .editor-route[data-word-interface="word-online"] .docs-editor-workspace .fwo-page-sheet > p:last-child {
          margin-bottom: 0;
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

        .editor-route--embedded,
        html:not(.fwo-ui-ready) .editor-route--embedded {
          min-height: clamp(560px, 72dvh, 760px);
          border-radius: 16px;
          overflow: hidden;
          background: #f8f9fa;
        }

        .editor-route--embedded .word-app.docs-word-app {
          height: clamp(560px, 72dvh, 760px) !important;
          min-height: clamp(560px, 72dvh, 760px) !important;
        }

        .editor-route--embedded .fwo-editor-loading {
          min-height: clamp(560px, 72dvh, 760px);
        }

        @media (max-width: 760px) {
          .editor-route--embedded,
          html:not(.fwo-ui-ready) .editor-route--embedded,
          .editor-route--embedded .word-app.docs-word-app,
          .editor-route--embedded .fwo-editor-loading {
            min-height: 580px !important;
          }

          .editor-route--embedded .word-app.docs-word-app {
            height: 580px !important;
          }
        }
      `}</style>
      {!embedded ? <h1 className="sr-only">{heading}</h1> : null}
      <WordEditorClientLoader runtimeOptions={runtimeOptions} intentPrompt={intentPrompt} />
    </>
  );

  return (
    <>
      {!embedded ? <ToolViewAnalytics toolId={interfaceId} editor /> : null}
      {embedded ? (
        <div className="editor-route editor-route--embedded" data-word-interface={interfaceId} aria-label={heading}>
          {content}
        </div>
      ) : (
        <main className="editor-route" data-word-interface={interfaceId}>
          {content}
        </main>
      )}
    </>
  );
}
