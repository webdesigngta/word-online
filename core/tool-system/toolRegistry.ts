import type { PlatformTool, ToolCategory } from './toolTypes';

const tools = new Map<string, PlatformTool>();

export function registerTool(tool: PlatformTool): PlatformTool {
  tools.set(tool.id, tool);
  return tool;
}

export function registerTools(nextTools: readonly PlatformTool[]): void {
  nextTools.forEach(registerTool);
}

export function getTools(category?: ToolCategory): PlatformTool[] {
  const values = Array.from(tools.values());
  return category ? values.filter((tool) => tool.category === category) : values;
}

export function getTool(id: string): PlatformTool | undefined {
  return tools.get(id);
}

export function clearTools(): void {
  tools.clear();
}
