import type { DocumentMetadata } from '../../../core/document-engine/types/Metadata';

export interface PdfMergeError {
  code: string;
  message: string;
}

export interface PdfMergeResult {
  success: boolean;
  totalInputSize: number;
  outputSize: number;
  sourceFileCount: number;
  pageCount: number | null;
  data?: Uint8Array;
  metadata?: DocumentMetadata;
  errors: PdfMergeError[];
}