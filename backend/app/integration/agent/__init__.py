"""Agent selector (BUILD_PLAN.md §3, §11).

Picks the diagnosis agent:
  USE_MOCK_AGENT=true            -> MockAgent (canned seed beats; zero creds)
  else AGENT_BACKEND=openclaw    -> OpenClawAgent (drives the OpenClaw CLI)
  else (default)                 -> HindsightAgent (recall + OpenAI, in-process)

Any failure constructing the real agent falls back to MockAgent so the demo never
hard-fails.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

from app.integration.agent.base import AgentClient

logger = logging.getLogger("incidentmind.agent")


@lru_cache
def get_agent() -> AgentClient:
    if os.getenv("USE_MOCK_AGENT", "true").lower() == "true":
        from app.integration.agent.mock_agent import MockAgent

        logger.info("agent backend = MockAgent (USE_MOCK_AGENT=true) - canned seed responses")
        return MockAgent()
    try:
        if os.getenv("AGENT_BACKEND", "hindsight").lower() == "openclaw":
            from app.integration.agent.openclaw_agent import OpenClawAgent

            agent = OpenClawAgent()
            logger.info("agent backend = OpenClawAgent (LIVE: OpenClaw CLI + Hindsight plugin)")
            return agent
        from app.integration.agent.hindsight_agent import HindsightAgent

        agent = HindsightAgent()
        logger.info("agent backend = HindsightAgent (LIVE: Hindsight recall + OpenAI)")
        return agent
    except Exception as e:  # noqa: BLE001 — demo-safe fallback
        from app.integration.agent.mock_agent import MockAgent

        logger.warning("agent backend FELL BACK to MockAgent — real init failed: %s", e)
        return MockAgent()
