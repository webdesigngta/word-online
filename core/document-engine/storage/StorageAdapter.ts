import type { Document } from '../types/Document';

export interface StorageAdapter {
  save(document: Document): Promise<void>;
  load(id: string): Promise<Document | null>;
  delete(id: string): Promise<void>;
  list(): Promise<readonly Document[]>;
}