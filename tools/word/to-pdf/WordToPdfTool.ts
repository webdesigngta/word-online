import type { Tool } from '../../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../../core/tool-execution/ToolExecutionContext';
import { wordToPdfProcessor } from './WordToPdfProcessor';

export const wordToPdfTool = {
  id: 'word-to-pdf',
  name: 'Word to PDF',
  description: 'Convert DOCX documents to PDF in the browser.',
  category: 'converter',
  supportedDocumentTypes: ['docx'],
  execute: async (context: ToolExecutionContext) => {
    if (!context.file) throw new Error('A DOCX file is required');
    return wordToPdfProcessor.process(context.file, context.options);
  },
} satisfies Tool;