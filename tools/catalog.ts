import type { PlatformTool, ToolCategory } from '@/core/tool-system/toolTypes';
import { wordInterfaces } from './word/interfaces/config';

const wordInterfaceTools = wordInterfaces.map((tool) => ({
  id: tool.id,
  name: tool.name,
  route: tool.route,
  category: tool.kind === 'converter' ? 'converter' : 'document',
  description: tool.description,
  enabled: true,
})) satisfies readonly PlatformTool[];

export const platformTools = wordInterfaceTools;

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
