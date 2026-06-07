import { Card } from "@/components/ui/card";

export interface MetricsCardProps {
  similarCount: number;
  topMatchPct: number | null;
  mttrMins: number | null;
}

export function MetricsCard({ similarCount, topMatchPct, mttrMins }: MetricsCardProps) {
  return (
    <Card cream aria-label="metrics">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Similar incidents found" value={similarCount === 0 ? "—" : String(similarCount)} />
        <Tile label="Top match" value={topMatchPct === null ? "—" : `${topMatchPct}%`} />
        <Tile label="Est. fix time" value={mttrMins === null ? "—" : `~${mttrMins}m`} />
      </div>
    </Card>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="text-[32px] font-medium leading-none">{value}</div>
    </div>
  );
}
