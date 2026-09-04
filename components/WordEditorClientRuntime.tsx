'use client';

import { ChecklistVisibilityFix } from '@/components/ChecklistVisibilityFix';
import { ChromeStatusAndZoom } from '@/components/ChromeStatusAndZoom';
import { CompactStyleMenu } from '@/components/CompactStyleMenu';
import { DelayedTooltips } from '@/components/DelayedTooltips';
import { DocumentOutline } from '@/components/DocumentOutline';
import { EditorFeatureCleanup } from '@/components/EditorFeatureCleanup';
import { EditorIntentPrompt, type EditorIntentMode } from '@/components/EditorIntentPrompt';
import { EditorKeyboardScope } from '@/components/EditorKeyboardScope';
import { EditorMenuAutoDismiss } from '@/components/EditorMenuAutoDismiss';
import { EditorNativeSelectionGuard } from '@/components/EditorNativeSelectionGuard';
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
import { ToolbarGalleryMenus } from '@/components/ToolbarGalleryMenus';
import { UnifiedToolbarMenuTriggers } from '@/components/UnifiedToolbarMenuTriggers';
import { VersionHistoryToolbarButton } from '@/components/VersionHistoryToolbarButton';
import { WordAllToolsButton } from '@/components/WordAllToolsButton';
import { WordColorControlsFix } from '@/components/WordColorControlsFix';
import { WordEditorBrandMobilePolish } from '@/components/WordEditorBrandMobilePolish';
import { WordEditorMobileUsability } from '@/components/WordEditorMobileUsability';
import { WordFormattingSelectionBridge } from '@/components/WordFormattingSelectionBridge';
import { WordPageFlowGuard } from '@/components/WordPageFlowGuard';
import { WordRichPaste } from '@/components/WordRichPaste';
import { WordToolbarPolish } from '@/components/WordToolbarPolish';
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
      <WordPageFlowGuard />
      <WordRichPaste />
      <WordAllToolsButton />
      <EditorKeyboardScope />
      <EditorMenuAutoDismiss />
      <DocumentOutline />
      <GracefulEditorDialogs />
      <FontMenuEnhancer />
      <CompactStyleMenu />
      <ToolbarGalleryMenus />
      <UnifiedToolbarMenuTriggers />
      <NoLoginToolbarFeatures />
      <WordToolbarPolish />
      <EditorFeatureCleanup />
      <EditorNativeSelectionGuard />
      <WordColorControlsFix />
      <WordFormattingSelectionBridge />
      <WordEditorBrandMobilePolish />
      <WordEditorMobileUsability />
      <LocalUndoManager />
      <LocalVersionHistory />
      <VersionHistoryToolbarButton />
      <PageStructureFeatures />
      {intentPrompt ? <EditorIntentPrompt mode={intentPrompt} /> : null}
      <ResponsiveDropdownStyles />
      <DelayedTooltips />
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
