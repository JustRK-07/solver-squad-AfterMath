"use client";

import { useEffect, useRef, useState } from "react";

import { DEFAULT_AUTO_RUN } from "@/lib/mockData";
import { sleep } from "@/lib/utils";
import type { UseDiagnosisReturn } from "@/hooks/useDiagnosis";

/** A single scripted beat inside playDemo(). */
export interface DemoBeat {
  label: string;
  /** Returns once the beat is fully on-screen. */
  run: () => Promise<void>;
}

/** One-shot wrapper around quickAction() so playDemo() can await it. */
async function quickActionAsync(
  diag: UseDiagnosisReturn,
  symptom: string,
  service: string,
  useMemory = true,
): Promise<void> {
  diag.setAll({ service, symptom, useMemory });
  await diag.diagnose({ service, symptom, useMemory });
  await sleep(500);
}

/**
 * Owns:
 *  - the auto-run on page load (cold open: payments 5xx)
 *  - the 5-beat "Play demo" scripted walkthrough
 *  - the re-entrancy guard so clicking Play twice doesn't overlap
 */
export function useDemo(diag: UseDiagnosisReturn) {
  const [demoInProgress, setDemoInProgress] = useState(false);
  const [demoLabel, setDemoLabel] = useState<string>("▶ Play demo");
  const autoRanRef = useRef(false);

  // Auto-run the default scenario on mount (mirrors the DOMContentLoaded
  // listener in standalone.html, line 1281).
  useEffect(() => {
    if (autoRanRef.current) return;
    autoRanRef.current = true;
    const t = setTimeout(() => {
      void diag.diagnose({
        service: DEFAULT_AUTO_RUN.service,
        symptom: DEFAULT_AUTO_RUN.symptom,
        useMemory: true,
      });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playDemo = async () => {
    if (demoInProgress) return;
    setDemoInProgress(true);
    const beats: DemoBeat[] = [
      {
        label: "Beat 1/5 · cold open (memory OFF)",
        run: () =>
          quickActionAsync(
            diag,
            DEFAULT_AUTO_RUN.symptom,
            DEFAULT_AUTO_RUN.service,
            false,
          ),
      },
      {
        label: "Beat 2/5 · flip memory ON",
        run: () =>
          quickActionAsync(
            diag,
            DEFAULT_AUTO_RUN.symptom,
            DEFAULT_AUTO_RUN.service,
            true,
          ),
      },
      {
        label: "Beat 3/5 · failure memory (OOM)",
        run: () =>
          quickActionAsync(
            diag,
            "Worker pods OOMKilled in a loop; job queue backing up",
            "Recommendation Worker",
            true,
          ),
      },
      {
        label: "Beat 4/5 · weakening trend (Auth 429)",
        run: () =>
          quickActionAsync(
            diag,
            "Login 429 cascade during a traffic surge; clients see ERR_TOO_MANY_REQUESTS",
            "Auth Service",
            true,
          ),
      },
      {
        label: "Beat 5/5 · record outcome & live learning",
        run: async () => {
          await quickActionAsync(
            diag,
            DEFAULT_AUTO_RUN.symptom,
            DEFAULT_AUTO_RUN.service,
            true,
          );
          await sleep(800);
          await sleep(1500);
        },
      },
    ];

    for (const beat of beats) {
      setDemoLabel(beat.label);
      await beat.run();
      await sleep(2500); // beat pause
    }
    setDemoLabel("✓ Demo complete");
    await sleep(1500);
    setDemoLabel("▶ Play demo");
    setDemoInProgress(false);
  };

  return { playDemo, demoInProgress, demoLabel };
}
