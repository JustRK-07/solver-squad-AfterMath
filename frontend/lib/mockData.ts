// ── Mock data — exact port of standalone.html constants ──────────────
// All values preserved verbatim from lines 559–782 of the prototype.

import type {
  BankIncident,
  Deploy,
  IncidentDetail,
  Scenario,
  ScenarioKey,
  Signal,
} from "@/types/incident";

// ── quick action presets (chip symptom → scenario key) ──────────────
export const QUICK_PRESETS: Record<string, ScenarioKey> = {
  "Login 429 cascade during a traffic surge; clients see ERR_TOO_MANY_REQUESTS":
    "auth429",
  "Worker pods OOMKilled in a loop; job queue backing up": "oom",
  "5xx spike after deploy 7f3ac1; p99 latency 6.2s; DB connections pinned at 100/100":
    "payments5xx",
  "HTTPS requests failing with SSL handshake errors across every service":
    "tls",
  "Stale order status right after placing an order; read replica lag at 12s":
    "stale",
};

// ── bank incidents (12 rows) ────────────────────────────────────────
export const BANK_INCIDENTS: BankIncident[] = [
  { id: "INC-231", svc: "payments-api-prod", title: "5xx spike after deploy 7f3ac1",         outcome: "open",    date: "2026-06-07", mttr: null,  freshness: null,       status: "Degraded" },
  { id: "INC-204", svc: "payments-api-prod", title: "5xx spike after deploy",                 outcome: "success", date: "2026-04-12", mttr: 38,    freshness: "stable",    status: "Resolved" },
  { id: "INC-187", svc: "payments-api-prod", title: "DB connection pool exhaustion",         outcome: "success", date: "2026-03-29", mttr: 72,    freshness: "stable",    status: "Resolved" },
  { id: "INC-119", svc: "payments-api-prod", title: "Upstream timeout cascade",               outcome: "success", date: "2026-02-18", mttr: 52,    freshness: "stable",    status: "Resolved" },
  { id: "INC-093", svc: "payments-api-prod", title: "Deploy-timeout race (weakening)",        outcome: "failure", date: "2026-01-30", mttr: 125,   freshness: "weakening", status: "Resolved" },
  { id: "INC-005", svc: "auth-service",     title: "Login 429 cascade — pre-migration",       outcome: "success", date: "2026-04-08", mttr: 60,    freshness: "weakening", status: "Resolved" },
  { id: "INC-009", svc: "auth-service",     title: "Login 429 — legacy shed no-op (FAILURE)", outcome: "failure", date: "2026-05-28", mttr: 130,   freshness: "weakening", status: "Resolved" },
  { id: "INC-010", svc: "auth-service",     title: "Login 429 — 2nd failure post-migration",  outcome: "failure", date: "2026-06-03", mttr: 90,    freshness: "weakening", status: "Resolved" },
  { id: "INC-003", svc: "rec-worker",       title: "OOMKilled — restart only (FAILURE)",      outcome: "failure", date: "2026-04-25", mttr: 60,    freshness: "stable",    status: "Resolved" },
  { id: "INC-004", svc: "rec-worker",       title: "OOMKilled — LRU cache fix (SUCCESS)",     outcome: "success", date: "2026-04-26", mttr: 110,   freshness: "stable",    status: "Resolved" },
  { id: "INC-011", svc: "orders-api",       title: "Stale reads — replica lag 12s",           outcome: "success", date: "2026-05-20", mttr: 50,    freshness: "stable",    status: "Resolved" },
  { id: "INC-002", svc: "api-gateway",      title: "TLS cert expired — handshake errors",     outcome: "success", date: "2026-04-18", mttr: 40,    freshness: "stable",    status: "Resolved" },
];

