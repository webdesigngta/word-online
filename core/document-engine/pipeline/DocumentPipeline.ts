import {
  documentRegistry,
  type DocumentRegistry,
} from '../registry/documentRegistry';
import {
  documentService,
  type DocumentService,
} from '../services/documentService';
import type { Document } from '../types/Document';
import type { File } from '../types/File';
import type { ProcessingContext, ProcessingOptions } from './ProcessingContext';
import type { ProcessingResult } from './ProcessingResult';

export class DocumentPipeline {
  constructor(
    private readonly service: DocumentService = documentService,
    private readonly registry: DocumentRegistry = documentRegistry,
  ) {}

  async process(
    document: Document,
    file: File,
    options: ProcessingOptions = {},
  ): Promise<ProcessingResult> {
    const validation = this.service.validateDocument(file);
    if (!validation.valid || validation.type !== document.type) {
      return {
        success: false,
        errors: validation.errors.length
          ? validation.errors
          : ['File type does not match document metadata'],
      };
    }

    const processor = this.registry.get(document.type);
    if (!processor) {
      return {
        success: false,
        errors: [`No processor registered for ${document.type}`],
      };
    }

    const context: ProcessingContext = { document, file, options };

    try {
      const output = await processor.process(context.file, context.options);
      return {
        success: true,
        outputMetadata:
          output && typeof output === 'object' ? output as Record<string, unknown> : undefined,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Document processing failed'],
      };
    }
  }
}

export const documentPipeline = new DocumentPipeline();