"""POST /api/diagnose (BUILD_PLAN.md §8).

    if not use_memory: return baseline (raw OpenAI, NO retrieval — the dumb control)
    else:              agent.diagnose -> getObservations -> assembleResult (computes confidence)

The use_memory=false branch deliberately skips OpenClaw/Hindsight entirely so the
ON/OFF toggle is dramatic.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from app.core.assemble import assemble_result
from app.integration.agent import get_agent
from app.integration.llm.openai_client import baseline_diagnosis
from app.integration.memory import get_memory
from app.models import DiagnoseRequest, DiagnosisResult

router = APIRouter()
logger = logging.getLogger("incidentmind.diagnose")


def _flow_label(agent_name: str, memory_name: str) -> str:
    """LIVE only if both the agent and memory are the real adapters."""
    agent_live = agent_name in ("HindsightAgent", "OpenClawAgent")
    memory_live = memory_name == "RealHindsightClient"
    if agent_live and memory_live:
        return "[LIVE flow]"
    if not agent_live and memory_name == "MockHindsightClient":
        return "[MOCK data]"
    return "[PARTIAL: mixed live/mock]"


@router.post("/diagnose", response_model=DiagnosisResult, response_model_by_alias=True)
async def diagnose(req: DiagnoseRequest) -> DiagnosisResult:
    symptom = req.input.symptom[:70]

    if not req.use_memory:
        # Raw OpenAI, no retrieval — the baseline control.
        logger.info("DIAGNOSE  [BASELINE] (memory OFF, no recall)  symptom=%r", symptom)
        return await baseline_diagnosis(req.input)

    agent = get_agent()
    memory = get_memory()
    agent_name, memory_name = type(agent).__name__, type(memory).__name__
    logger.info(
        "DIAGNOSE  %s  agent=%s  memory=%s  symptom=%r",
        _flow_label(agent_name, memory_name), agent_name, memory_name, symptom,
    )

    reflect = await agent.diagnose(req.input)
    obs, evidence = await memory.get_observations(req.input.symptom)
    result = assemble_result(reflect, obs, evidence)

    logger.info(
        "DIAGNOSE  -> done  confidence=%s %s  freshness=%s  cites=%s",
        result.confidence, result.confidence_band.upper(), obs.freshness,
        result.supporting_incident_ids,
    )
    return result
