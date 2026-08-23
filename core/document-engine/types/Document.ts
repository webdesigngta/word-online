export type DocumentType = 'docx' | 'pdf' | 'xlsx' | 'html' | 'image' | 'txt' | 'rtf' | 'odt';

import type { DocumentMetadata } from './Metadata';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  metadata: DocumentMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface CreateDocumentInput {
  name: string;
  type: DocumentType;
  size: number;
  metadata?: DocumentMetadata;
  id?: string;
  createdAt?: number;
  updatedAt?: number;
}
