import type { Tool } from '../../core/tool-registry/Tool';
import type { ToolExecutionContext } from '../../core/tool-execution/ToolExecutionContext';
import { excelToPdfProcessor } from './ExcelToPdfProcessor';

export const excelToPdfTool = { id: 'excel-to-pdf', name: 'Excel to PDF', description: 'Convert selected XLSX sheets to PDF in the browser.', category: 'converter', supportedDocumentTypes: ['xlsx'], execute: async (context: ToolExecutionContext) => { const file = context.files ?? context.file; if (!file) throw new Error('An XLSX workbook is required'); return excelToPdfProcessor.process(file, context.options); } } satisfies Tool;