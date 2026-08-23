import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { pdfOcrProcessor } from './PdfOcrProcessor';

export const pdfOcrTool = {
  id: 'pdf-ocr',
  name: 'PDF OCR',
  description: 'Recognize text in scanned PDFs in the browser.',
  category: 'pdf',
  supportedDocumentTypes: ['pdf'],
  execute: async (context: ToolExecutionContext) => {
    if (!context.file) throw new Error('A PDF file is required');
    return pdfOcrProcessor.process(context.file, context.options);
  },
} satisfies Tool;