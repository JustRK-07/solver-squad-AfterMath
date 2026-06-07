"use client";

import { Download, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Signal, SignalLevel } from "@/types/incident";

export interface SignalsPanelProps {
  signals: Signal[];
  onDownload: () => void;
}

export function SignalsPanel({ signals, onDownload }: SignalsPanelProps) {
  let errors = 0;
  let warnings = 0;
  for (const s of signals) {
    if (s.level === "error" || s.level === "crit") errors++;
    if (s.level === "warn") warnings++;
  }
  return (
    <Card aria-label="signals">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-[15px] font-medium m-0">
          Signals <span className="text-xs text-muted-foreground">— last 90s of telemetry</span>
        </h2>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          <Badge variant="danger">
            {errors} error{errors === 1 ? "" : "s"}
          </Badge>
          <Badge variant="warning">
            {warnings} warning{warnings === 1 ? "" : "s"}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" />
          Download (JSON)
        </Button>
      </div>
      <div className="font-mono text-[12px] grid gap-0">
        {signals.map((s, i) => (
          <SignalRow key={`${s.ts}-${i}`} signal={s} />
        ))}
      </div>
    </Card>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[70px_50px_1fr] gap-2.5 items-baseline px-1.5 py-1 rounded",
        signal.hl && "bg-info/[0.06] border-l-2 border-info pl-1",
      )}
    >
      <span className="text-muted-foreground">{signal.ts}</span>
      <span className={cn("font-medium", levelClass(signal.level))}>
        {signal.level.toUpperCase()}
      </span>
      <span>{signal.msg}</span>
    </div>
  );
}

function levelClass(level: SignalLevel): string {
  switch (level) {
    case "error":
      return "text-danger-fg";
    case "warn":
      return "text-warning-fg";
    case "info":
      return "text-muted-foreground";
    case "crit":
      return "text-danger-fg font-semibold";
  }
}
