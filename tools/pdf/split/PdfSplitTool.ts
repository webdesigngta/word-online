import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { pdfSplitProcessor } from './PdfSplitProcessor';

export const pdfSplitTool = {
  id: 'pdf-split',
  name: 'Split PDF',
  description: 'Extract pages from a PDF in the browser.',
  category: 'pdf',
  supportedDocumentTypes: ['pdf'],
  execute: async (context: ToolExecutionContext) => {
    if (!context.file) throw new Error('A PDF file is required');
    return pdfSplitProcessor.process(context.file, context.options);
  },
} satisfies Tool;