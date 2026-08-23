import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { pdfEditorProcessor } from './PdfEditorProcessor';

export const pdfEditorTool = {
  id: 'pdf-editor',
  name: 'PDF Editor',
  description: 'Edit PDF pages and add overlays in the browser.',
  category: 'pdf',
  supportedDocumentTypes: ['pdf'],
  execute: async (context: ToolExecutionContext) => {
    if (!context.file) throw new Error('A PDF file is required');
    return pdfEditorProcessor.process(context.file, context.options);
  },
} satisfies Tool;