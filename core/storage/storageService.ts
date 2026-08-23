export interface StorageAdapter {
  save(key: string, value: unknown): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  remove(key: string): Promise<void>;
}

/**
 * Storage abstraction layer.
 *
 * Current: browser local storage.
 * Future: IndexedDB, OPFS, and cloud storage adapters can be added without
 * changing document tools.
 */
export class LocalStorageAdapter implements StorageAdapter {
  async save(key: string, value: unknown): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  async load<T>(key: string): Promise<T | null> {
    if (typeof window === 'undefined') return null;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  }

  async remove(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
}

export const storageService: StorageAdapter = new LocalStorageAdapter();
