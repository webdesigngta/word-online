import type { DocumentType } from '../types/Document';
import type { File } from '../types/File';

export interface DocumentProcessor<TResult = unknown> {
  type: DocumentType;
  process(file: File | readonly File[], options?: Record<string, unknown>): Promise<TResult>;
}

export class DocumentRegistry {
  private readonly processors = new Map<DocumentType, DocumentProcessor[]>();

  register(processor: DocumentProcessor): DocumentProcessor {
    const registered = this.processors.get(processor.type) ?? [];
    if (!registered.includes(processor)) registered.push(processor);
    this.processors.set(processor.type, registered);
    return processor;
  }

  registerMany(processors: readonly DocumentProcessor[]): void {
    processors.forEach((processor) => this.register(processor));
  }

  get(type: DocumentType): DocumentProcessor | undefined {
    return this.processors.get(type)?.[0];
  }

  getAll(type: DocumentType): readonly DocumentProcessor[] {
    return this.processors.get(type) ?? [];
  }

  clear(): void {
    this.processors.clear();
  }
}

export const documentRegistry = new DocumentRegistry();
