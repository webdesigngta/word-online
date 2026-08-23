import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { htmlToDocxProcessor } from './HtmlToDocxProcessor';
export const htmlToDocxTool = { id: 'html-to-docx', name: 'HTML to DOCX', description: 'Convert sanitized HTML into an editable DOCX document.', category: 'converter', supportedDocumentTypes: ['html'], execute: async (context: ToolExecutionContext) => { const input = typeof context.input === 'string' ? context.input : (context.file ?? (context.files?.length === 1 ? context.files[0] : undefined)); if (!input) throw new Error('HTML or an HTML file is required'); return htmlToDocxProcessor.process(input, context.options); } } satisfies Tool;
