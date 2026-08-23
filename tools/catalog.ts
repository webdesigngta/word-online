import type { PlatformTool, ToolCategory } from '@/core/tool-system/toolTypes';
import { wordTool } from './word/config';

export const platformTools = [wordTool] satisfies readonly PlatformTool[];

export function getPlatformTools(category?: ToolCategory): readonly PlatformTool[] {
  return category
    ? platformTools.filter((tool) => tool.category === category)
    : platformTools;
}

export function getEnabledPlatformTools(category?: ToolCategory): readonly PlatformTool[] {
  return getPlatformTools(category).filter((tool) => tool.enabled);
}

export function getPlatformTool(id: string): PlatformTool | undefined {
  return platformTools.find((tool) => tool.id === id);
}
