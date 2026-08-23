import type { Tool } from '../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../core/tool-execution/ToolExecutionContext';
import { htmlToPdfProcessor } from './HtmlToPdfProcessor';

export const htmlToPdfTool = { id: 'html-to-pdf', name: 'HTML to PDF', description: 'Convert sanitized HTML to PDF in the browser.', category: 'converter', supportedDocumentTypes: ['html'], execute: async (context: ToolExecutionContext) => { const input = typeof context.input === 'string' ? context.input : (context.files ?? context.file); if (!input) throw new Error('An HTML string or file is required'); return htmlToPdfProcessor.process(input, context.options); } } satisfies Tool;