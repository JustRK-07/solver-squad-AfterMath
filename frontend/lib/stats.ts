// ── Aggregate stats derived from mockData — the "memory health" numbers ──
// Computed once at module load (data is static).

import { BANK_INCIDENTS, MTTR_BASELINE_MINS } from "@/lib/mockData";
import type { BankIncident } from "@/types/incident";

export interface Pattern {
  name: string;
  service: string;
  incidentIds: string[];
  avgMttr: number;             // minutes, or 0 if none have mttr
  trend: "improving" | "stable" | "weakening" | "novel";
  trendDeltaPct: number;       // negative = improving (MTTR went down)
}

export interface ServiceHealth {
  service: string;
  incidentCount: number;
  openCount: number;
  resolvedCount: number;
  failureCount: number;
  fresh: "fresh" | "warm" | "cold";
}

export interface MemoryStats {
  totalIncidents: number;
  resolvedIncidents: number;
  openIncidents: number;
  successCount: number;
  failureCount: number;
  successRate: number;         // 0..1
  patterns: Pattern[];
  services: ServiceHealth[];
  /** MTTR across all closed incidents with mttr. */
  avgMttrMins: number;
  /** Overall speedup vs the no-memory baseline (e.g. 3.2 means 3.2× faster). */
  speedupVsBaseline: number;
  /** Headline number: across patterns with ≥2 occurrences, MTTR drop from first → last. */
  learningPctDrop: number;     // 0..100
  learningFirstMttr: number;
  learningLatestMttr: number;
  learningSampleSize: number;  // how many patterns contributed
}

// ── helpers ──────────────────────────────────────────────────────────
const closed = (b: BankIncident) => b.mttr !== null;

function mttrTrend(incidentIds: string[]): Pattern["trend"] {
  const mttrs = BANK_INCIDENTS
    .filter((b) => incidentIds.includes(b.id))
    .filter(closed)
    .map((b) => b.mttr as number);
  if (mttrs.length < 2) return "novel";
  const first = mttrs[0];
  const last = mttrs[mttrs.length - 1];
  const delta = ((last - first) / first) * 100;
  if (delta < -15) return "improving";
  if (delta > 15) return "weakening";
  return "stable";
}

function trendDelta(incidentIds: string[]): number {
  const mttrs = BANK_INCIDENTS
    .filter((b) => incidentIds.includes(b.id))
    .filter(closed)
    .map((b) => b.mttr as number);
  if (mttrs.length < 2) return 0;
  const first = mttrs[0];
  const last = mttrs[mttrs.length - 1];
  return ((last - first) / first) * 100;
}

const PATTERNS: Pattern[] = [
  {
    name: "5xx after deploy",
    service: "payments-api-prod",
    incidentIds: ["INC-204", "INC-187", "INC-119", "INC-093"],
    avgMttr: Math.round(
      BANK_INCIDENTS.filter((b) => ["INC-204", "INC-187", "INC-119", "INC-093"].includes(b.id))
        .reduce((a, b) => a + (b.mttr ?? 0), 0) / 4,
    ),
    trend: "improving",
    trendDeltaPct: -70,        // 125 → 38
  },
  {
    name: "Login 429 cascade",
    service: "auth-service",
    incidentIds: ["INC-005", "INC-009", "INC-010"],
    avgMttr: Math.round(
      BANK_INCIDENTS.filter((b) => ["INC-005", "INC-009", "INC-010"].includes(b.id))
        .reduce((a, b) => a + (b.mttr ?? 0), 0) / 3,
    ),
    trend: "weakening",
    trendDeltaPct: 50,         // 60 → 90
  },
  {
    name: "OOMKilled worker",
    service: "rec-worker",
    incidentIds: ["INC-003", "INC-004"],
    avgMttr: Math.round(
      BANK_INCIDENTS.filter((b) => ["INC-003", "INC-004"].includes(b.id))
        .reduce((a, b) => a + (b.mttr ?? 0), 0) / 2,
    ),
    trend: "novel",
    trendDeltaPct: 0,
  },
  {
    name: "Stale read · TLS expiry",
    service: "orders-api · api-gateway",
    incidentIds: ["INC-011", "INC-002"],
    avgMttr: 45,
    trend: "stable",
    trendDeltaPct: 0,
  },
];

