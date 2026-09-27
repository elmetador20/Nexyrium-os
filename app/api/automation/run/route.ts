import { NextResponse } from "next/server";

/**
 * Cron entrypoint. A scheduler must provide AUTOMATION_CRON_SECRET. Global
 * evaluation additionally requires a server-only service identity, which this
 * repository does not currently configure; it is deliberately not emulated
 * with browser credentials.
 */
export async function POST(request: Request) {
  const secret = process.env.AUTOMATION_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Cron evaluation requires a configured server-side Supabase service identity." }, { status: 501 });
}
