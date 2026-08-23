import type { DocumentMetadata } from '../../../core/document-engine/types/Metadata';
import type { PdfOcrPageResult } from './PdfOcrTypes';

export interface PdfOcrSource {
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
}

export interface PdfOcrWarning {
  code: string;
  message: string;
}

export interface PdfOcrError {
  code: string;
  message: string;
}

export interface PdfOcrOutput {
  name: string;
  blob: Blob;
  size: number;
  type: 'application/pdf';
  pageCount: number;
}

export interface PdfOcrResult {
  success: boolean;
  source: PdfOcrSource;
  originalPageCount: number | null;
  processedPageCount: number;
  pages: readonly PdfOcrPageResult[];
  text: string;
  confidence: number | null;
  output?: PdfOcrOutput;
  metadata?: DocumentMetadata;
  warnings: PdfOcrWarning[];
  errors: PdfOcrError[];
}