// recompute trends from real data (overrides the hard-coded trendDeltaPct)
for (const p of PATTERNS) {
  p.trend = mttrTrend(p.incidentIds);
  p.trendDeltaPct = Math.round(trendDelta(p.incidentIds));
}

function buildServiceHealth(): ServiceHealth[] {
  const map = new Map<string, ServiceHealth>();
  for (const b of BANK_INCIDENTS) {
    let h = map.get(b.svc);
    if (!h) {
      h = {
        service: b.svc,
        incidentCount: 0,
        openCount: 0,
        resolvedCount: 0,
        failureCount: 0,
        fresh: "cold",
      };
      map.set(b.svc, h);
    }
    h.incidentCount += 1;
    if (b.outcome === "open") h.openCount += 1;
    if (b.outcome === "success") h.resolvedCount += 1;
    if (b.outcome === "failure") h.resolvedCount += 1, h.failureCount += 1;
  }
  // freshness: most recent incident date
  for (const h of map.values()) {
    const dates = BANK_INCIDENTS
      .filter((b) => b.svc === h.service)
      .map((b) => new Date(b.date).getTime());
    const lastDate = Math.max(...dates);
    const days = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
    h.fresh = days < 14 ? "fresh" : days < 45 ? "warm" : "cold";
  }
  return Array.from(map.values()).sort((a, b) => b.incidentCount - a.incidentCount);
}

function buildStats(): MemoryStats {
  const total = BANK_INCIDENTS.length;
  const open = BANK_INCIDENTS.filter((b) => b.outcome === "open").length;
  const success = BANK_INCIDENTS.filter((b) => b.outcome === "success").length;
  const failure = BANK_INCIDENTS.filter((b) => b.outcome === "failure").length;
  const resolved = success + failure;
  const mttrValues = BANK_INCIDENTS
    .filter(closed)
    .map((b) => b.mttr as number);
  const avgMttr =
    mttrValues.reduce((a, n) => a + n, 0) / Math.max(1, mttrValues.length);
  const speedup = MTTR_BASELINE_MINS / Math.max(1, avgMttr);

  // headline learning: across patterns with ≥2 closed incidents, MTTR first → last
  const learningSamples: { first: number; last: number }[] = [];
  for (const p of PATTERNS) {
    const mttrs = BANK_INCIDENTS
      .filter((b) => p.incidentIds.includes(b.id))
      .filter(closed)
      .map((b) => b.mttr as number);
    if (mttrs.length >= 2) {
      learningSamples.push({ first: mttrs[0], last: mttrs[mttrs.length - 1] });
    }
  }
  const totalFirst = learningSamples.reduce((a, s) => a + s.first, 0);
  const totalLast = learningSamples.reduce((a, s) => a + s.last, 0);
  const learningPctDrop =
    totalFirst === 0
      ? 0
      : Math.round(((totalFirst - totalLast) / totalFirst) * 100);

  return {
    totalIncidents: total,
    resolvedIncidents: resolved,
    openIncidents: open,
    successCount: success,
    failureCount: failure,
    successRate: resolved === 0 ? 0 : success / resolved,
    patterns: PATTERNS,
    services: buildServiceHealth(),
    avgMttrMins: Math.round(avgMttr),
    speedupVsBaseline: Math.round(speedup * 10) / 10,
    learningPctDrop: Math.max(0, learningPctDrop),
    learningFirstMttr: Math.round(totalFirst / Math.max(1, learningSamples.length)),
    learningLatestMttr: Math.round(totalLast / Math.max(1, learningSamples.length)),
    learningSampleSize: learningSamples.length,
  };
}

export const STATS: MemoryStats = buildStats();
