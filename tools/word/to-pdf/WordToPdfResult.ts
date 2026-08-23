import type { DocumentMetadata } from '../../../core/document-engine/types/Metadata';

export interface WordToPdfSource {
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
}

export interface WordToPdfWarning {
  code: string;
  message: string;
}

export interface WordToPdfError {
  code: string;
  message: string;
}

export interface WordToPdfOutput {
  name: string;
  blob: Blob;
  size: number;
  type: 'application/pdf';
  pageCount: number | null;
}

export interface WordToPdfResult {
  success: boolean;
  source: WordToPdfSource;
  outputSize: number;
  pageCount: number | null;
  output?: WordToPdfOutput;
  metadata?: DocumentMetadata;
  warnings: WordToPdfWarning[];
  errors: WordToPdfError[];
}