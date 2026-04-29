from fastapi import FastAPI

from app.mcp.router import router as mcp_router
from app.workflows.router import router as workflows_router


app = FastAPI(title="Swiggy Backend", version="0.1.0")
app.include_router(mcp_router, prefix="/api")
app.include_router(workflows_router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
