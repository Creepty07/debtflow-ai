/** Result returned by a tool execution. */
export type ToolResult = {
  success: boolean;
  /** Data the tool returns to the orchestrator / LLM on success. */
  data?: unknown;
  /** Error detail when success is false. */
  error?: string;
};

/**
 * Contract for the six agent tools.
 * Shape mirrors the LLMToolDefinition so the orchestrator can serialize it
 * directly as a tool definition when calling the LLM.
 * Wrap with a Decorator to add logging and error handling without touching implementations.
 */
export interface ITool {
  /** Unique tool name passed to the LLM. */
  readonly name: string;
  /** Human-readable description; used in the tool definition sent to the LLM. */
  readonly description: string;
  /** JSON Schema object describing accepted input parameters. */
  readonly parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>): Promise<ToolResult>;
}
