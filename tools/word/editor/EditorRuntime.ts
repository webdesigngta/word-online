import {
  wordRuntime as defaultWordRuntime,
  type WordRuntime,
} from '../runtime';

export type EditorRuntimeOptions = {
  documentId?: string;
  initialContent?: string;
  wordRuntime?: WordRuntime;
};

export type EditorRuntimeSnapshot = {
  documentId: string | null;
  initialContent: string;
};

/**
 * Runtime boundary for the Word editor.
 *
 * The UI talks to this runtime instead of importing file, draft, or session
 * services directly. That keeps the current editor compatible while giving
 * future tool interfaces a stable lifecycle boundary.
 */
export class EditorRuntime {
  private readonly options: Omit<EditorRuntimeOptions, 'wordRuntime'>;
  private readonly runtime: WordRuntime;

  constructor(options: EditorRuntimeOptions = {}) {
    const {
      wordRuntime = defaultWordRuntime,
      ...editorOptions
    } = options;

    this.options = editorOptions;
    this.runtime = wordRuntime;
  }

  get files() {
    return this.runtime.files;
  }

  get session() {
    return this.runtime.session;
  }

  get draft() {
    return this.runtime.draft;
  }

  getWordRuntime(): WordRuntime {
    return this.runtime;
  }

  getDocumentId() {
    return this.options.documentId ?? null;
  }

  getInitialContent() {
    return this.options.initialContent ?? '';
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
