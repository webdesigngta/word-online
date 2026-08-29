'use client';

import { ChecklistVisibilityFix } from '@/components/ChecklistVisibilityFix';
import { ChromeStatusAndZoom } from '@/components/ChromeStatusAndZoom';
import { CompactStyleMenu } from '@/components/CompactStyleMenu';
import { DelayedTooltips } from '@/components/DelayedTooltips';
import { DocumentOutline } from '@/components/DocumentOutline';
import { EditorIntentPrompt, type EditorIntentMode } from '@/components/EditorIntentPrompt';
import { EditorKeyboardScope } from '@/components/EditorKeyboardScope';
import { EditorMenuAutoDismiss } from '@/components/EditorMenuAutoDismiss';
import { FontMenuEnhancer } from '@/components/FontMenuEnhancer';
import { FunctionalMainMenus } from '@/components/FunctionalMainMenus';
import { GracefulEditorDialogs } from '@/components/GracefulEditorDialogs';
import { HeaderDownloadMenu } from '@/components/HeaderDownloadMenu';
import { LegacyDocDownload } from '@/components/LegacyDocDownload';
import { LocalUndoManager } from '@/components/LocalUndoManager';
import { LocalVersionHistory } from '@/components/LocalVersionHistory';
import { NoLoginToolbarFeatures } from '@/components/NoLoginToolbarFeatures';
import { PageStructureFeatures } from '@/components/PageStructureFeatures';
import { RemoveLegacyDesign } from '@/components/RemoveLegacyDesign';
import { RemoveQuickActionRow } from '@/components/RemoveQuickActionRow';
import { ResponsiveDropdownStyles } from '@/components/ResponsiveDropdownStyles';
import { SpellingContextMenu } from '@/components/SpellingContextMenu';
import { ToolbarGalleryMenus } from '@/components/ToolbarGalleryMenus';
import { UnifiedToolbarMenuTriggers } from '@/components/UnifiedToolbarMenuTriggers';
import { VersionHistoryToolbarButton } from '@/components/VersionHistoryToolbarButton';
import { HydrationReady } from '@/components/HydrationReady';
import { WordEditorTool } from '@/tools/word/editor';
import { A4Pagination } from '@/components/A4Pagination';

export type SerializableEditorRuntimeOptions = {
  documentId?: string;
  initialContent?: string;
};

export function WordEditorClientRuntime({
  runtimeOptions = {},
  intentPrompt,
}: {
  runtimeOptions?: SerializableEditorRuntimeOptions;
  intentPrompt?: EditorIntentMode;
}) {
  return (
    <>
      <WordEditorTool {...runtimeOptions} />
      <A4Pagination />
      <EditorKeyboardScope />
      <EditorMenuAutoDismiss />
      <DocumentOutline />
      <GracefulEditorDialogs />
      <FontMenuEnhancer />
      <CompactStyleMenu />
      <ToolbarGalleryMenus />
      <UnifiedToolbarMenuTriggers />
      <NoLoginToolbarFeatures />
      <LocalUndoManager />
      <LocalVersionHistory />
      <VersionHistoryToolbarButton />
      <PageStructureFeatures />
      {intentPrompt ? <EditorIntentPrompt mode={intentPrompt} /> : null}
      <ResponsiveDropdownStyles />
      <DelayedTooltips />
      <SpellingContextMenu />
      <ChromeStatusAndZoom />
      <FunctionalMainMenus />
      <ChecklistVisibilityFix />
      <LegacyDocDownload />
      <HeaderDownloadMenu />
      <RemoveQuickActionRow />
      <RemoveLegacyDesign />
      <HydrationReady />
    </>
  );
}
