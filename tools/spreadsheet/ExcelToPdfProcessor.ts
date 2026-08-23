import type { DocumentProcessor, DocumentRegistry } from '../../core/document-engine/registry/documentRegistry';
import type { File } from '../../core/document-engine/types/File';
import type { ExcelToPdfResult } from './ExcelToPdfResult';
import type { ExcelToPdfOptions } from './ExcelToPdfOptions';
import { isReadableSpreadsheetFile, validateSpreadsheetFile } from './shared/spreadsheetValidator';

const PDF_TYPE = 'application/pdf';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function nameFor(file: File, filename?: string): string {
  const base = (filename ?? file.name.replace(/\.xlsx$/i, '')).replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim();
  return `${base || 'spreadsheet'}.pdf`;
}

function source(file: File) { return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified }; }

async function pageCount(blob: Blob): Promise<number | null> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    return (await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise).numPages;
  } catch { return null; }
}

async function render(workbook: import('xlsx').WorkBook, selected: string[], options: ExcelToPdfOptions): Promise<Blob> {
  const html2pdf = (await import('html2pdf.js')).default;
  const xlsx = await import('xlsx');
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-100000px;top:0;width:794px;padding:18px;background:#fff;color:#111;font-family:Arial,sans-serif;font-size:10pt;line-height:1.25;';
  selected.forEach((sheetName) => {
    const section = document.createElement('section');
    section.innerHTML = `<h2>${sheetName.replace(/[&<>"']/g, (value) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[value] ?? value))}</h2>${xlsx.utils.sheet_to_html(workbook.Sheets[sheetName], { header: '', footer: '' })}`;
    section.style.cssText = 'break-after:page;page-break-after:always;';
    container.appendChild(section);
  });
  document.body.appendChild(container);
  try {
    return await html2pdf().set({ margin: options.margin ?? 12, filename: nameFor({ name: 'spreadsheet.xlsx', size: 0 }, options.filename), image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, useCORS: false, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: options.pageFormat ?? 'a4', orientation: options.orientation ?? 'portrait' }, pagebreak: { mode: ['css', 'legacy'] } } as any).from(container).toPdf().outputPdf('blob');
  } finally { container.remove(); }
}

export class ExcelToPdfProcessor implements DocumentProcessor<ExcelToPdfResult> {
  type = 'xlsx' as const;
  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<ExcelToPdfResult> {
    if (!('size' in file)) return { success: false, outputSize: 0, pageCount: null, warnings: [], errors: [{ code: 'XLSX_FILE_REQUIRED', message: 'A single XLSX file is required' }] };
    const options = rawOptions as ExcelToPdfOptions;
    const base = { success: false, source: source(file), outputSize: 0, pageCount: null, warnings: [], errors: [] } as ExcelToPdfResult;
    const validationErrors = validateSpreadsheetFile(file);
    if (validationErrors.length) return { ...base, success: false, errors: validationErrors.map((message) => ({ code: 'INVALID_XLSX', message })) };
    if (!isReadableSpreadsheetFile(file)) return { ...base, success: false, errors: [{ code: 'XLSX_FILE_UNREADABLE', message: 'Spreadsheet file could not be read' }] };
    try {
      const xlsx = await import('xlsx');
      const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array' });
      const selected = (options.sheetNames?.length ? [...options.sheetNames] : workbook.SheetNames).filter((name) => workbook.SheetNames.includes(name));
      const warnings = selected.length !== (options.sheetNames?.length ?? selected.length) ? [{ code: 'MISSING_SHEET', message: 'One or more requested sheets were not found' }] : [];
      if (!selected.length) return { ...base, success: false, warnings, errors: [{ code: 'NO_SHEETS', message: 'The workbook has no selected sheets to render' }] };
      const blob = await render(workbook, selected, options);
      if (blob.type !== PDF_TYPE || !blob.size) return { ...base, success: false, warnings, errors: [{ code: 'INVALID_PDF_OUTPUT', message: 'The converter did not produce a valid PDF' }] };
      const count = await pageCount(blob);
      const output = { name: nameFor(file, options.filename), blob, size: blob.size, type: PDF_TYPE as 'application/pdf', pageCount: count, sheetNames: selected };
      return { success: true, source: source(file), outputSize: blob.size, pageCount: count, output, warnings, errors: [] };
    } catch (error) { return { ...base, success: false, errors: [{ code: 'XLSX_TO_PDF_FAILED', message: error instanceof Error ? error.message : 'XLSX to PDF conversion failed' }] }; }
  }
}

export const excelToPdfProcessor = new ExcelToPdfProcessor();
export function registerExcelToPdfProcessor(registry: DocumentRegistry): ExcelToPdfProcessor { if (!registry.getAll(excelToPdfProcessor.type).includes(excelToPdfProcessor)) registry.register(excelToPdfProcessor); return excelToPdfProcessor; }