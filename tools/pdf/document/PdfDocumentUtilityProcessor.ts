import type { DocumentProcessor } from '../../../core/document-engine/registry/documentRegistry';
import type { File } from '../../../core/document-engine/types/File';
import { MAX_PDF_FILE_SIZE, validatePdfFile } from '../shared/pdfValidator';

type PdfDocumentMode = 'crop' | 'fill' | 'flatten';
export type PdfFormValue = string | string[] | boolean;

export interface PdfDocumentUtilityOptions {
  mode: PdfDocumentMode;
  pages?: readonly number[];
  margins?: { top?: number; right?: number; bottom?: number; left?: number };
  values?: Record<string, PdfFormValue>;
  flattenAfterFill?: boolean;
}

export interface PdfDocumentUtilityResult {
  success: boolean;
  data?: Uint8Array;
  pageCount: number | null;
  fieldCount: number;
  changedFields: number;
  errors: Array<{ code: string; message: string }>;
}

function failure(code: string, message: string, pageCount: number | null = null, fieldCount = 0): PdfDocumentUtilityResult {
  return { success: false, pageCount, fieldCount, changedFields: 0, errors: [{ code, message }] };
}

function isPdfFile(file: File): file is File & { arrayBuffer(): Promise<ArrayBuffer> } {
  return typeof (file as File & { arrayBuffer?: unknown }).arrayBuffer === 'function';
}

function selectedPages(raw: readonly number[] | undefined, pageCount: number): number[] {
  const pages = raw?.length ? [...new Set(raw)] : Array.from({ length: pageCount }, (_, index) => index + 1);
  if (pages.some((page) => !Number.isInteger(page) || page < 1 || page > pageCount)) {
    throw new Error(`Page numbers must be between 1 and ${pageCount}`);
  }
  return pages;
}

function safeMargin(value: number | undefined): number {
  if (value === undefined) return 0;
  if (!Number.isFinite(value) || value < 0) throw new Error('Crop margins must be non-negative numbers');
  return value;
}

function hasSelection(value: PdfFormValue): boolean {
  if (Array.isArray(value)) return value.some((item) => String(item).length > 0);
  return String(value).length > 0;
}

export class PdfDocumentUtilityProcessor implements DocumentProcessor<PdfDocumentUtilityResult> {
  type = 'pdf' as const;

  async process(file: File | readonly File[], rawOptions: Record<string, unknown> = {}): Promise<PdfDocumentUtilityResult> {
    if (!('size' in file)) return failure('PDF_FILE_REQUIRED', 'A single PDF file is required');
    if (!isPdfFile(file)) return failure('PDF_FILE_UNREADABLE', 'The PDF file could not be read');
    const validation = validatePdfFile(file, MAX_PDF_FILE_SIZE);
    if (!validation.valid) return failure('INVALID_PDF_FILE', validation.errors.join('. '));

    const options = rawOptions as unknown as PdfDocumentUtilityOptions;
    if (!['crop', 'fill', 'flatten'].includes(options.mode)) return failure('INVALID_MODE', 'A valid PDF document operation is required');

    try {
      const pdfLib = await import('pdf-lib');
      const pdf = await pdfLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const pageCount = pdf.getPageCount();

      if (options.mode === 'crop') {
        const margins = {
          top: safeMargin(options.margins?.top),
          right: safeMargin(options.margins?.right),
          bottom: safeMargin(options.margins?.bottom),
          left: safeMargin(options.margins?.left),
        };
        if (Object.values(margins).every((value) => value === 0)) {
          return failure('EMPTY_CROP', 'Enter at least one crop margin greater than zero', pageCount);
        }
        const pages = selectedPages(options.pages, pageCount);
        for (const pageNumber of pages) {
          const page = pdf.getPage(pageNumber - 1);
          const box = page.getCropBox();
          const croppedWidth = box.width - margins.left - margins.right;
          const croppedHeight = box.height - margins.top - margins.bottom;
          if (croppedWidth < 36 || croppedHeight < 36) {
            throw new Error(`Crop margins are too large for page ${pageNumber}`);
          }
          page.setCropBox(box.x + margins.left, box.y + margins.bottom, croppedWidth, croppedHeight);
        }
        return { success: true, data: await pdf.save(), pageCount, fieldCount: 0, changedFields: 0, errors: [] };
      }

      const form = pdf.getForm();
      const fields = form.getFields();
      const fieldCount = fields.length;
      if (!fieldCount) return failure('NO_FORM_FIELDS', 'This PDF does not contain interactive form fields', pageCount, 0);

      if (options.mode === 'flatten') {
        form.flatten();
        return { success: true, data: await pdf.save(), pageCount, fieldCount, changedFields: fieldCount, errors: [] };
      }

      const values = options.values ?? {};
      let changedFields = 0;
      for (const field of fields) {
        if (!(field.getName() in values)) continue;
        const value = values[field.getName()];
        if (field instanceof pdfLib.PDFTextField) {
          field.setText(String(Array.isArray(value) ? value.join(', ') : value ?? ''));
        } else if (field instanceof pdfLib.PDFCheckBox) {
          const checked = value === true || String(value).toLowerCase() === 'true' || String(value) === '1' || String(value).toLowerCase() === 'yes';
          if (checked) field.check(); else field.uncheck();
        } else if (field instanceof pdfLib.PDFRadioGroup) {
          if (!hasSelection(value)) continue;
          field.select(String(value));
        } else if (field instanceof pdfLib.PDFDropdown) {
          if (!hasSelection(value)) continue;
          field.select(String(value));
        } else if (field instanceof pdfLib.PDFOptionList) {
          if (!hasSelection(value)) continue;
          field.select(Array.isArray(value) ? value.map(String) : [String(value)]);
        } else {
          continue;
        }
        changedFields += 1;
      }
      if (!changedFields) return failure('NO_VALUES_CHANGED', 'No supported form fields were changed', pageCount, fieldCount);
      const font = await pdf.embedFont(pdfLib.StandardFonts.Helvetica);
      form.updateFieldAppearances(font);
      if (options.flattenAfterFill) form.flatten();
      return { success: true, data: await pdf.save(), pageCount, fieldCount, changedFields, errors: [] };
    } catch (error) {
      return failure('PDF_DOCUMENT_OPERATION_FAILED', error instanceof Error ? error.message : 'PDF document operation failed');
    }
  }
}

export const pdfDocumentUtilityProcessor = new PdfDocumentUtilityProcessor();