// ── incident detail (per-id lookups) ────────────────────────────────
export const INCIDENT_DETAIL: Record<string, IncidentDetail> = {
  "INC-204": { rootCause: "connection pool exhausted after a deploy changed pool sizing", resolution: "rolled back the deploy and raised the pool ceiling", mttr: "38m",   fix: "Roll back deploy, raise pool ceiling to 200",            date: "2026-04-12 23:14 UTC", tags: ["payments", "deploy", "pool"] },
  "INC-187": { rootCause: "DB connection pool exhaustion under load",                    resolution: "raised pool, drained and restarted 2 hot pods",      mttr: "1h12m", fix: "Raise pool, drain+restart hot pods",                    date: "2026-03-29 14:02 UTC", tags: ["payments", "pool"] },
  "INC-119": { rootCause: "upstream timeout cascade after a config push",                resolution: "reverted config",                                   mttr: "52m",   fix: "Revert config push",                                   date: "2026-02-18 09:31 UTC", tags: ["payments", "config"] },
  "INC-093": { rootCause: "deploy-timeout race condition (weakening fix)",               resolution: "partial rollback didn't help; required full revert", mttr: "2h05m", fix: "Full revert (not partial)",                            date: "2026-01-30 18:44 UTC", tags: ["payments", "deploy", "weakening"] },
  "INC-005": { rootCause: "login surge with no shedding; cold token cache; retry storm", resolution: "enabled load shedding, warmed cache, backoff",      mttr: "60m",   fix: "Shed + warm cache + jittered backoff",                 date: "2026-04-08 11:22 UTC", tags: ["auth", "rate-limit", "weakening"] },
  "INC-009": { rootCause: "post-Envoy migration, legacy shed rule is a no-op",          resolution: "moved shed config to Envoy",                        mttr: "2h10m", fix: "Configure shedding at Envoy",                          date: "2026-05-28 16:08 UTC", tags: ["auth", "rate-limit", "failure", "weakening"] },
  "INC-010": { rootCause: "post-Envoy migration, legacy shed rule still no-op",         resolution: "moved shed config to Envoy",                        mttr: "1h30m", fix: "Configure shedding at Envoy (confirmed)",              date: "2026-06-03 19:51 UTC", tags: ["auth", "rate-limit", "failure", "weakening"] },
  "INC-003": { rootCause: "memory leak in unbounded in-memory embedding cache",         resolution: "restarted pods (only delayed next crash)",          mttr: "60m",   fix: "RESTART (FAILURE — masked leak)",                      date: "2026-04-25 03:14 UTC", tags: ["rec-worker", "memory", "failure"] },
  "INC-004": { rootCause: "memory leak in unbounded in-memory embedding cache",         resolution: "bounded cache with LRU, set memory limits",         mttr: "1h50m", fix: "LRU(10k) + memory limits + fix leak + 80% alert",     date: "2026-04-26 05:02 UTC", tags: ["rec-worker", "memory", "success"] },
  "INC-011": { rootCause: "read-after-write routed to lagging read replica",            resolution: "routed critical reads to primary",                  mttr: "50m",   fix: "Route read-after-write to primary + lag alert",        date: "2026-05-20 14:30 UTC", tags: ["orders", "replication"] },
  "INC-002": { rootCause: "wildcard TLS cert expired; auto-renewal cron had failed",    resolution: "rotated cert, restored auto-renewal cron",         mttr: "40m",   fix: "Rotate cert + restore cron + T-14 alert",              date: "2026-04-18 08:12 UTC", tags: ["gateway", "tls"] },
  "INC-231": { rootCause: "active incident — under investigation",                       resolution: "—",                                                 mttr: null,   fix: "—",                                                     date: "2026-06-07 06:42 UTC", tags: ["payments", "deploy", "open"] },
};

