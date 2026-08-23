export type EditorCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'undo'
  | 'redo'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight';

export function executeEditorCommand(command: EditorCommand, value?: string): boolean {
  if (typeof document === 'undefined') return false;

  return document.execCommand(command, false, value);
}

export type DocumentCommandContext = {
  state?: unknown;
  history?: unknown;
};

export function createDocumentCommands(_context: DocumentCommandContext = {}) {
  return {
    execute: executeEditorCommand,
  };
}
