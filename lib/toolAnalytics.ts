export type ToolEventName =
  | 'tool_view'
  | 'tool_start'
  | 'tool_success'
  | 'tool_error'
  | 'tool_download'
  | 'editor_loaded'
  | 'meaningful_edit';

export type ToolEventDetail = {
  toolId: string;
  route?: string;
  fileType?: string;
  outputType?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackToolEvent(name: ToolEventName, detail: ToolEventDetail) {
  if (typeof window === 'undefined') return;

  const payload = {
    event: `word_online_${name}`,
    ...detail,
  };

  window.dispatchEvent(new CustomEvent('word-online:analytics', { detail: payload }));
  window.dataLayer?.push(payload);
}
