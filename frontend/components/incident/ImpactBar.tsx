import { Card } from "@/components/ui/card";
import { INR_PER_MIN, MTTR_BASELINE_MINS } from "@/lib/mockData";
import { computeSaved, formatINR } from "@/lib/utils";

export interface ImpactBarProps {
  mttrMins: number | null;
}

export function ImpactBar({ mttrMins }: ImpactBarProps) {
  const mttr = mttrMins ?? 0;
  const saved = computeSaved(MTTR_BASELINE_MINS, mttr, INR_PER_MIN);
  return (
    <Card className="flex items-center justify-around py-3 px-4">
      <Item label="MTTR" value={mttrMins === null ? "—" : `~${mttr}m`} />
      <Item label="vs baseline" value={`${MTTR_BASELINE_MINS}m`} />
      <Item label="Downtime saved" value={`₹${formatINR(saved)}`} />
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-[22px] font-medium leading-none mt-0.5">{value}</div>
    </div>
  );
}
