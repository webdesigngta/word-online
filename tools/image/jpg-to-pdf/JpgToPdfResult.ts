import type { ImageToPdfOutput, ImageToPdfOptions, ImageFile } from '../shared/imageTypes';

export interface JpgToPdfResult {
  success: boolean;
  inputCount: number;
  originalSize: number;
  outputSize: number;
  pageCount: number;
  output?: ImageToPdfOutput;
  warnings: string[];
  errors: { code: string; message: string }[];
}

export type { ImageFile, ImageToPdfOptions };