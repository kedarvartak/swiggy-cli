from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.mcp import router as mcp_router
from app.api.workflows import router as workflows_router


app = FastAPI(title="Swiggy Backend", version="0.1.0")
app.include_router(health_router)
app.include_router(mcp_router, prefix="/api")
app.include_router(workflows_router, prefix="/api")
