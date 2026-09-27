import Groq from "groq-sdk";

/** Provider-neutral content exchanged between the agent runtime and an LLM adapter. */
export type AgentToolCall = { id?: string; name: string; args: Record<string, unknown> };
export type AgentContentPart =
  | { text: string }
  | { functionCall: AgentToolCall }
  | { functionResponse: { id?: string; name: string; response: Record<string, unknown> } };
export type AgentContent = { role?: "user" | "model"; parts: AgentContentPart[] };
export type JsonSchema = {
  type: "object" | "array" | "string";
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  enum?: string[];
};
export type AgentToolDeclaration = { name: string; description?: string; parameters?: JsonSchema };
export type ProviderMetadata = { primaryProvider: string; selectedProvider: string; selectedModel: string; fallbackUsed: boolean };
export type ProviderResponse = { text: string; modelContent: AgentContent; functionCalls: AgentToolCall[]; providerMetadata?: ProviderMetadata };
export type ProviderRequest = { contents: AgentContent[]; systemInstruction: string; tools: AgentToolDeclaration[]; timeoutMs: number };
export type AgentModelProvider = { name: "groq"; model: string; generate(request: ProviderRequest): Promise<ProviderResponse> };

type ProviderError = Error & { status?: number };
type GroqToolCall = { id?: string; function?: { name?: string; arguments?: string } };
type GroqMessage = { content?: unknown; tool_calls?: GroqToolCall[] };

function providerError(message: string, status?: number): ProviderError {
  const error = new Error(message) as ProviderError;
  if (status !== undefined) error.status = status;
  return error;
}

function providerStatus(error: unknown) {
  return error && typeof error === "object" && "status" in error && typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : null;
}

export function isTransientProviderError(error: unknown) {
  const status = providerStatus(error);
  const message = error instanceof Error ? error.message : String(error);
  return status === 429 || (typeof status === "number" && [500, 502, 503, 504].includes(status)) || /timed?\s*out|abort|network|connection/i.test(message);
}

export function maxOutputTokens() {
  const value = Number(process.env.AI_AGENT_MAX_OUTPUT_TOKENS);
  return Number.isInteger(value) && value > 0 ? Math.min(16_384, value) : 4_096;
}

export function groqProviderName(): "groq" {
  const selected = process.env.AI_PROVIDER?.trim().toLowerCase() || "groq";
  if (selected !== "groq") throw providerError("AI_PROVIDER must be configured as groq.");
  return "groq";
}

