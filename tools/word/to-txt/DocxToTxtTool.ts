import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { docxToTxtProcessor } from './DocxToTxtProcessor';
export const docxToTxtTool = { id: 'docx-to-txt', name: 'DOCX to TXT', description: 'Convert DOCX documents to plain text.', category: 'converter', supportedDocumentTypes: ['docx'], execute: async (context: ToolExecutionContext) => { const file = context.file ?? (context.files?.length === 1 ? context.files[0] : undefined); if (!file) throw new Error('A DOCX file is required'); return docxToTxtProcessor.process(file, context.options); } } satisfies Tool;
