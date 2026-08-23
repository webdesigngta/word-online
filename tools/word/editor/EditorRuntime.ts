export type EditorRuntimeOptions = {
  documentId?: string;
  initialContent?: string;
};

export type EditorRuntimeSnapshot = {
  documentId: string | null;
  initialContent: string;
};

/**
 * Runtime boundary for the Word editor.
 * Keeps page components separated from editor lifecycle logic.
 */
export class EditorRuntime {
  private options: EditorRuntimeOptions;

  constructor(options: EditorRuntimeOptions = {}) {
    this.options = options;
  }

  getDocumentId() {
    return this.options.documentId ?? null;
  }

  getInitialContent() {
    return this.options.initialContent ?? "";
  }

  getSnapshot(): EditorRuntimeSnapshot {
    return {
      documentId: this.getDocumentId(),
      initialContent: this.getInitialContent(),
    };
  }
}

export function createEditorRuntime(options: EditorRuntimeOptions = {}) {
  return new EditorRuntime(options);
}
