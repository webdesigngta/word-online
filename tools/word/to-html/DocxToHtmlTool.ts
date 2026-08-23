import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { docxToHtmlProcessor } from './DocxToHtmlProcessor';
export const docxToHtmlTool = { id: 'docx-to-html', name: 'DOCX to HTML', description: 'Convert DOCX documents to HTML.', category: 'converter', supportedDocumentTypes: ['docx'], execute: async (context: ToolExecutionContext) => { const file = context.file ?? (context.files?.length === 1 ? context.files[0] : undefined); if (!file) throw new Error('A DOCX file is required'); return docxToHtmlProcessor.process(file, context.options); } } satisfies Tool;
