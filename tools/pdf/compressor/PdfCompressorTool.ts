import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { pdfCompressorProcessor } from './PdfCompressorProcessor';

export const pdfCompressorTool = {
  id: 'pdf-compressor',
  name: 'PDF Compressor',
  description: 'Reduce PDF file size in the browser.',
  category: 'pdf',
  supportedDocumentTypes: ['pdf'],
  execute: async (context: ToolExecutionContext) => {
    if (!context.file) {
      throw new Error('A PDF file is required');
    }
    return pdfCompressorProcessor.process(context.file, context.options);
  },
} satisfies Tool;