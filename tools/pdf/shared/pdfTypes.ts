export type PdfCompressionLevel = 'low' | 'medium' | 'high';

export interface PdfFile {
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}