"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { cn, formatTs } from "@/lib/utils";
import type { Flow, RecallHit } from "@/types/incident";

import { RecallList } from "./RecallList";

export interface FlowCardProps {
  flow: Flow;
  /** Render the recall list (only for `kind === "recall"`). */
  recallHits?: RecallHit[];
  onSelectRecall?: (id: string) => void;
}

export function FlowCard({ flow, recallHits, onSelectRecall }: FlowCardProps) {
  const [open, setOpen] = useState(flow.expanded);

  const isRecall = flow.kind === "recall";
  const hasPayload = flow.body !== undefined && flow.body !== null;

  return (
    <Card
      className={cn(
        "p-0 overflow-hidden",
        flow.expanded && "bg-surface-accent",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3.5 py-3 cursor-pointer select-none text-left"
      >
        <span aria-hidden="true" className="inline-block w-3.5 text-muted-foreground text-center">
          ▢
        </span>
        <span className="font-medium">{flow.name}</span>
        <span className="text-text">{flow.desc}</span>
        <span className="text-muted-foreground text-xs">· {formatTs(flow.ts)}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-muted-foreground text-[13px]">
          <span>{flow.resultLabel || `${flow.resultCount} results`}</span>
          <span>{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {/* recall body — always shown for recall flow (the prototype renders it open) */}
      {isRecall && open && (
        <div className="px-3.5 pb-3.5">
          <RecallList
            hits={recallHits ?? []}
            ts={flow.ts}
            onSelect={onSelectRecall}
          />
        </div>
      )}

      {/* payload pre (for retain/reflect with JSON) */}
      {!isRecall && hasPayload && open && (
        <pre className="mx-3.5 mb-3.5 p-2.5 bg-bg border-hairline border-border rounded-md text-[12px] overflow-auto text-muted-foreground font-mono">
          {JSON.stringify(flow.body, null, 2)}
        </pre>
      )}
    </Card>
  );
}
