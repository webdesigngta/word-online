import type { File } from '../../../core/document-engine/types/File';

export interface SpreadsheetFile extends File {
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface SpreadsheetToPdfOptions {
  sheetNames?: readonly string[];
  pageFormat?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  filename?: string;
}

export interface SpreadsheetToPdfOutput {
  name: string;
  blob: Blob;
  size: number;
  type: 'application/pdf';
  pageCount: number | null;
  sheetNames: string[];
}

export interface SpreadsheetWarning { code: string; message: string; }
export interface SpreadsheetError { code: string; message: string; }

export interface SpreadsheetToPdfResult {
  success: boolean;
  source?: { name: string; size: number; type?: string; lastModified?: number };
  outputSize: number;
  pageCount: number | null;
  output?: SpreadsheetToPdfOutput;
  warnings: SpreadsheetWarning[];
  errors: SpreadsheetError[];
}