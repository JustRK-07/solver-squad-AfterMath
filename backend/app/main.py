"""FastAPI app entrypoint (BUILD_PLAN.md §2 backend tier).

Run locally:  uvicorn app.main:app --reload --port 8000
The Next.js frontend points NEXT_PUBLIC_API_BASE at this service.
"""

from __future__ import annotations

import logging
import os
import sys

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# ── Visible app logger ────────────────────────────────────────────────────────
# Every diagnose request logs whether it ran the LIVE flow (real agent + real
# Hindsight) or fell back to MOCK, so you can tell at a glance in the uvicorn
# console. Configured before routers import so module loggers inherit it.
_log = logging.getLogger("incidentmind")
if not _log.handlers:
    _h = logging.StreamHandler(sys.stdout)
    _h.setFormatter(logging.Formatter("%(levelname)-7s [incidentmind] %(message)s"))
    _log.addHandler(_h)
_log.setLevel(logging.INFO)
_log.propagate = False

from app.routers import diagnose, memory, outcome  # noqa: E402  (after logger setup)

app = FastAPI(title="IncidentMind API", version="0.1.0")

# Frontend (Next.js) runs on a different origin during dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnose.router, prefix="/api", tags=["diagnose"])
app.include_router(outcome.router, prefix="/api", tags=["outcome"])
app.include_router(memory.router, prefix="/api", tags=["memory"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
