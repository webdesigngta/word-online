export interface WordEditorState {
  title: string;
  content: string;
  zoom: number;
  dirty: boolean;
}

export const defaultWordEditorState: WordEditorState = {
  title: 'Untitled document',
  content: '',
  zoom: 100,
  dirty: false,
};

export function updateEditorContent(
  state: WordEditorState,
  content: string,
): WordEditorState {
  return {
    ...state,
    content,
    dirty: true,
  };
}

export function updateEditorTitle(
  state: WordEditorState,
  title: string,
): WordEditorState {
  return {
    ...state,
    title,
    dirty: true,
  };
}

export function createEditorState(): WordEditorState {
  return { ...defaultWordEditorState };
}
