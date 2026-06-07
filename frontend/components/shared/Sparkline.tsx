"use client";

export interface SparklineProps {
  values: number[];
  labels?: string[];
  width?: number;
  height?: number;
}

/**
 * Minimal inline-SVG sparkline — no chart library, mirrors the one drawn
 * in standalone.html `drawSparkline()` (lines 1106-1127).
 */
export function Sparkline({ values, labels, width = 300, height = 40 }: SparklineProps) {
  if (!values.length) {
    return <div className="text-[11px] text-muted-foreground mt-0.5">no prior occurrences</div>;
  }

  const P = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - P * 2) / Math.max(1, values.length - 1);

  const points = values.map((v, i) => {
    const x = P + i * stepX;
    const y = height - P - ((v - min) / range) * (height - P * 2);
    return [x, y] as const;
  });
  const pathD = "M " + points.map(([x, y]) => `${x},${y}`).join(" L ");

  return (
    <div>
      <svg
        className="block my-1.5"
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-label="MTTR trend"
      >
        <line
          x1={P}
          y1={height - P}
          x2={width - P}
          y2={height - P}
          stroke="rgba(0,0,0,0.1)"
          strokeDasharray="2 2"
        />
        <path d={pathD} fill="none" stroke="#0c447c" strokeWidth={1.5} />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill="#0c447c" />
        ))}
      </svg>
      <div className="text-[11px] text-muted-foreground mt-0.5">
        {values.length} occurrence{values.length === 1 ? "" : "s"} · MTTR {min}m–{max}m
        {labels?.length ? ` · ${labels.join(" → ")}` : ""}
      </div>
    </div>
  );
}
