import { NextResponse } from "next/server";

import type { OutcomeReport } from "@/types/incident";

/**
 * Mock /api/outcome — accepts the DARC loop closure payload and acks.
 * Mirrors the prototype's outcome fetch (standalone.html line 1241-1245).
 */
export async function POST(req: Request) {
  const { outcomeReport } = (await req.json()) as { outcomeReport: OutcomeReport };
  if (!outcomeReport?.outcome) {
    return NextResponse.json({ error: "outcome is required" }, { status: 400 });
  }
  // In production this would write to Hindsight / a memory store.
  return NextResponse.json({ ok: true, receivedAt: new Date().toISOString() });
}
