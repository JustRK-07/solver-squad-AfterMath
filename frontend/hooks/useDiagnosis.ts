"use client";

import { useCallback, useState } from "react";

import { runDiagnosis, pickScenario } from "@/services/diagnosis.service";
import type { DiagnoseInput, DiagnosisStatus, Scenario } from "@/types/incident";

const DEFAULTS: DiagnoseInput = {
  service: "payments-api-prod",
  symptom: "5xx spike after deploy 7f3ac1; p99 latency 6.2s; DB connections pinned at 100/100",
  useMemory: true,
};

export interface UseDiagnosisReturn {
  // form
  service: string;
  symptom: string;
  useMemory: boolean;
  setService: (s: string) => void;
  setSymptom: (s: string) => void;
  setUseMemory: (v: boolean) => void;
  setAll: (input: Partial<DiagnoseInput>) => void;

  // pipeline state
  status: DiagnosisStatus;
  scenario: Scenario | null;
  scenarioKey: Scenario["key"] | null;
  flowStart: number;
  error: string | null;

  // actions
  diagnose: (override?: Partial<DiagnoseInput>) => Promise<Scenario | null>;
  reset: () => void;
}

/**
 * Single source of truth for the diagnosis pipeline.
 * Owns form state, the async run, the picked scenario, and the result.
 */
export function useDiagnosis(): UseDiagnosisReturn {
  const [service, setService] = useState<string>(DEFAULTS.service);
  const [symptom, setSymptom] = useState<string>(DEFAULTS.symptom);
  const [useMemory, setUseMemory] = useState<boolean>(DEFAULTS.useMemory);

  const [status, setStatus] = useState<DiagnosisStatus>("idle");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioKey, setScenarioKey] = useState<Scenario["key"] | null>(null);
  const [flowStart, setFlowStart] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const setAll = useCallback((patch: Partial<DiagnoseInput>) => {
    if (patch.service !== undefined) setService(patch.service);
    if (patch.symptom !== undefined) setSymptom(patch.symptom);
    if (patch.useMemory !== undefined) setUseMemory(patch.useMemory);
  }, []);

  const diagnose = useCallback(
    async (override?: Partial<DiagnoseInput>): Promise<Scenario | null> => {
      const input: DiagnoseInput = {
        service: (override?.service ?? service).trim() || "Unknown service",
        symptom: (override?.symptom ?? symptom).trim(),
        useMemory: override?.useMemory ?? useMemory,
      };
      if (!input.symptom) return null;

      setStatus("running");
      setError(null);
      setFlowStart(Date.now());
      setScenarioKey(pickScenario(input.symptom, input.useMemory));

      try {
        const result = await runDiagnosis(input);
        setScenario(result);
        setStatus("done");
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : "unknown error");
        setStatus("idle");
        return null;
      }
    },
    [service, symptom, useMemory],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setScenario(null);
    setScenarioKey(null);
    setFlowStart(0);
    setError(null);
  }, []);

  return {
    service,
    symptom,
    useMemory,
    setService,
    setSymptom,
    setUseMemory,
    setAll,
    status,
    scenario,
    scenarioKey,
    flowStart,
    error,
    diagnose,
    reset,
  };
}
