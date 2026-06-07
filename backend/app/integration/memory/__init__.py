"""Memory selector: Real (Hindsight) vs Mock (BUILD_PLAN.md §3, §11).

env flag picks the adapter; try/except falls back to Mock so the demo never
hard-fails when Hindsight flakes.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache

from app.integration.memory.base import HindsightClient

logger = logging.getLogger("incidentmind.memory")


@lru_cache
def get_memory() -> HindsightClient:
    if os.getenv("USE_MOCK_HINDSIGHT", "true").lower() == "true":
        from app.integration.memory.mock_hindsight import MockHindsightClient

        logger.info("memory backend = MockHindsightClient (USE_MOCK_HINDSIGHT=true) - seed file")
        return MockHindsightClient()
    try:
        from app.integration.memory.real_hindsight import RealHindsightClient

        client = RealHindsightClient()
        logger.info("memory backend = RealHindsightClient (LIVE: Hindsight Cloud bank '%s')", client._bank)
        return client
    except Exception as e:  # noqa: BLE001 — demo-safe fallback
        from app.integration.memory.mock_hindsight import MockHindsightClient

        logger.warning("memory backend FELL BACK to MockHindsightClient — real init failed: %s", e)
        return MockHindsightClient()
