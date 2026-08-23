import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { jpgToPdfProcessor } from './JpgToPdfProcessor';

export const jpgToPdfTool = {
  id: 'jpg-to-pdf',
  name: 'JPG to PDF',
  description: 'Convert JPG images to PDF in the browser.',
  category: 'converter',
  supportedDocumentTypes: ['image'],
  execute: async (context: ToolExecutionContext) => {
    const files = context.files ?? (Array.isArray(context.input) ? context.input : context.file);
    if (!files) throw new Error('At least one JPG image is required');
    return jpgToPdfProcessor.process(files, context.options);
  },
} satisfies Tool;