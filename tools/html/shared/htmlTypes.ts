import type { File } from '../../../core/document-engine/types/File';

export interface HtmlFile extends File { arrayBuffer(): Promise<ArrayBuffer>; }

export interface HtmlToPdfOptions {
  pageFormat?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  filename?: string;
}

export interface HtmlToPdfOutput {
  name: string;
  blob: Blob;
  size: number;
  type: 'application/pdf';
  pageCount: number | null;
}

export interface HtmlToPdfWarning { code: string; message: string; }
export interface HtmlToPdfError { code: string; message: string; }

export interface HtmlToPdfResult {
  success: boolean;
  source: { name: string; size: number; type?: string; lastModified?: number };
  outputSize: number;
  pageCount: number | null;
  output?: HtmlToPdfOutput;
  warnings: HtmlToPdfWarning[];
  errors: HtmlToPdfError[];
}