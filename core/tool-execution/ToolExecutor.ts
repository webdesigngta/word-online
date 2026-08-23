import {
  toolRegistry,
  type ToolRegistry,
} from '../tool-registry';
import type { ToolExecutionContext } from './ToolExecutionContext';
import type { ToolExecutionError, ToolExecutionResult } from './ToolExecutionResult';

export class ToolExecutor {
  constructor(private readonly registry: ToolRegistry = toolRegistry) {}

  async execute<TOutput = unknown>(
    context: ToolExecutionContext,
  ): Promise<ToolExecutionResult<TOutput>> {
    const tool = this.registry.get(context.toolId);
    if (!tool) {
      return this.failure(context.toolId, {
        code: 'TOOL_NOT_FOUND',
        message: `No tool registered with id "${context.toolId}"`,
      });
    }

    if (!tool.execute) {
      return this.failure(context.toolId, {
        code: 'TOOL_HANDLER_UNAVAILABLE',
        message: `Tool "${context.toolId}" does not have an execution handler`,
      });
    }

    try {
      const output = await tool.execute(context);
      return {
        success: true,
        toolId: context.toolId,
        output: output as TOutput,
        errors: [],
      };
    } catch (error) {
      return this.failure(context.toolId, {
        code: 'TOOL_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Tool execution failed',
      });
    }
  }

  private failure<TOutput>(
    toolId: string,
    error: ToolExecutionError,
  ): ToolExecutionResult<TOutput> {
    return {
      success: false,
      toolId,
      errors: [error],
    };
  }
}

export const toolExecutor = new ToolExecutor();