import { NextResponse } from "next/server";

import type {
  DiagnoseInput,
  RecallHit,
  Scenario,
  ScenarioKey,
  Step,
  TopMatch,
} from "@/types/incident";

/**
 * /api/diagnose — proxies to the real FastAPI backend and adapts its
 * DiagnosisResult into the frontend's Scenario shape. If the backend is
 * unreachable or errors, this returns 502 so the client service falls back to
 * mock data (see services/diagnosis.service.ts). Set BACKEND_URL to point at
 * FastAPI (default http://localhost:8000).
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

// ── FastAPI DiagnosisResult (camelCase wire shape) ──────────────────────────
interface BackendEvidence {
  incidentId: string;
  title: string;
  similarity: number;
  outcome: "success" | "failure";
  mttrMinutes: number;
  freshness?: "stable" | "strengthening" | "weakening" | "stale";
  rootCause: string;
  resolution: string;
}
interface BackendDiagnosis {
  rootCause: string;
  recommendedFix: string;
  avoid: string[];
  supportingIncidentIds: string[];
  confidence: number;
  confidenceBand: "high" | "medium" | "low";
  freshnessWarning: string | null;
  verified: boolean;
  rationale: string;
  steps: Step[];
  mttrMinutes: number;
  history: { mttr: number[]; labels: string[] };
  evidence: BackendEvidence[];
}

function fmtMttr(mins: number): string {
  if (!mins) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h${m}m` : `${h}h`;
}

function pickKey(symptom: string, useMemory: boolean): ScenarioKey {
  if (!useMemory) return "baseline";
  const s = symptom.toLowerCase();
  if (/5xx|deploy|pool|503/.test(s)) return "payments5xx";
  if (/429|surge|retry/.test(s)) return "auth429";
  if (/oom|memory|leak|crashloop/.test(s)) return "oom";
  if (/tls|cert|ssl|handshake/.test(s)) return "tls";
  if (/stale|replica/.test(s)) return "stale";
  return "payments5xx";
}

function toScenario(d: BackendDiagnosis, input: DiagnoseInput): Scenario {
  const retrieved: RecallHit[] = d.evidence.map((e) => ({
    id: e.incidentId,
    title: e.title,
    sim: e.similarity,
    status: e.outcome === "failure" ? "failed" : "resolved",
    mttr: fmtMttr(e.mttrMinutes),
    freshness: e.freshness,
  }));

  const e0 = d.evidence[0];
  const top: TopMatch | null = e0
    ? {
        id: e0.incidentId,
        sim: e0.similarity,
        rootCause: e0.rootCause,
        resolution: e0.resolution,
        mttr: fmtMttr(e0.mttrMinutes),
      }
    : null;

  return {
    key: pickKey(input.symptom, input.useMemory),
    rootCause: d.rootCause,
    recommendedFix: d.recommendedFix,
    confidence: d.confidence,
    confidenceBand: d.confidenceBand,
    freshnessWarning: d.freshnessWarning,
    avoid: d.avoid,
    citations: d.supportingIncidentIds,
    verified: d.verified,
    mttr: d.mttrMinutes,
    rationale: d.rationale,
    steps: d.steps,
    retrieved,
    top,
    history: d.history,
  };
}

export async function POST(req: Request) {
  const { input } = (await req.json()) as { input: DiagnoseInput };
  if (!input?.symptom) {
    return NextResponse.json({ error: "symptom is required" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(`${BACKEND_URL}/api/diagnose`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: { service: input.service, symptom: input.symptom },
        useMemory: input.useMemory,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      // Non-2xx → let the client fall back to mock data.
      return NextResponse.json({ error: `backend ${res.status}` }, { status: 502 });
    }
    const data = (await res.json()) as BackendDiagnosis;
    return NextResponse.json(toScenario(data, input));
  } catch {
    return NextResponse.json({ error: "backend unreachable" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
