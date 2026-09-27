import { NextResponse } from "next/server";
import { EVALUATION_DATASET_VERSION, evaluationCases } from "@/lib/ai-agent/evaluation/dataset";
import { runReadOnlyEvaluation } from "@/lib/ai-agent/evaluation/evaluator";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/profile";
import { enforceRateLimit, rateLimitedResponse, requestIdentity, safeErrorCategory } from "@/lib/server/reliability";

const ROLES = ["SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER", "PROJECT_MANAGER"];
async function authorize() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null; const profile = await getUserProfile(supabase, user.id); return profile?.status === "ACTIVE" && ROLES.includes(profile.roleName || "") ? { supabase, user, profile } : null; }
export async function GET() { if (!await authorize()) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); return NextResponse.json({ version: EVALUATION_DATASET_VERSION, totalCases: evaluationCases.length, categories: evaluationCases.reduce<Record<string, number>>((out, item) => ({ ...out, [item.category]: (out[item.category] || 0) + 1 }), {}), observability: process.env.LANGSMITH_TRACING === "true" && process.env.LANGSMITH_API_KEY ? "enabled" : "disabled" }); }
export async function POST(request: Request) { const context = await authorize(); if (!context) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const retryAfter = enforceRateLimit(`ai-evaluation:${requestIdentity(request, context.user.id)}`, 2, 15 * 60_000); if (retryAfter) return rateLimitedResponse(retryAfter); try { return NextResponse.json(await runReadOnlyEvaluation(context)); } catch (error) { console.error("AI evaluation failed", { category: safeErrorCategory(error), error: error instanceof Error ? error.message : "unknown" }); return NextResponse.json({ error: "Evaluation could not run. Please try again later." }, { status: 502 }); } }
