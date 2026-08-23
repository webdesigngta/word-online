import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { docxMergeProcessor } from './DocxMergeProcessor';
export const docxMergeTool = { id: 'docx-merge', name: 'Merge DOCX', description: 'Merge two or more DOCX documents in order.', category: 'utility', supportedDocumentTypes: ['docx'], execute: async (context: ToolExecutionContext) => docxMergeProcessor.process(context.files ?? (context.file ? [context.file] : []), context.options) } satisfies Tool;