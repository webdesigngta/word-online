import type { DocumentType } from '../document-engine/types/Document';
import type { ToolExecutionContext } from '../tool-execution/ToolExecutionContext';

export type { ToolExecutionContext } from '../tool-execution/ToolExecutionContext';

export type ToolCategory = 'editor' | 'pdf' | 'converter' | 'viewer' | 'utility';

export type ToolExecuteHandler<TResult = unknown> = (
  context: ToolExecutionContext,
) => Promise<TResult>;

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  supportedDocumentTypes: readonly DocumentType[];
  execute?: ToolExecuteHandler;
}