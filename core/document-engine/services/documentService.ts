import {
  validateFile,
  type FileValidationOptions,
  type FileValidationResult,
} from '../validators/fileValidator';
import {
  documentRegistry,
  type DocumentProcessor,
  type DocumentRegistry,
} from '../registry/documentRegistry';
import type { CreateDocumentInput, Document } from '../types/Document';
import type { DocumentMetadata } from '../types/Metadata';
import type { File } from '../types/File';

export interface DocumentProcessingPlan {
  document: Document;
  processor: DocumentProcessor | null;
}

export class DocumentService {
  constructor(
    private readonly registry: DocumentRegistry = documentRegistry,
    private readonly validationOptions: FileValidationOptions = {},
  ) {}

  createDocumentMetadata(file: File, metadata: DocumentMetadata = {}): Document {
    const validation = this.validateDocument(file);
    if (!validation.valid || !validation.type) {
      throw new Error(validation.errors.join('. ') || 'Invalid document');
    }

    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: validation.type,
      size: file.size,
      metadata: { ...metadata },
      createdAt: now,
      updatedAt: now,
    };
  }

  createDocument(input: CreateDocumentInput): Document {
    const now = Date.now();
    return {
      id: input.id ?? crypto.randomUUID(),
      name: input.name,
      type: input.type,
      size: input.size,
      metadata: { ...input.metadata },
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    };
  }

  validateDocument(file: File): FileValidationResult {
    return validateFile(file, this.validationOptions);
  }

  prepareProcessing(file: File): DocumentProcessingPlan {
    const document = this.createDocumentMetadata(file);
    return {
      document,
      processor: this.registry.get(document.type) ?? null,
    };
  }
}

export const documentService = new DocumentService();
