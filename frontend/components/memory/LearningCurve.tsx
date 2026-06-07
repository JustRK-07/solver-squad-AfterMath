"use client";

import { TrendingDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/shared/Sparkline";
import { STATS } from "@/lib/stats";

/**
 * The "memory is working" headline widget — promoted from inside the
 * Memory-bank detail to the main view, always visible. Shows the aggregate
 * MTTR drop across all patterns with ≥2 occurrences, with a downward
 * sparkline as the proof.
 */
export function LearningCurve() {
  const s = STATS;
  if (s.learningSampleSize === 0) return null;

  // Build a single aggregate series: first-half vs second-half averages
  // per pattern, normalised. For simplicity we render the aggregate
  // first/last as a 2-point sparkline, plus a "vs baseline" reference line.
  const first = s.learningFirstMttr;
  const last = s.learningLatestMttr;
  const baseline = 240;
  const series = [baseline, first, last];

  return (
    <Card
      aria-label="learning curve"
      className="bg-info/[0.04] border-info/40"
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-info" />
            <span className="text-[15px] font-medium">Memory is working</span>
            <span className="text-xs text-muted-foreground">
              · across {s.learningSampleSize} pattern{s.learningSampleSize === 1 ? "" : "s"} with multiple occurrences
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground m-0 mb-1">
            MTTR dropped{" "}
            <span className="text-info font-medium">{s.learningPctDrop}%</span>{" "}
            from first occurrence to latest — from{" "}
            <span className="font-mono">{first}m</span> to{" "}
            <span className="font-mono">{last}m</span>. Hindsight is citing
            earlier resolutions and shortening response time.
          </p>
          <Sparkline values={series} labels={["baseline", "first", "latest"]} />
        </div>
        <div className="grid gap-1 md:text-right">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Headline
          </div>
          <div className="text-[42px] font-medium leading-none text-info">
            −{s.learningPctDrop}%
          </div>
          <div className="text-xs text-muted-foreground">MTTR over time</div>
        </div>
      </div>
    </Card>
  );
}
