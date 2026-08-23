export type EditorSnapshot = {
  content: string;
  timestamp: number;
};

export class EditorHistory {
  private undoStack: EditorSnapshot[] = [];
  private redoStack: EditorSnapshot[] = [];

  push(snapshot: EditorSnapshot) {
    this.undoStack.push(snapshot);
    this.redoStack = [];
  }

  undo(current: EditorSnapshot) {
    const previous = this.undoStack.pop();
    if (previous) this.redoStack.push(current);
    return previous ?? null;
  }

  redo(current: EditorSnapshot) {
    const next = this.redoStack.pop();
    if (next) this.undoStack.push(current);
    return next ?? null;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export function createEditorHistory() {
  return new EditorHistory();
}