function sanitizeErrorMessage(message: unknown, fallback: string) {
  if (typeof message !== "string" || !message.trim()) return fallback;
  return message.replace(/[\r\n]+/g, " ")
    .replace(/\b(authorization|proxy-authorization|x-api-key|api[-_ ]?key)\s*[:=]\s*(?:bearer\s+)?[^\s,;]+/gi, "$1=[REDACTED]")
    .replace(/\bbearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/\b(?:gsk|sk|or)-[A-Za-z0-9_-]{8,}\b|\bAIza[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]")
    .replace(/\b(?:request body|prompt|tool arguments?)\s*[:=].*$/i, "$1=[REDACTED]")
    .trim().slice(0, 500);
}

function failureMetadata(model: string, error: unknown, latencyMs: number, toolCallCount: number) {
  return { provider: "groq", model, status: providerStatus(error), errorType: error instanceof Error ? error.name : typeof error, errorMessage: sanitizeErrorMessage(error instanceof Error ? error.message : String(error), "Groq request failed."), retryable: isTransientProviderError(error), latencyMs, toolCallCount };
}

function logFailure(model: string, error: unknown, startedAt: number, toolCallCount = 0) {
  console.warn(JSON.stringify(failureMetadata(model, error, Date.now() - startedAt, toolCallCount)));
}

function textParts(content: AgentContent) {
  return content.parts.flatMap((part) => "text" in part ? [part.text] : []);
}

function toGroqMessages(contents: AgentContent[]) {
  const messages: Array<Record<string, unknown>> = [];
  for (const content of contents) {
    const functionCalls = content.parts.flatMap((part) => "functionCall" in part ? [{ id: part.functionCall.id, type: "function", function: { name: part.functionCall.name, arguments: JSON.stringify(part.functionCall.args) } }] : []);
    const functionResponses = content.parts.flatMap((part) => "functionResponse" in part ? [{ id: part.functionResponse.id, name: part.functionResponse.name, response: part.functionResponse.response }] : []);
    const text = textParts(content).join("\n").trim();
    if (functionResponses.length) for (const result of functionResponses) messages.push({ role: "tool", tool_call_id: result.id || result.name, content: JSON.stringify(result.response) });
    else if (content.role === "model") messages.push({ role: "assistant", content: text || null, ...(functionCalls.length ? { tool_calls: functionCalls } : {}) });
    else if (text) messages.push({ role: "user", content: text });
  }
  return messages;
}

function groqTools(tools: AgentToolDeclaration[]) {
  return tools.map((tool) => ({ type: "function" as const, function: { name: tool.name, ...(tool.description ? { description: tool.description } : {}), parameters: tool.parameters || { type: "object", properties: {} } } }));
}

export function parseGroqResponse(data: unknown): ProviderResponse {
  const root = data && typeof data === "object" ? data as { choices?: Array<{ message?: GroqMessage }> } : null;
  const message = root?.choices?.[0]?.message;
  if (!message || typeof message !== "object") throw providerError("Groq returned a malformed response.");
  const text = typeof message.content === "string" ? message.content : "";
  let functionCalls: AgentToolCall[];
  try {
    functionCalls = (Array.isArray(message.tool_calls) ? message.tool_calls : []).map((call, index) => {
      const name = call?.function?.name;
      if (!name || typeof name !== "string") throw providerError("Groq returned a malformed tool call.");
      const args = JSON.parse(call.function?.arguments || "{}") as unknown;
      if (!args || typeof args !== "object" || Array.isArray(args)) throw providerError("Groq returned malformed tool arguments.");
      return { id: call.id || `${name}-${index}`, name, args: args as Record<string, unknown> };
    });
  } catch (error) {
    throw error instanceof Error && error.message.startsWith("Groq returned malformed") ? error : providerError("Groq returned malformed tool arguments.");
  }
  if (!text && !functionCalls.length) throw providerError("Groq returned an empty response.");
  return { text, functionCalls, modelContent: { role: "model", parts: [...(text ? [{ text }] : []), ...functionCalls.map((call) => ({ functionCall: call }))] } };
}

export function createAgentModelProvider(): AgentModelProvider {
  groqProviderName();
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw providerError("Groq requires GROQ_API_KEY.");
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const client = new Groq({ apiKey, maxRetries: 0 });
  return {
    name: "groq", model,
    async generate({ contents, systemInstruction, tools, timeoutMs }) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const completion = await client.chat.completions.create({ model, messages: [{ role: "system", content: systemInstruction }, ...toGroqMessages(contents)] as never, tools: groqTools(tools), temperature: 0.2, parallel_tool_calls: false, max_completion_tokens: maxOutputTokens() }, { signal: controller.signal, timeout: timeoutMs, maxRetries: 0 });
        return { ...parseGroqResponse(completion), providerMetadata: { primaryProvider: "groq", selectedProvider: "groq", selectedModel: model, fallbackUsed: false } };
      } catch (error) {
        const normalized = controller.signal.aborted ? providerError("Groq request timed out.") : providerError(sanitizeErrorMessage(error instanceof Error ? error.message : String(error), "Groq request failed."), providerStatus(error) ?? undefined);
        logFailure(model, normalized, startedAt);
        throw normalized;
      } finally { clearTimeout(timeout); }
    },
  };
}
