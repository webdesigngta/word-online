import type { Document } from '../types/Document';
import type { File } from '../types/File';

export interface ProcessingOptions {
  [key: string]: unknown;
}

export interface ProcessingContext {
  document: Document;
  file: File;
  options: ProcessingOptions;
}