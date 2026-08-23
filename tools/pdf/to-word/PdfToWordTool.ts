import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { pdfToWordProcessor } from './PdfToWordProcessor';

export const pdfToWordTool = {
  id: 'pdf-to-word',
  name: 'PDF to Word',
  description: 'Convert text-based PDFs to editable Word documents in the browser.',
  category: 'converter',
  supportedDocumentTypes: ['pdf'],
  execute: async (context: ToolExecutionContext) => {
    if (!context.file) throw new Error('A PDF file is required');
    return pdfToWordProcessor.process(context.file, context.options);
  },
} satisfies Tool;