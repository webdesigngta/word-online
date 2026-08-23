'use client';

import { useEffect } from 'react';
import { trackToolEvent } from '@/lib/toolAnalytics';

export function ToolViewAnalytics({
  toolId,
  route,
  editor = false,
}: {
  toolId: string;
  route?: string;
  editor?: boolean;
}) {
  useEffect(() => {
    trackToolEvent('tool_view', { toolId, route });
    if (editor) trackToolEvent('editor_loaded', { toolId, route });
  }, [editor, route, toolId]);

  return null;
}
