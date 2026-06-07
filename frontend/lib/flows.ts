// ── Flow builder — translates a diagnosis scenario into the 3-card flow stack ──
// Mirrors the flowPayload construction in standalone.html `renderDiagnosis` (lines 972-981).

import { nowUTC } from "@/lib/utils";
import type { Flow, Scenario, ScenarioKey } from "@/types/incident";

export function buildFlows(
  scenario: Scenario,
  useMemory: boolean,
  service: string,
  symptom: string,
): Flow[] {
  const ts = Date.now();
  if (!useMemory) {
    return [
      {
        kind: "retain",
        name: "Retain",
        desc: "— (skipped, no memory)",
        resultCount: 0,
        resultLabel: "0 signals",
        expanded: false,
        ts,
        body: { note: "memory OFF — no retention performed" },
      },
      {
        kind: "recall",
        name: "Recall",
        desc: "— (skipped, no memory)",
        resultCount: 0,
        resultLabel: "0 results",
        expanded: false,
        ts,
        body: { note: "memory OFF — no retrieval performed" },
      },
      {
        kind: "reflect",
        name: "Reflect",
        desc: "— raw LLM baseline",
        resultCount: 1,
        resultLabel: "1 hypothesis",
        expanded: false,
        ts,
        body: { prompt: symptom, response: scenario.recommendedFix, citations: [] },
      },
    ];
  }
  const hits = scenario.retrieved ?? [];
  return [
    {
      kind: "retain",
      name: "Retain",
      desc: "— ingested live signals",
      resultCount: 3,
      resultLabel: "3 signals",
      expanded: false,
      ts,
      body: {
        signals: [
          { service, ts: nowUTC(), note: "5xx spike, p99 6.2s" },
        ],
      },
    },
    {
      kind: "recall",
      name: "Recall",
      desc: "— searched incident memory",
      resultCount: hits.length,
      resultLabel: `${hits.length} result${hits.length === 1 ? "" : "s"}`,
      expanded: true,
      ts,
      body: { hits },
    },
    {
      kind: "reflect",
      name: "Reflect",
      desc: "— root-cause hypothesis",
      resultCount: 1,
      resultLabel: "1 hypothesis",
      expanded: false,
      ts,
      body: {
        hypothesis: scenario.rootCause,
        confidence: scenario.confidence,
        band: scenario.confidenceBand,
        citations: scenario.citations ?? [],
      },
    },
  ];
}

/** Pick the demo's default scenario key. */
export const DEFAULT_SCENARIO_KEY: ScenarioKey = "payments5xx";
