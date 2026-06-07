"use client";

import { Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Deploy } from "@/types/incident";

export interface DeploysPanelProps {
  deploys: Deploy[];
}

export function DeploysPanel({ deploys }: DeploysPanelProps) {
  return (
    <Card aria-label="recent deploys">
      <div className="flex items-center gap-2 mb-2">
        <Rocket className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-[15px] font-medium m-0">
          Recent deploys <span className="text-xs text-muted-foreground">— last 7 days</span>
        </h2>
      </div>
      <div className="grid gap-1">
        {deploys.map((d) => (
          <DeployRow key={d.sha} deploy={d} />
        ))}
      </div>
    </Card>
  );
}

function DeployRow({ deploy: d }: { deploy: Deploy }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] gap-3 p-2.5 rounded-lg items-start",
        d.linked && "bg-warning-fg/10 border-l-2 border-warning-fg pl-2",
      )}
    >
      <div>
        <div>
          <span className="font-mono font-medium">{d.sha}</span>
          <span className="text-muted-foreground"> · {d.committer} · {d.time} · {d.delta}</span>
        </div>
        <div className="text-[13px] mt-0.5">{d.desc}</div>
      </div>
      {d.linked ? (
        <Badge variant="warning">linked to diagnosis</Badge>
      ) : (
        <Badge variant="muted">unrelated</Badge>
      )}
    </div>
  );
}
