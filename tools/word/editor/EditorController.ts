import { createEditorHistory } from './editorHistory';
import { createEditorState } from './editorState';
import { createDocumentCommands } from './documentCommands';

export type EditorControllerOptions = {
  initialContent?: string;
};

/**
 * Coordinates Word editor modules without owning UI state.
 * This keeps the editor boundary ready for future document tools.
 */
export function createEditorController(options: EditorControllerOptions = {}) {
  const state = createEditorState();

  if (options.initialContent !== undefined) {
    state.content = options.initialContent;
  }

  const history = createEditorHistory();
  const commands = createDocumentCommands({ state, history });

  return {
    state,
    history,
    commands,
  };
}
