"use client";

import { Layers, TrendingDown, TrendingUp, Minus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { STATS } from "@/lib/stats";

/**
 * The "4 patterns" referenced in the header, made concrete. Lists every
 * pattern Hindsight recognises, with its service, incident count, average
 * MTTR, and a trend icon (improving / stable / weakening / novel).
 */
export function PatternCatalog() {
  return (
    <Card aria-label="pattern catalog">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-[15px] font-medium m-0">
          Patterns Hindsight recognises
        </h2>
        <span className="text-xs text-muted-foreground">
          · derived from {STATS.totalIncidents} incidents
        </span>
      </div>
      <div className="grid gap-1.5">
        {STATS.patterns.map((p) => (
          <PatternRow key={p.name} pattern={p} />
        ))}
      </div>
    </Card>
  );
}

function PatternRow({ pattern: p }: { pattern: (typeof STATS.patterns)[number] }) {
  const { Icon, label } = trendMeta(p.trend, p.trendDeltaPct);
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-2.5 py-2 rounded-md hover:bg-surface-muted">
      <div>
        <div className="text-[13px] font-medium">{p.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {p.service} · {p.incidentIds.length} incident{p.incidentIds.length === 1 ? "" : "s"}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13px] font-mono">{p.avgMttr}m</div>
        <div className="text-[11px] text-muted-foreground">avg MTTR</div>
      </div>
      <Badge
        variant={
          p.trend === "improving"
            ? "success"
            : p.trend === "weakening"
              ? "warning"
              : "neutral"
        }
      >
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
      <div className="text-right text-[11px] text-muted-foreground">
        {p.incidentIds.slice(0, 3).join(" · ")}
        {p.incidentIds.length > 3 && "…"}
      </div>
    </div>
  );
}

function trendMeta(trend: string, delta: number) {
  switch (trend) {
    case "improving":
      return { Icon: TrendingDown, label: `−${Math.abs(delta)}%` };
    case "weakening":
      return { Icon: TrendingUp, label: `+${delta}%` };
    case "stable":
      return { Icon: Minus, label: "stable" };
    default:
      return { Icon: Sparkles, label: "novel" };
  }
}
