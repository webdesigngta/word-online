import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { pngToPdfProcessor } from './PngToPdfProcessor';

export const pngToPdfTool = {
  id: 'png-to-pdf',
  name: 'PNG to PDF',
  description: 'Convert PNG images to PDF in the browser.',
  category: 'converter',
  supportedDocumentTypes: ['image'],
  execute: async (context: ToolExecutionContext) => {
    const files = context.files ?? (Array.isArray(context.input) ? context.input : context.file);
    if (!files) throw new Error('At least one PNG image is required');
    return pngToPdfProcessor.process(files, context.options);
  },
} satisfies Tool;