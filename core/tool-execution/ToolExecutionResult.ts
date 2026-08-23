import type { DocumentMetadata } from '../document-engine/types/Metadata';

export interface ToolExecutionError {
  code: string;
  message: string;
}

export interface ToolExecutionResult<TOutput = unknown> {
  success: boolean;
  toolId: string;
  output?: TOutput;
  errors: ToolExecutionError[];
  metadata?: DocumentMetadata;
}