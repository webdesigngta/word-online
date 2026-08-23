import type { DocumentType } from './Document';

export interface File {
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
}

export interface TypedFile extends File {
  documentType: DocumentType;
}
