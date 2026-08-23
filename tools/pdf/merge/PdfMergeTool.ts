import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { pdfMergeProcessor } from './PdfMergeProcessor';

export const pdfMergeTool = {
  id: 'pdf-merge',
  name: 'Merge PDF',
  description: 'Merge PDF files in the browser.',
  category: 'pdf',
  supportedDocumentTypes: ['pdf'],
  execute: async (context: ToolExecutionContext) => {
    const files = context.files ?? (Array.isArray(context.input) ? context.input : undefined);
    if (!files) throw new Error('At least two PDF files are required');
    return pdfMergeProcessor.process(files, context.options);
  },
} satisfies Tool;