// ── signals (per scenario) ──────────────────────────────────────────
export const SIGNALS: Record<ScenarioKey, Signal[]> = {
  payments5xx: [
    { ts: "06:31:02", level: "info",  msg: "deploy 7f3ac1 promoted to prod (committer @alice)" },
    { ts: "06:42:01", level: "error", msg: "db pool acquire timeout (45s) on payments-api-prod", hl: true },
    { ts: "06:42:03", level: "warn",  msg: "p99 latency 6.2s, baseline 0.4s", hl: true },
    { ts: "06:42:08", level: "error", msg: "503 returned for /charge (request_id=req_8x2k)", hl: true },
    { ts: "06:42:11", level: "warn",  msg: "db connections pinned: 100/100" },
    { ts: "06:42:15", level: "error", msg: "db pool acquire timeout (45s) — 12 in queue", hl: true },
    { ts: "06:42:22", level: "crit",  msg: "payments-api error rate 12.4% (threshold 1%)" },
  ],
  auth429: [
    { ts: "11:13:45", level: "info",  msg: "traffic surge detected: 3.2x normal rate on /token" },
    { ts: "11:14:02", level: "warn",  msg: "login latency p99 4.1s, baseline 0.3s", hl: true },
    { ts: "11:14:08", level: "error", msg: "429 Too Many Requests returned for /token (req_2k9j)", hl: true },
    { ts: "11:14:15", level: "warn",  msg: "retry storm: 3.2x normal rate from clients", hl: true },
    { ts: "11:14:22", level: "error", msg: "429 cascade: 47% of auth requests failing", hl: true },
    { ts: "11:14:30", level: "crit",  msg: "login success rate dropped to 62%" },
    { ts: "11:14:35", level: "error", msg: "legacy gateway shed rule fired 0 times (no-op post-Envoy)", hl: true },
  ],
  oom: [
    { ts: "03:13:42", level: "info",  msg: "rec-worker pod started (memory limit 2Gi)" },
    { ts: "03:14:08", level: "warn",  msg: "rec-worker memory at 78% (1.56Gi / 2Gi)", hl: true },
    { ts: "03:14:22", level: "error", msg: "rec-worker pod OOMKilled (exit 137)", hl: true },
    { ts: "03:14:24", level: "error", msg: "rec-worker restart attempt 1/5" },
    { ts: "03:14:25", level: "warn",  msg: "job queue depth 1247 (growing)", hl: true },
    { ts: "03:14:31", level: "error", msg: "rec-worker OOMKilled again (exit 137)", hl: true },
    { ts: "03:14:35", level: "crit",  msg: "rec-worker in CrashLoopBackOff" },
  ],
  tls: [
    { ts: "08:10:30", level: "info",  msg: "cert-manager last successful renewal: 2026-04-17" },
    { ts: "08:11:14", level: "error", msg: "SSL handshake error: certificate has expired (CN=*.example.com)", hl: true },
    { ts: "08:11:18", level: "crit",  msg: "100% of HTTPS requests failing across all services", hl: true },
    { ts: "08:11:22", level: "error", msg: "ERR_CERT_DATE_INVALID returned to 12,400 clients", hl: true },
    { ts: "08:11:30", level: "warn",  msg: "wildcard cert expired 14 days ago — no T-14 alert fired", hl: true },
  ],
  stale: [
    { ts: "14:29:55", level: "info",  msg: "replica-2 sync lag 0.8s" },
    { ts: "14:30:11", level: "warn",  msg: "replica-2 lag: 12.4s (threshold 2s)", hl: true },
    { ts: "14:30:15", level: "error", msg: "user reports stale order status (order_id=ord_8k2j)", hl: true },
    { ts: "14:30:22", level: "error", msg: "8 stale read complaints in last 60s", hl: true },
    { ts: "14:30:30", level: "crit",  msg: "read-after-write consistency violation", hl: true },
  ],
  baseline: [
    { ts: "06:42:01", level: "error", msg: "503 returned for /charge (request_id=req_8x2k)" },
    { ts: "06:42:08", level: "error", msg: "503 returned for /charge (request_id=req_8x2l)" },
    { ts: "06:42:15", level: "error", msg: "503 returned for /charge (request_id=req_8x2m)" },
    { ts: "06:42:22", level: "crit",  msg: "error rate elevated" },
  ],
};

