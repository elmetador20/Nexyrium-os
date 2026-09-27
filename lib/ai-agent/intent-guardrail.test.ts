import assert from "node:assert/strict";
import test from "node:test";
import { classifyNexyriumIntent, intentGuardrailResponse } from "./intent-guardrail";

process.env.OPENROUTER_API_KEY = "test-key";
process.env.NEXYRIUM_INTENT_MIN_CONFIDENCE = "0.8";

function response(scope: number, capability: string, confidence = 0.95) {
  return new Response(JSON.stringify({ model: "typesafe/jev-1.13", answers: { isNexyrium: { type: "noul", noul: scope }, capability: { type: "choice", choice: capability, confidence } }, usage: { input_tokens: 42, cost: 0.000001764 } }), { status: 200, headers: { "Content-Type": "application/json" } });
}

test("allows valid Nexyrium classifications", async () => {
  for (const [message, capability] of [["Who is overloaded?", "EMPLOYEE"], ["Why is Project Alpha delayed?", "PROJECT"], ["Create a task for Rahul", "ACTION"], ["How does Nexyrium calculate overload?", "SYSTEM_EXPLANATION"], ["Should Nexyrium integrate Slack?", "PRODUCT_ADVICE"]] as const) {
    const decision = await classifyNexyriumIntent(message, async () => response(0.97, capability));
    assert.equal(decision.allowed, true);
    if (decision.allowed) assert.equal(decision.capability, capability);
  }
});

test("blocks out-of-scope decisions", async () => {
  for (const message of ["What is 25 × 48?", "Who is the Prime Minister of India?", "Explain quantum mechanics"]) {
    const decision = await classifyNexyriumIntent(message, async () => response(0.02, "OUT_OF_SCOPE"));
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.reason, "out_of_scope");
      assert.equal(intentGuardrailResponse(decision), "That's outside Nexyrium's current scope.");
    }
  }
});

test("fails closed for provider errors and malformed responses", async () => {
  const rateLimited = await classifyNexyriumIntent("Who is overloaded?", async () => new Response("", { status: 429 }));
  assert.deepEqual({ allowed: rateLimited.allowed, reason: rateLimited.allowed ? undefined : rateLimited.reason, category: rateLimited.allowed ? undefined : rateLimited.failureCategory }, { allowed: false, reason: "unavailable", category: "rate_limited" });
  const malformed = await classifyNexyriumIntent("Who is overloaded?", async () => new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
  assert.equal(malformed.allowed, false);
  if (!malformed.allowed) assert.equal(malformed.failureCategory, "malformed_response");
  const timeout = await classifyNexyriumIntent("Who is overloaded?", async () => { throw new DOMException("Timed out", "AbortError"); });
  assert.equal(timeout.allowed, false);
  if (!timeout.allowed) assert.equal(timeout.reason, "unavailable");
});

test("routes low-confidence results to clarification", async () => {
  const decision = await classifyNexyriumIntent("Who is overloaded?", async () => response(0.7, "EMPLOYEE", 0.95));
  assert.equal(decision.allowed, false);
  if (!decision.allowed) assert.equal(decision.reason, "uncertain");
});
