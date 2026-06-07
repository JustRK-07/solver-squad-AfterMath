"use client";

import { Download, Eye, BellRing, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface IncidentHeaderProps {
  service: string;
  incidentId: string;
  openedAt: string;            // "06:42 UTC"
  severity: "P0" | "P1" | "P2" | "P3";
  status: "Degraded" | "Resolved" | "Investigating";
  relatedDeploy: string | null;
  owner: string;
  /** show the degraded/severity pills only after a diagnosis has been run. */
  visible: boolean;
  onViewDetails?: () => void;
  onNotify?: () => void;
  onRecollect?: () => void;
}

export function IncidentHeader({
  service,
  incidentId,
  openedAt,
  severity,
  status,
  relatedDeploy,
  owner,
  visible,
  onViewDetails,
  onNotify,
  onRecollect,
}: IncidentHeaderProps) {
  return (
    <Card aria-label="incident header">
      {/* title row */}
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="inline-block w-3.5 text-muted-foreground text-center">
          ▢
        </span>
        <div className="flex-1">
          <div className="text-[22px] font-medium leading-tight">{service}</div>
          <div className="text-[13px] text-muted-foreground mt-0.5">
            {incidentId} · opened {openedAt}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {visible && (
            <Badge variant="danger">
              <span aria-hidden="true">⚠</span> {status}
            </Badge>
          )}
          {visible && <Badge variant="neutral">{severity}</Badge>}
        </div>
      </div>

      {/* metadata grid */}
      <div className="mt-3 pt-3 border-t border-dashed border-border grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
        <Cell k="ID" v={incidentId} />
        <Cell k="Service" v={service} />
        <Cell k="Severity" v={visible ? severity : "—"} />
        <Cell k="Status" v={visible ? status : "—"} />
        <Cell k="Opened" v={openedAt} />
        <Cell k="Last seen" v="just now" />
        <Cell k="Related deploy" v={relatedDeploy ?? "—"} />
        <Cell k="Owner" v={owner} />
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 flex-wrap mt-3">
        <Button variant="ghost" size="sm" onClick={onViewDetails}>
          <Eye className="h-3.5 w-3.5" />
          View details
        </Button>
        <Button variant="ghost" size="sm" onClick={onNotify}>
          <BellRing className="h-3.5 w-3.5" />
          Notify on-call
        </Button>
        <Button variant="ghost" size="sm" onClick={onRecollect}>
          <RefreshCcw className="h-3.5 w-3.5" />
          Recollect metadata
        </Button>
      </div>
    </Card>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{k}</div>
      <div className="text-[13px] font-medium">{v}</div>
    </div>
  );
}
