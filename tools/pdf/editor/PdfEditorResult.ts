import type { DocumentMetadata } from '../../../core/document-engine/types/Metadata';

export interface PdfEditorSource {
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
}

export interface PdfEditorWarning {
  code: string;
  message: string;
}

export interface PdfEditorError {
  code: string;
  message: string;
}

export interface PdfEditorOutput {
  name: string;
  blob: Blob;
  size: number;
  type: 'application/pdf';
  pageCount: number;
}

export interface PdfEditorResult {
  success: boolean;
  source: PdfEditorSource;
  originalSize: number;
  resultingSize: number;
  originalPageCount: number | null;
  pageCount: number | null;
  operationsApplied: number;
  output?: PdfEditorOutput;
  metadata?: DocumentMetadata;
  warnings: PdfEditorWarning[];
  errors: PdfEditorError[];
}