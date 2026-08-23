import type { PdfFile } from './pdfTypes';

export const MAX_PDF_FILE_SIZE = 100 * 1024 * 1024;

export interface PdfValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePdfFile(
  file: PdfFile,
  maxSize = MAX_PDF_FILE_SIZE,
): PdfValidationResult {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const withinSize = file.size >= 0 && file.size <= maxSize;
  const errors: string[] = [];

  if (!isPdf) errors.push('File must be a PDF document');
  if (!withinSize) errors.push(`PDF must be smaller than ${maxSize} bytes`);

  return {
    valid: isPdf && withinSize,
    errors,
  };
}