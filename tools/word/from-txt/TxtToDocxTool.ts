import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { txtToDocxProcessor } from './TxtToDocxProcessor';
export const txtToDocxTool = { id: 'txt-to-docx', name: 'TXT to DOCX', description: 'Create a basic DOCX document from plain text.', category: 'converter', supportedDocumentTypes: ['txt'], execute: async (context: ToolExecutionContext) => { const input = typeof context.input === 'string' ? context.input : (context.file ?? (context.files?.length === 1 ? context.files[0] : undefined)); if (!input) throw new Error('Plain text or a TXT file is required'); return txtToDocxProcessor.process(input, context.options); } } satisfies Tool;