// ── recent deploys (per scenario) ───────────────────────────────────
export const DEPLOYS: Record<ScenarioKey, Deploy[]> = {
  payments5xx: [
    { sha: "7f3ac1", committer: "@alice", time: "06:31 UTC",              delta: "11 min before incident", desc: "raise pool ceiling to 200, drain 2 hot pods", linked: true  },
    { sha: "7f3a89", committer: "@bob",   time: "2026-06-04 18:22 UTC",   delta: "3 days ago",             desc: "bump stripe-sdk to 14.2.1",                    linked: false },
    { sha: "7f3a12", committer: "@carol", time: "2026-06-02 11:08 UTC",   delta: "5 days ago",             desc: "add structured logging to /charge",            linked: false },
  ],
  auth429: [
    { sha: "7e8b22", committer: "@dave",  time: "2026-05-15 04:00 UTC",   delta: "23 days ago",            desc: "MIGRATE ingress NGINX → Envoy (legacy shed rule became no-op)", linked: true  },
    { sha: "7e8b01", committer: "@alice", time: "2026-05-12 16:42 UTC",   delta: "26 days ago",            desc: "add jittered backoff to auth-client SDK",      linked: false },
    { sha: "7e8a90", committer: "@carol", time: "2026-05-05 09:11 UTC",   delta: "1 month ago",            desc: "warm token cache preflight",                   linked: false },
  ],
  oom: [
    { sha: "8c4f12", committer: "@eve",   time: "2026-04-26 05:00 UTC",   delta: "1 month ago",            desc: "cap embedding cache at 10k entries, add memory alert at 80%", linked: true  },
    { sha: "8c4e88", committer: "@bob",   time: "2026-04-20 14:33 UTC",   delta: "1 month ago",            desc: "refactor rec-worker to use streaming embeddings", linked: false },
  ],
  tls: [
    { sha: "9d1c44", committer: "@alice", time: "2026-04-18 08:30 UTC",   delta: "1 month ago",            desc: "rotate wildcard cert, restore cert-manager auto-renewal", linked: true  },
    { sha: "9d1c20", committer: "@dave",  time: "2026-03-30 12:15 UTC",   delta: "2 months ago",           desc: "switch to cert-manager v1.12",                 linked: false },
  ],
  stale: [
    { sha: "ae2233", committer: "@frank", time: "2026-05-20 14:00 UTC",   delta: "18 days ago",            desc: "route read-after-write to primary, add replica-lag alert", linked: true  },
    { sha: "ae2200", committer: "@alice", time: "2026-05-15 10:11 UTC",   delta: "23 days ago",            desc: "enable replica-lag metrics export",            linked: false },
  ],
  baseline: [
    { sha: "—", committer: "—", time: "—", delta: "—", desc: "no recent deploy data (memory OFF)", linked: false },
  ],
};

