import type { Document } from '../document-engine/types/Document';
import type { File } from '../document-engine/types/File';

export interface ToolExecutionOptions {
  [key: string]: unknown;
}

export interface ToolExecutionMetadata {
  [key: string]: unknown;
}

export interface ToolExecutionContext {
  toolId: string;
  documentId?: string;
  input?: unknown;
  document?: Document;
  file?: File;
  files?: readonly File[];
  options: ToolExecutionOptions;
  metadata: ToolExecutionMetadata;
}