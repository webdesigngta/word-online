import type { DocumentMetadata } from '../../../core/document-engine/types/Metadata';

export interface PdfToWordSource {
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
}

export interface PdfToWordWarning {
  code: string;
  message: string;
}

export interface PdfToWordError {
  code: string;
  message: string;
}

export interface PdfToWordOutput {
  name: string;
  blob: Blob;
  size: number;
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

export interface PdfToWordResult {
  success: boolean;
  source: PdfToWordSource;
  originalPageCount: number | null;
  outputSize: number;
  output?: PdfToWordOutput;
  metadata?: DocumentMetadata;
  warnings: PdfToWordWarning[];
  errors: PdfToWordError[];
}