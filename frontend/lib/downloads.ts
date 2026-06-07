// ── JSON download helpers (replaces downloadSignals / downloadPlay) ──

import { SIGNALS } from "@/lib/mockData";
import type { Scenario, ScenarioKey } from "@/types/incident";

/** Trigger a browser download of an arbitrary JSON-serialisable object. */
export function downloadJSON(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSignals(scenarioKey: ScenarioKey | null) {
  const key = scenarioKey ?? "baseline";
  const signals = SIGNALS[key] ?? SIGNALS.baseline;
  downloadJSON(`signals-${key}-${Date.now()}.json`, {
    generated_at: new Date().toISOString(),
    scenario: key,
    signals,
  });
}

export function downloadPlay(scenario: Scenario) {
  downloadJSON(`play-${scenario.key}-${Date.now()}.json`, {
    version: "1.0",
    generated_at: new Date().toISOString(),
    scenario: scenario.key,
    root_cause: scenario.rootCause,
    recommended_fix: scenario.recommendedFix,
    steps: scenario.steps,
    citations: scenario.citations,
    confidence: scenario.confidence,
    confidence_band: scenario.confidenceBand,
    avoid: scenario.avoid,
    freshness_warning: scenario.freshnessWarning,
    retrieved: scenario.retrieved,
  });
}
