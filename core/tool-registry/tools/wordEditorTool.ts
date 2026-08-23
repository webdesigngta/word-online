import type { Tool } from '../Tool';
import { toolRegistry, type ToolRegistry } from '../ToolRegistry';

export const wordEditorTool = {
  id: 'word-editor',
  name: 'Word Editor',
  description: 'Edit DOCX documents in the browser.',
  category: 'editor',
  supportedDocumentTypes: ['docx'],
} satisfies Tool;

export function registerWordEditorTool(registry: ToolRegistry = toolRegistry): Tool {
  const registered = registry.get(wordEditorTool.id);
  return registered ?? registry.register(wordEditorTool);
}