import type { DocumentMetadata } from '../types/Metadata';

export interface ProcessingResult {
  success: boolean;
  outputMetadata?: DocumentMetadata;
  errors: string[];
}