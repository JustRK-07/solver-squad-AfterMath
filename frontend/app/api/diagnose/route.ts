import { NextResponse } from "next/server";

import { pickScenario } from "@/services/diagnosis.service";
import { SCENARIOS } from "@/lib/mockData";
import type { DiagnoseInput } from "@/types/incident";

/**
 * Mock /api/diagnose — picks a scenario from the free-text symptom and
 * returns the matching SCENARIOS entry. Mirrors the prototype's fetch
 * (standalone.html line 925-931). When a real LLM/Hindsight backend is
 * ready, swap the body of this handler.
 */
export async function POST(req: Request) {
  const { input } = (await req.json()) as { input: DiagnoseInput };
  if (!input?.symptom) {
    return NextResponse.json({ error: "symptom is required" }, { status: 400 });
  }
  const key = pickScenario(input.symptom, input.useMemory);
  const scenario = SCENARIOS[key];
  // 250ms artificial latency (shorter than the 450ms client-side fallback
  // so the page is snappy when this route actually exists).
  await new Promise((r) => setTimeout(r, 250));
  return NextResponse.json(scenario);
}
