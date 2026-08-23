import type { DocumentMetadata } from '../../../core/document-engine/types/Metadata';

export interface PdfCompressionError {
  code: string;
  message: string;
}

export interface PdfCompressionResult {
  success: boolean;
  originalSize: number;
  resultingSize: number;
  bytesSaved: number;
  compressionPercentage: number | null;
  data?: Uint8Array;
  metadata?: DocumentMetadata;
  errors: PdfCompressionError[];
}