// ── scenarios (the diagnosis payloads) ──────────────────────────────
export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  payments5xx: {
    key: "payments5xx",
    rootCause: "5xx spike after deploy 7f3ac1. Connection pool exhausted — the deploy changed DB pool sizing, holding connections open under load.",
    recommendedFix: "Roll back deploy 7f3ac1, raise the DB connection pool to 200, and drain + restart the two hot pods.",
    confidence: 91, confidenceBand: "high", freshnessWarning: null,
    avoid: ["Leaving pool sizing at the new (lower) value without raising the cap"],
    citations: ["INC-204", "INC-187", "INC-119"], verified: true, mttr: 38,
    rationale: "3 past payments-api-prod incidents match the symptom — top match is 92% similar.",
    steps: [
      { order: 1, text: "Roll back deploy 7f3ac1",                       sources: ["INC-204"] },
      { order: 2, text: "Raise DB connection pool to 200",               sources: ["INC-204", "INC-187"] },
      { order: 3, text: "Drain + restart 2 hot pods",                    sources: ["INC-187"] },
    ],
    retrieved: [
      { id: "INC-204", title: "5xx spike after deploy",          sim: 92, status: "resolved", mttr: "38m" },
      { id: "INC-187", title: "DB connection pool exhaustion",   sim: 81, status: "resolved", mttr: "1h12m" },
      { id: "INC-119", title: "Upstream timeout cascade",        sim: 64, status: "resolved", mttr: "52m" },
      { id: "INC-093", title: "Deploy-timeout race",              sim: 41, status: "failed",   mttr: "2h05m", freshness: "weakening" },
    ],
    top: { id: "INC-204", sim: 92, rootCause: "connection pool exhausted after a deploy changed pool sizing", resolution: "rolled back the deploy and raised the pool ceiling", mttr: "38m" },
    history: { mttr: [125, 72, 52, 38], labels: ["INC-093", "INC-187", "INC-119", "INC-204"] },
  },
  auth429: {
    key: "auth429",
    rootCause: "Login 429 cascade during a traffic surge. No load shedding active; cold token cache; client retry storm amplifies the surge.",
    recommendedFix: "Enable load shedding at Envoy, warm the token cache, and add jittered backoff on the client.",
    confidence: 32, confidenceBand: "low",
    freshnessWarning: "This mitigation worked 4 times pre-migration but has FAILED twice since the 2026-05-15 Envoy ingress migration. Flagged as WEAKENING — verify it is configured at Envoy before relying on it.",
    avoid: ["Relying on the legacy-gateway shed rule (no-op post-Envoy migration)"],
    citations: ["INC-005", "INC-009", "INC-010"], verified: true, mttr: 95,
    rationale: "3 past auth-service incidents match. Trend weakening post-migration.",
    steps: [
      { order: 1, text: "Verify load shedding is configured at Envoy, not the legacy gateway.", sources: ["INC-009", "INC-010"] },
      { order: 2, text: "Warm the token cache to avoid cold-cache amplification.",              sources: ["INC-005"] },
      { order: 3, text: "Roll out jittered backoff on auth clients to break the retry storm.",  sources: ["INC-005"] },
    ],
    retrieved: [
      { id: "INC-005", title: "Login 429 — pre-migration success",       sim: 88, status: "resolved", mttr: "60m",   freshness: "weakening" },
      { id: "INC-009", title: "Login 429 — legacy shed no-op",           sim: 79, status: "failed",   mttr: "2h10m", freshness: "weakening" },
      { id: "INC-010", title: "Login 429 — 2nd failure post-migration",  sim: 74, status: "failed",   mttr: "1h30m", freshness: "weakening" },
    ],
    top: { id: "INC-005", sim: 88, rootCause: "surge with no shedding; cold token cache; retry storm", resolution: "enabled load shedding at legacy gateway, warmed token cache, jittered backoff", mttr: "60m" },
    history: { mttr: [60, 130, 90], labels: ["INC-005", "INC-009", "INC-010"] },
  },
  oom: {
    key: "oom",
    rootCause: "OOMKilled worker pods in a loop. Unbounded in-memory embedding cache growing without limit — a memory leak, not a load issue.",
    recommendedFix: "Bound the cache with an LRU (max 10k entries), set container memory request/limit, fix the leak, and add an 80% memory alert.",
    confidence: 89, confidenceBand: "high", freshnessWarning: null,
    avoid: ["Restarting the pods (INC-003: made it worse, leak persisted)"],
    citations: ["INC-003", "INC-004"], verified: true, mttr: 110,
    rationale: "INC-004 is the same service, same symptom — the real fix.",
    steps: [
      { order: 1, text: "DO NOT just restart — INC-003 shows restart masks the leak",   sources: ["INC-003"] },
      { order: 2, text: "Bound the embedding cache with an LRU (max 10k entries)",     sources: ["INC-004"] },
      { order: 3, text: "Set container memory request/limit and fix the leak",         sources: ["INC-004"] },
      { order: 4, text: "Add a memory alert at 80%",                                   sources: ["INC-004"] },
    ],
    retrieved: [
      { id: "INC-003", title: "OOMKilled — restart only (FAILURE)",  sim: 91, status: "failed",   mttr: "60m" },
      { id: "INC-004", title: "OOMKilled — LRU cache fix (SUCCESS)", sim: 94, status: "resolved", mttr: "1h50m" },
    ],
    top: { id: "INC-004", sim: 94, rootCause: "unbounded in-memory embedding cache leaking memory", resolution: "bounded cache with LRU, set memory limits, fixed leak", mttr: "1h50m" },
    history: { mttr: [60, 110], labels: ["INC-003", "INC-004"] },
  },
  tls: {
    key: "tls",
    rootCause: "Wildcard TLS certificate expired. Auto-renewal cron had silently failed ~30 days earlier. All HTTPS requests fail with SSL handshake errors.",
    recommendedFix: "Rotate the cert, restore cert-manager auto-renewal, and add a T-14-day expiry alert.",
    confidence: 96, confidenceBand: "high", freshnessWarning: null,
    avoid: ["Manually renewing without restoring the cron (will recur)"],
    citations: ["INC-002"], verified: true, mttr: 40,
    rationale: "Direct precedent — same root cause, same fix pattern.",
    steps: [
      { order: 1, text: "Rotate the wildcard TLS cert manually",            sources: ["INC-002"] },
      { order: 2, text: "Restore cert-manager auto-renewal cron",          sources: ["INC-002"] },
      { order: 3, text: "Add a T-14-day expiry alert (alert, never after)",sources: ["INC-002"] },
    ],
    retrieved: [
      { id: "INC-002", title: "TLS cert expired — handshake errors", sim: 95, status: "resolved", mttr: "40m" },
    ],
    top: { id: "INC-002", sim: 95, rootCause: "wildcard TLS cert expired; auto-renewal cron silently failed", resolution: "rotated cert, restored auto-renewal, added T-14 alert", mttr: "40m" },
    history: { mttr: [40], labels: ["INC-002"] },
  },
  stale: {
    key: "stale",
    rootCause: "Stale read-after-write. Critical reads were routed to a lagging read replica with 12s lag.",
    recommendedFix: "Route read-after-write (and other critical reads) to the primary, and add a replica-lag alert above 2s.",
    confidence: 94, confidenceBand: "high", freshnessWarning: null,
    avoid: ["Increasing the replica — won't help if reads go to a lagging replica anyway"],
    citations: ["INC-011"], verified: true, mttr: 50,
    rationale: "Direct precedent.",
    steps: [
      { order: 1, text: "Route read-after-write to the primary",       sources: ["INC-011"] },
      { order: 2, text: "Add a replica-lag alert above 2s",            sources: ["INC-011"] },
    ],
    retrieved: [
      { id: "INC-011", title: "Stale reads — replica lag 12s", sim: 94, status: "resolved", mttr: "50m" },
    ],
    top: { id: "INC-011", sim: 94, rootCause: "read-after-write routed to lagging replica", resolution: "routed critical reads to primary, added replica-lag alert", mttr: "50m" },
    history: { mttr: [50], labels: ["INC-011"] },
  },
  baseline: {
    key: "baseline",
    rootCause: "Possible regression. Check recent deploys, look at error rates, and consider rolling back if no clear cause is found.",
    recommendedFix: "Investigate recent deploys; consider rollback; add logging; review DB pool sizing.",
    confidence: 35, confidenceBand: "low", freshnessWarning: null, avoid: [], citations: [],
    verified: false, mttr: 240,
    rationale: "Generic advice — no historical recall.",
    steps: [{ order: 1, text: "Investigate recent deploys and check error logs for the source of 5xx.", sources: [] }],
    retrieved: [], top: null, history: { mttr: [], labels: [] },
  },
};

// ── default scenario that the page auto-runs ───────────────────────
export const DEFAULT_AUTO_RUN: { service: string; symptom: string } = {
  service: "payments-api-prod",
  symptom: "5xx spike after deploy 7f3ac1; p99 latency 6.2s; DB connections pinned at 100/100",
};

// ── constants for the impact bar ────────────────────────────────────
export const MTTR_BASELINE_MINS = 240;
export const INR_PER_MIN = 500;
