// ── Diagnosis service — wraps the /api/diagnose route with mock fallback ─
// Mirrors the try/catch + 450ms delay from standalone.html onSubmit (lines 925-939).

import { SCENARIOS } from "@/lib/mockData";
import type { DiagnoseInput, Scenario, ScenarioKey } from "@/types/incident";
import { sleep } from "@/lib/utils";

/** Try the real backend, fall back to mock data on any failure. */
export async function runDiagnosis(input: DiagnoseInput): Promise<Scenario> {
  try {
    const res = await fetch("/api/diagnose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input }),
    });
    if (res.ok) {
      const scenario = (await res.json()) as Scenario;
      return scenario;
    }
  } catch {
    /* network error — fall through to mock */
  }
  // Mock fallback: 450ms artificial delay (mirrors prototype behaviour)
  await sleep(450);
  return SCENARIOS[pickScenario(input.symptom, input.useMemory)];
}

/** Pick a scenario key from a free-text symptom (regex-based, mirrors lines 911-921). */
export function pickScenario(symptom: string, useMemory: boolean): ScenarioKey {
  if (!useMemory) return "baseline";
  // Direct preset match
  const preset = directPreset(symptom);
  if (preset) return preset;
  // Heuristic fallbacks
  if (/5xx|deploy|pool/.test(symptom)) return "payments5xx";
  if (/429|surge|retry/.test(symptom))  return "auth429";
  if (/OOM|memory|leak/.test(symptom))  return "oom";
  if (/TLS|cert|SSL/.test(symptom))     return "tls";
  if (/stale|replica/.test(symptom))    return "stale";
  return "payments5xx"; // demo default
}

import { QUICK_PRESETS } from "@/lib/mockData";
function directPreset(symptom: string): ScenarioKey | null {
  return QUICK_PRESETS[symptom] ?? null;
}
