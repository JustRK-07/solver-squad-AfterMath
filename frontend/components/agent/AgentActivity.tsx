"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import type { Flow, RecallHit } from "@/types/incident";

import { FlowCard } from "./FlowCard";

export interface AgentActivityProps {
  flows: Flow[];
  onSelectRecall?: (id: string) => void;
}

/**
 * Renders the running/finished agent flow stack.
 * When `flows` is empty (idle), shows nothing.
 * While `flows` is being built (status === "running"), shows
 * the "Retain / Recall / Reflect …" placeholder cards (the prototype's
 * `showFlowsRunning` helper).
 */
export function AgentActivity({ flows, onSelectRecall }: AgentActivityProps) {
  if (!flows.length) {
    return <RunningPlaceholder />;
  }
  return (
    <div className="grid gap-2">
      {flows.map((f, i) => {
        // recall flow carries hits inside body — narrow the type for FlowCard
        const hits =
          f.kind === "recall" && f.body && typeof f.body === "object" && "hits" in f.body
            ? (f.body as { hits: RecallHit[] }).hits
            : undefined;
        return (
          <FlowCard
            key={`${f.kind}-${i}`}
            flow={f}
            {...(hits ? { recallHits: hits } : {})}
            onSelectRecall={onSelectRecall}
          />
        );
      })}
    </div>
  );
}

function RunningPlaceholder() {
  const beats: Array<["Retain" | "Recall" | "Reflect", string]> = [
    ["Retain", "— ingested live signals"],
    ["Recall", "— searched incident memory"],
    ["Reflect", "— root-cause hypothesis"],
  ];
  return (
    <div className="grid gap-2">
      {beats.map(([name, desc]) => (
        <Card key={name} className="p-0">
          <div className="flex items-center gap-2 px-3.5 py-3">
            <span aria-hidden="true" className="inline-block w-3.5 text-muted-foreground text-center">
              ▢
            </span>
            <span className="font-medium">{name}</span>
            <span className="text-text">{desc}</span>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-muted-foreground text-[13px]">
              <span>…</span>
              <span>▸</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
