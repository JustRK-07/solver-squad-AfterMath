"use client";

import { Database, Layers, CheckCircle2, Gauge } from "lucide-react";

import { Card } from "@/components/ui/card";
import { STATS } from "@/lib/stats";

/**
 * The hero strip that opens the page once a diagnosis lands.
 * 4 stats that together tell the whole memory-value story in 3 seconds:
 *   - 12 incidents in memory
 *   - 4 patterns recognised
 *   - 73% historical accuracy
 *   - 3.2× faster MTTR
 */
export function MemoryPulse() {
  const s = STATS;
  return (
    <Card aria-label="memory pulse" className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Stat
        icon={<Database className="h-3.5 w-3.5" />}
        label="Incidents in memory"
        value={String(s.totalIncidents)}
        sub={`${s.resolvedIncidents} resolved · ${s.openIncidents} open`}
      />
      <Stat
        icon={<Layers className="h-3.5 w-3.5" />}
        label="Patterns recognised"
        value={String(s.patterns.length)}
        sub={`${s.patterns.filter((p) => p.trend === "improving").length} improving`}
      />
      <Stat
        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
        label="Historical accuracy"
        value={`${Math.round(s.successRate * 100)}%`}
        sub={`${s.successCount} success · ${s.failureCount} failure`}
      />
      <Stat
        icon={<Gauge className="h-3.5 w-3.5" />}
        label="MTTR speedup"
        value={`${s.speedupVsBaseline}×`}
        sub={`${s.avgMttrMins}m avg vs ${240}m baseline`}
        accent
      />
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="grid gap-0.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-[28px] font-medium leading-none ${accent ? "text-info" : ""}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
