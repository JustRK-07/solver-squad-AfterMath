"use client";

import { Check, X, Brain } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MTTR_BASELINE_MINS } from "@/lib/mockData";
import type { Scenario } from "@/types/incident";

export interface WithVsWithoutMemoryProps {
  scenario: Scenario | null;
  useMemory: boolean;
  /** Current baseline (for "without memory" the diagnosis is the generic baseline scenario). */
  baselineMttr: number;
}

/**
 * Side-by-side compare: what the agent says with Hindsight memory, vs. the
 * raw-LLM baseline it would say without. Makes the memory delta obvious
 * without forcing the user to flip the toggle.
 */
export function WithVsWithoutMemory({
  scenario,
  useMemory,
  baselineMttr,
}: WithVsWithoutMemoryProps) {
  // with-memory numbers
  const withHits = scenario?.retrieved.length ?? 0;
  const withSim = scenario?.retrieved[0]?.sim ?? 0;
  const withMttr = scenario?.mttr ?? 0;
  const withConf = scenario?.confidence ?? 0;
  const withCitations = scenario?.citations.length ?? 0;

  // without-memory numbers (generic)
  const noMttr = MTTR_BASELINE_MINS;
  const noConf = 35;

  return (
    <Card aria-label="memory delta" className="grid md:grid-cols-2 gap-4">
      {/* WITH memory */}
      <div
        className={`rounded-lg border-hairline border-border p-3 ${
          useMemory ? "bg-info/[0.04] border-info" : "opacity-60"
        }`}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Brain className="h-3.5 w-3.5 text-info" />
          <span className="text-[15px] font-medium">With Hindsight memory</span>
          {useMemory && <Badge variant="default">active</Badge>}
        </div>
        <CompareRow
          ok
          label="Past incidents cited"
          value={withHits === 0 ? "—" : `${withHits} found`}
          suffix={withSim > 0 ? ` · ${withSim}% top match` : ""}
        />
        <CompareRow
          ok
          label="Citations on recommendation"
          value={withCitations === 0 ? "—" : `${withCitations} sources`}
        />
        <CompareRow
          ok
          label="Estimated MTTR"
          value={withMttr === 0 ? "—" : `~${withMttr}m`}
          suffix={
            withMttr > 0
              ? ` (from ${withHits} prior case${withHits === 1 ? "" : "s"})`
              : ""
          }
        />
        <CompareRow
          ok
          label="Confidence"
          value={`${withConf}%`}
          suffix={withConf >= 70 ? " · high" : withConf >= 40 ? " · medium" : " · low"}
        />
      </div>

      {/* WITHOUT memory */}
      <div
        className={`rounded-lg border-hairline border-border p-3 ${
          !useMemory ? "bg-warning-bg/30 border-warning-fg" : "opacity-60"
        }`}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[15px] font-medium">Without memory (raw LLM)</span>
          {!useMemory && <Badge variant="warning">active</Badge>}
        </div>
        <CompareRow
          ok={false}
          label="Past incidents cited"
          value="0"
          suffix=" · no recall"
        />
        <CompareRow
          ok={false}
          label="Citations on recommendation"
          value="0"
          suffix=" · no sources"
        />
        <CompareRow
          ok={false}
          label="Estimated MTTR"
          value={`~${baselineMttr}m`}
          suffix=" · generic baseline"
        />
        <CompareRow
          ok={false}
          label="Confidence"
          value={`${noConf}%`}
          suffix=" · low (no precedent)"
        />
      </div>
    </Card>
  );
}

function CompareRow({
  ok,
  label,
  value,
  suffix,
}: {
  ok: boolean;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="grid grid-cols-[14px_1fr_auto] gap-2 items-baseline py-1">
      {ok ? (
        <Check className="h-3.5 w-3.5 text-success-fg" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium">
        {value}
        {suffix && (
          <span className="text-muted-foreground font-normal">{suffix}</span>
        )}
      </span>
    </div>
  );
}
