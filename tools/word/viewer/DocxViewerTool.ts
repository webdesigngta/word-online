import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { docxViewerProcessor } from './DocxViewerProcessor';
export const docxViewerTool = { id: 'docx-viewer', name: 'DOCX Viewer', description: 'View DOCX documents as converted HTML.', category: 'viewer', supportedDocumentTypes: ['docx'], execute: async (context: ToolExecutionContext) => { const file = context.file ?? (context.files?.length === 1 ? context.files[0] : undefined); if (!file) throw new Error('A DOCX file is required'); return docxViewerProcessor.process(file, context.options); } } satisfies Tool;
