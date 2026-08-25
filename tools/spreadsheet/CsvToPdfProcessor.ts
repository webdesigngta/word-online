import type { DocumentProcessor, DocumentRegistry } from '../../core/document-engine/registry/documentRegistry';
import type { File } from '../../core/document-engine/types/File';

export interface CsvToPdfResult {
  success: boolean;
  source?: { name: string; size: number; type?: string; lastModified?: number };
  outputSize: number;
  pageCount: number | null;
  rowCount: number;
  columnCount: number;
  output?: { name: string; blob: Blob; size: number; type: 'application/pdf'; pageCount: number | null };
  errors: Array<{ code: string; message: string }>;
}

function readable(file: File): file is File & { arrayBuffer(): Promise<ArrayBuffer> } {
  return typeof (file as File & { arrayBuffer?: unknown }).arrayBuffer === 'function';
}

function source(file: File) { return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified }; }
function safeName(name: string) { return `${name.replace(/\.csv$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'table'}.pdf`; }
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char)); }

async function pdfPageCount(blob: Blob): Promise<number | null> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
    return pdf.numPages;
  } catch { return null; }
}

export class CsvToPdfProcessor implements DocumentProcessor<CsvToPdfResult> {
  type = 'csv' as const;

  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<CsvToPdfResult> {
    if (!('size' in file)) return { success: false, outputSize: 0, pageCount: null, rowCount: 0, columnCount: 0, errors: [{ code: 'CSV_FILE_REQUIRED', message: 'A single CSV file is required' }] };
    const base = { success: false, source: source(file), outputSize: 0, pageCount: null, rowCount: 0, columnCount: 0, errors: [] } as CsvToPdfResult;
    if (!readable(file)) return { ...base, errors: [{ code: 'CSV_FILE_UNREADABLE', message: 'The CSV file could not be read' }] };
    if (!(file.type === 'text/csv' || /\.csv$/i.test(file.name))) return { ...base, errors: [{ code: 'INVALID_CSV', message: 'Choose a CSV file' }] };
    if (file.size <= 0 || file.size > 20 * 1024 * 1024) return { ...base, errors: [{ code: 'INVALID_CSV_SIZE', message: 'CSV files must be between 1 byte and 20 MB' }] };

    try {
      const xlsx = await import('xlsx');
      const workbook = xlsx.read(await file.arrayBuffer(), { type: 'array', raw: false });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) return { ...base, errors: [{ code: 'EMPTY_CSV', message: 'The CSV does not contain a readable table' }] };
      const rows = xlsx.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheet], { header: 1, defval: '', raw: false });
      if (!rows.length) return { ...base, errors: [{ code: 'EMPTY_CSV', message: 'The CSV does not contain any rows' }] };
      const rowCount = rows.length;
      const columnCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
      if (!columnCount) return { ...base, rowCount, errors: [{ code: 'EMPTY_CSV', message: 'The CSV does not contain any columns' }] };

      const options = rawOptions as { pageFormat?: 'a4' | 'letter'; orientation?: 'portrait' | 'landscape'; margin?: number };
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-100000px;top:0;width:1000px;padding:18px;background:#fff;color:#111;font-family:Arial,sans-serif;font-size:9pt;line-height:1.3;';
      const title = document.createElement('h2');
      title.textContent = file.name.replace(/\.csv$/i, '');
      container.appendChild(title);
      const table = document.createElement('table');
      table.style.cssText = 'width:100%;border-collapse:collapse;table-layout:auto;';
      rows.forEach((rawRow, rowIndex) => {
        const row = Array.isArray(rawRow) ? rawRow : [];
        const tr = document.createElement('tr');
        for (let index = 0; index < columnCount; index += 1) {
          const cell = document.createElement(rowIndex === 0 ? 'th' : 'td');
          cell.innerHTML = escapeHtml(String(row[index] ?? ''));
          cell.style.cssText = `border:1px solid #c9ccd1;padding:5px 6px;vertical-align:top;overflow-wrap:anywhere;${rowIndex === 0 ? 'background:#f3f4f6;font-weight:700;' : ''}`;
          tr.appendChild(cell);
        }
        table.appendChild(tr);
      });
      container.appendChild(table);
      document.body.appendChild(container);

      let blob: Blob;
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        blob = await html2pdf().set({
          margin: options.margin ?? 8,
          filename: safeName(file.name),
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: false, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: options.pageFormat ?? 'a4', orientation: options.orientation ?? (columnCount > 6 ? 'landscape' : 'portrait') },
          pagebreak: { mode: ['css', 'legacy'] },
        } as any).from(container).toPdf().outputPdf('blob');
      } finally { container.remove(); }

      if (!blob.size) throw new Error('The CSV renderer did not produce a PDF');
      const pageCount = await pdfPageCount(blob);
      const output = { name: safeName(file.name), blob, size: blob.size, type: 'application/pdf' as const, pageCount };
      return { success: true, source: source(file), outputSize: blob.size, pageCount, rowCount, columnCount, output, errors: [] };
    } catch (error) {
      return { ...base, errors: [{ code: 'CSV_TO_PDF_FAILED', message: error instanceof Error ? error.message : 'CSV to PDF conversion failed' }] };
    }
  }
}

export const csvToPdfProcessor = new CsvToPdfProcessor();
export function registerCsvToPdfProcessor(registry: DocumentRegistry): CsvToPdfProcessor {
  if (!registry.getAll(csvToPdfProcessor.type).includes(csvToPdfProcessor)) registry.register(csvToPdfProcessor);
  return csvToPdfProcessor;
}
