import { NextResponse } from "next/server";

type Limit = { count: number; resetAt: number };
const limits = new Map<string, Limit>();

/** Per-process limiter. Production multi-instance deployments should replace this with a distributed store. */
export function enforceRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = limits.get(key);
  const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  entry.count += 1; limits.set(key, entry);
  return entry.count <= max ? null : Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
}

export function rateLimitedResponse(retryAfter: number) {
  return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
}

export function requestIdentity(request: Request, userId: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return `${userId}:${ip}`;
}

export function isMissingAutomationTable(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "PGRST205");
}

export function automationUnavailableResponse() {
  return NextResponse.json({ error: "Automation persistence unavailable — database migration required.", code: "AUTOMATION_MIGRATION_REQUIRED" }, { status: 503 });
}

export function safeErrorCategory(error: unknown) {
  const status = error && typeof error === "object" && "status" in error ? (error as { status?: unknown }).status : undefined;
  const message = error instanceof Error ? error.message : String(error);
  if (status === 429) return "rate_limited";
  if (typeof status === "number" && status >= 500 && status <= 599) return "transient_provider";
  if (typeof status === "number" && status >= 400 && status <= 499) return "validation";
  if (/timeout|abort/i.test(message)) return "timeout";
  if (/429|rate limit|quota|resource exhausted/i.test(message)) return "rate_limited";
  if (/5\d\d|unavailable|network/i.test(message)) return "transient_provider";
  if (/malformed|invalid|validation/i.test(message)) return "validation";
  return "unexpected";
}
