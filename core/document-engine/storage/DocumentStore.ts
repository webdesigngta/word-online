import type { Document } from '../types/Document';
import type { StorageAdapter } from './StorageAdapter';

export class DocumentStore {
  constructor(private readonly adapter: StorageAdapter) {}

  save(document: Document): Promise<void> {
    return this.adapter.save(document);
  }

  load(id: string): Promise<Document | null> {
    return this.adapter.load(id);
  }

  delete(id: string): Promise<void> {
    return this.adapter.delete(id);
  }

  list(): Promise<readonly Document[]> {
    return this.adapter.list();
  }
}