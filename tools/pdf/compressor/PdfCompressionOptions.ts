import type { PdfCompressionLevel } from '../shared/pdfTypes';

export interface PdfCompressionOptions {
  level?: PdfCompressionLevel;
  wasmUrl?: string;
}

export const defaultPdfCompressionOptions: Required<Pick<PdfCompressionOptions, 'level'>> = {
  level: 'medium',
};