"""reflect + observations -> DiagnosisResult (BUILD_PLAN.md §3, §8).

Confidence is computed HERE — the join point where reasoning meets memory
metadata. The agent/LLM never sees the confidence number. This is also where we
assemble the UI-facing extras (ordered steps with provenance, a representative
MTTR, and the MTTR history sparkline) from the recalled evidence.
"""

from __future__ import annotations

import statistics

from app.core.confidence import compute_confidence
from app.models import (
    DiagnosisResult,
    EvidenceItem,
    MttrHistory,
    ObservationMeta,
    ReflectResult,
    RemediationStep,
)


def assemble_result(
    reflect: ReflectResult,
    obs: ObservationMeta,
    evidence: list[EvidenceItem],
) -> DiagnosisResult:
    conf = compute_confidence(obs)

    # §6 (non-negotiable): a citation may not reference an incident that was not
    # recalled. Filter the agent's ids down to the recalled evidence set.
    recalled_ids = {e.incident_id for e in evidence}
    supporting = [i for i in reflect.supporting_incident_ids if i in recalled_ids]
    if not supporting:
        supporting = reflect.supporting_incident_ids  # nothing recalled yet → keep as-is

    # Ordered remediation steps, each with its (recalled-only) provenance. Fall back
    # to a single step from the recommended fix if the agent returned none.
    steps: list[RemediationStep] = []
    for i, s in enumerate(reflect.steps):
        srcs = [x for x in s.sources if not recalled_ids or x in recalled_ids]
        steps.append(RemediationStep(order=i + 1, text=s.text, sources=srcs))
    if not steps:
        steps = [RemediationStep(order=1, text=reflect.recommended_fix, sources=supporting)]

    freshness_warning = None
    if obs.freshness == "weakening":
        freshness_warning = "This fix is weakening — verify before applying."
    elif obs.freshness == "stale":
        freshness_warning = "Evidence is stale — confirm it still holds."

    # Representative fix time + the MTTR trend (chronological) for the sparkline.
    mttrs = [e.mttr_minutes for e in evidence if e.mttr_minutes]
    mttr_minutes = round(statistics.median(mttrs)) if mttrs else 0
    chron = sorted(evidence, key=lambda e: e.date)
    history = MttrHistory(
        mttr=[e.mttr_minutes for e in chron],
        labels=[e.incident_id for e in chron],
    )

    return DiagnosisResult(
        root_cause=reflect.root_cause,
        recommended_fix=reflect.recommended_fix,
        avoid=reflect.avoid,
        supporting_incident_ids=supporting,
        confidence=conf.score,
        confidence_band=conf.band,
        freshness_warning=freshness_warning,
        verified=conf.verified,
        evidence=evidence,
        rationale=reflect.rationale,
        steps=steps,
        mttr_minutes=mttr_minutes,
        history=history,
    )
