import { createEditorController } from './EditorController';

export type EditorBridgeOptions = {
  initialContent?: string;
};

/**
 * Small integration boundary between the Word page and editor modules.
 * Keeps route components independent from editor internals.
 */
export function createEditorBridge(options: EditorBridgeOptions = {}) {
  return createEditorController({
    initialContent: options.initialContent ?? '',
  });
}
