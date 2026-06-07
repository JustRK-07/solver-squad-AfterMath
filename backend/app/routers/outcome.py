"""POST /api/outcome (BUILD_PLAN.md §8).

    compose first-person Experience Fact -> retain (consolidation runs async)

This closes the learning loop: a reported outcome becomes recall-able memory for
the next incident.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from app.core.retain_text import compose_retain_text
from app.integration.memory import get_memory
from app.models import OutcomeRequest

router = APIRouter()
logger = logging.getLogger("incidentmind.outcome")


@router.post("/outcome")
async def outcome(req: OutcomeRequest) -> dict[str, bool]:
    report = req.outcome_report
    memory = get_memory()
    memory_name = type(memory).__name__
    live = memory_name == "RealHindsightClient"
    label = "[LIVE retain -> Hindsight bank]" if live else "[MOCK retain -> in-memory]"

    logger.info(
        "OUTCOME   %s  service=%r  outcome=%s  mttr=%sm  (memory=%s)",
        label, report.incident_input.service, report.outcome.value,
        report.mttr_minutes, memory_name,
    )

    text = compose_retain_text(report)
    try:
        await memory.retain(
            text,
            metadata={
                "service": report.incident_input.service,
                "outcome": report.outcome.value,
            },
        )
    except Exception as e:  # noqa: BLE001 — never fail the loop on a retain hiccup
        logger.warning("OUTCOME   retain FAILED (%s): %s", memory_name, e)
        return {"ok": False}

    logger.info("OUTCOME   -> retained (next similar incident will recall this)")
    return {"ok": True}
