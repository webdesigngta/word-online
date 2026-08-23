import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { docxSplitProcessor } from './DocxSplitProcessor';
export const docxSplitTool = { id: 'docx-split', name: 'Split DOCX', description: 'Split a DOCX by headings or paragraph ranges.', category: 'utility', supportedDocumentTypes: ['docx'], execute: async (context: ToolExecutionContext) => docxSplitProcessor.process(context.file ?? context.files?.[0]!, context.options) } satisfies Tool;