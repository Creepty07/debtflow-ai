/** A single message in the conversation history. */
export type LLMMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/** A tool the LLM may invoke, serialized as a definition. */
export type LLMToolDefinition = {
  name: string;
  description: string;
  /** JSON Schema object describing the tool's input parameters. */
  parameters: Record<string, unknown>;
};

/** Input to a single LLM generation call. */
export type LLMRequest = {
  systemPrompt?: string;
  messages: LLMMessage[];
  tools?: LLMToolDefinition[];
};

/** A tool call requested by the LLM inside a response. */
export type LLMToolCall = {
  name: string;
  /** Parsed arguments as returned by the model. */
  arguments: Record<string, unknown>;
};

/** Output of a single LLM generation call. */
export type LLMResponse = {
  /** Text content when the model replies directly. */
  text?: string;
  /** Present when the model wants to invoke a tool instead of replying. */
  toolCall?: LLMToolCall;
};

/** Provider-agnostic contract for LLM inference. Implementations supply the concrete SDK calls. */
export interface ILLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}
