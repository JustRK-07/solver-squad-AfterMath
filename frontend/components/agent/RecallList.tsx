"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatTs } from "@/lib/utils";
import type { RecallHit } from "@/types/incident";

export interface RecallListProps {
  hits: RecallHit[];
  ts: number;
  /** When a recall row is clicked — used to jump to memory bank. */
  onSelect?: (id: string) => void;
}

export function RecallList({ hits, ts, onSelect }: RecallListProps) {
  const [query, setQuery] = useState("");

  if (!hits.length) {
    return <div className="text-xs text-muted-foreground mt-2">no recall hits</div>;
  }

  const filtered = query
    ? hits.filter(
        (h) =>
          h.id.toLowerCase().includes(query.toLowerCase()) ||
          h.title.toLowerCase().includes(query.toLowerCase()),
      )
    : hits;

  return (
    <div className="mt-2 pt-2 border-t border-border">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="Search this pattern in memory…"
        className="h-7 text-[13px]"
      />
      <div className="mt-1">
        {filtered.map((h) => (
          <RecallRow key={h.id} hit={h} ts={ts} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function RecallRow({
  hit,
  ts,
  onSelect,
}: {
  hit: RecallHit;
  ts: number;
  onSelect?: (id: string) => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(hit.id);
      }}
      className="grid grid-cols-[60px_1fr_auto] gap-3 items-baseline py-1.5 px-1.5 cursor-pointer rounded hover:bg-black/[0.02]"
    >
      <span className="font-medium">{hit.sim}%</span>
      <span className="flex gap-1.5 items-baseline">
        <span className="font-medium">{hit.id}</span>
        <span className="text-text">· {hit.title}</span>
        {hit.freshness === "weakening" && <Badge variant="warning">weakening</Badge>}
      </span>
      <span className="text-xs text-muted-foreground text-right">
        {hit.status}
        {hit.mttr ? ` · ${hit.mttr}` : ""}
        <span className="block text-[11px]">{formatTs(ts)}</span>
      </span>
    </div>
  );
}
