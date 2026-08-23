import { pageMetadata } from '@/lib/seo';
import { wordToolSeo } from '@/tools/word';
import { WordEditorTool } from '@/tools/word/editor';
import { DocumentOutline } from '@/components/DocumentOutline';
import { GracefulEditorDialogs } from '@/components/GracefulEditorDialogs';
import { FontMenuEnhancer } from '@/components/FontMenuEnhancer';
import { CompactStyleMenu } from '@/components/CompactStyleMenu';
import { ToolbarGalleryMenus } from '@/components/ToolbarGalleryMenus';
import { NoLoginToolbarFeatures } from '@/components/NoLoginToolbarFeatures';
import { LocalUndoManager } from '@/components/LocalUndoManager';
import { ResponsiveDropdownStyles } from '@/components/ResponsiveDropdownStyles';
import { DelayedTooltips } from '@/components/DelayedTooltips';
import { SpellingContextMenu } from '@/components/SpellingContextMenu';
import { EditorContextMenu } from '@/components/EditorContextMenu';
import { ChromeStatusAndZoom } from '@/components/ChromeStatusAndZoom';
import { FunctionalMainMenus } from '@/components/FunctionalMainMenus';
import { ChecklistVisibilityFix } from '@/components/ChecklistVisibilityFix';
import { LegacyDocDownload } from '@/components/LegacyDocDownload';
import { HeaderDownloadMenu } from '@/components/HeaderDownloadMenu';
import { RemoveQuickActionRow } from '@/components/RemoveQuickActionRow';
import { RemoveLegacyDesign } from '@/components/RemoveLegacyDesign';
import { HydrationReady } from '@/components/HydrationReady';
import { SoftwareJsonLd } from '@/components/JsonLd';

export const metadata = pageMetadata(wordToolSeo);

export default function WordOnlinePage() {
  return (
    <>
      <main className="editor-route">
        <style>{`
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
        `}</style>
        <h1 className="sr-only">Free Word Online editor</h1>
        <WordEditorTool />
        <DocumentOutline />
        <GracefulEditorDialogs />
        <FontMenuEnhancer />
        <CompactStyleMenu />
        <ToolbarGalleryMenus />
        <NoLoginToolbarFeatures />
        <LocalUndoManager />
        <ResponsiveDropdownStyles />
        <DelayedTooltips />
        <SpellingContextMenu />
        <EditorContextMenu />
        <ChromeStatusAndZoom />
        <FunctionalMainMenus />
        <ChecklistVisibilityFix />
        <LegacyDocDownload />
        <HeaderDownloadMenu />
        <RemoveQuickActionRow />
        <RemoveLegacyDesign />
        <HydrationReady />
      </main>
      <SoftwareJsonLd />
    </>
  );
}
