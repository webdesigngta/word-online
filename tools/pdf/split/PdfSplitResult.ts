import type { DocumentMetadata } from '../../../core/document-engine/types/Metadata';

export interface PdfSplitError {
  code: string;
  message: string;
}

export interface PdfSplitOutput {
  name: string;
  data: Uint8Array;
  size: number;
  pageCount: number | null;
  pages: readonly number[];
}

export interface PdfSplitResult {
  success: boolean;
  originalSize: number;
  originalPageCount: number | null;
  resultingFileCount: number;
  totalOutputSize: number;
  outputs?: readonly PdfSplitOutput[];
  metadata?: DocumentMetadata;
  errors: PdfSplitError[];
}