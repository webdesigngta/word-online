import type { ImageToPdfOutput } from '../shared/imageTypes';

export interface PngToPdfResult {
  success: boolean;
  inputCount: number;
  originalSize: number;
  outputSize: number;
  pageCount: number;
  output?: ImageToPdfOutput;
  warnings: string[];
  errors: { code: string; message: string }[];
}