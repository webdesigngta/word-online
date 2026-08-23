export type ImageFormat = 'jpg' | 'png';

export interface ImageFile {
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface ImageToPdfOptions {
  pageFormat?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  fit?: 'contain' | 'cover';
  backgroundColor?: { r: number; g: number; b: number };
}

export interface ImageToPdfOutput {
  name: string;
  blob: Blob;
  size: number;
  pageCount: number;
}