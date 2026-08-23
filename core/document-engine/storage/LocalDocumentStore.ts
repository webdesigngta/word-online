import type { Document } from '../types/Document';
import { DocumentStore } from './DocumentStore';
import type { StorageAdapter } from './StorageAdapter';

const DOCUMENT_KEY_PREFIX = 'document-engine:document:';

class LocalStorageDocumentAdapter implements StorageAdapter {
  async save(document: Document): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      `${DOCUMENT_KEY_PREFIX}${document.id}`,
      JSON.stringify(document),
    );
  }

  async load(id: string): Promise<Document | null> {
    if (typeof window === 'undefined') return null;
    const value = window.localStorage.getItem(`${DOCUMENT_KEY_PREFIX}${id}`);
    return value ? JSON.parse(value) as Document : null;
  }

  async delete(id: string): Promise<void> {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(`${DOCUMENT_KEY_PREFIX}${id}`);
  }

  async list(): Promise<readonly Document[]> {
    if (typeof window === 'undefined') return [];

    const documents: Document[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(DOCUMENT_KEY_PREFIX)) continue;
      const value = window.localStorage.getItem(key);
      if (value) documents.push(JSON.parse(value) as Document);
    }
    return documents;
  }
}

export class LocalDocumentStore extends DocumentStore {
  constructor(adapter: StorageAdapter = new LocalStorageDocumentAdapter()) {
    super(adapter);
  }
}