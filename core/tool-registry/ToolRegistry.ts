import type { Tool } from './Tool';

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): Tool {
    if (this.tools.has(tool.id)) {
      throw new Error(`A tool with id "${tool.id}" is already registered`);
    }

    this.tools.set(tool.id, tool);
    return tool;
  }

  registerMany(tools: readonly Tool[]): void {
    tools.forEach((tool) => this.register(tool));
  }

  remove(id: string): boolean {
    return this.tools.delete(id);
  }

  get(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  list(): readonly Tool[] {
    return Array.from(this.tools.values());
  }

  clear(): void {
    this.tools.clear();
  }
}

export const toolRegistry = new ToolRegistry();