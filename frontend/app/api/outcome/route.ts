import { NextResponse } from "next/server";

import type { OutcomeReport } from "@/types/incident";

/**
 * /api/outcome — forwards the DARC loop closure to the real FastAPI backend,
 * which retains it into Hindsight so the next similar incident recalls it. The
 * backend's OutcomeRequest accepts this camelCase shape directly. Degrades to a
 * local ack if the backend is unreachable (demo-safe). Set BACKEND_URL to point
 * at FastAPI (default http://localhost:8000).
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const { outcomeReport } = (await req.json()) as { outcomeReport: OutcomeReport };
  if (!outcomeReport?.outcome) {
    return NextResponse.json({ error: "outcome is required" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${BACKEND_URL}/api/outcome`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcomeReport }),
      signal: controller.signal,
    });
    const ok = res.ok;
    return NextResponse.json({ ok, retained: ok, receivedAt: new Date().toISOString() });
  } catch {
    // Backend down — still ack so the UI loop closes (mock-safe).
    return NextResponse.json({ ok: true, retained: false, receivedAt: new Date().toISOString() });
  } finally {
    clearTimeout(timeout);
  }
}
