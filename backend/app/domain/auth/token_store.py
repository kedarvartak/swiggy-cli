from __future__ import annotations

import json
from pathlib import Path
from typing import Protocol

from app.core.config import get_auth_storage_directory

from .models import AuthSessionState


class TokenStore(Protocol):
    def get(self, session_id: str) -> AuthSessionState | None: ...

    def put(self, session: AuthSessionState) -> AuthSessionState: ...

    def delete(self, session_id: str) -> None: ...


class FileTokenStore:
    def __init__(self, base_dir: Path | None = None):
        self._base_dir = base_dir or get_auth_storage_directory()
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def get(self, session_id: str) -> AuthSessionState | None:
        path = self._path_for(session_id)
        if not path.exists():
            return None
        return AuthSessionState.model_validate(json.loads(path.read_text()))

    def put(self, session: AuthSessionState) -> AuthSessionState:
        path = self._path_for(session.sessionId)
        path.write_text(json.dumps(session.model_dump(mode="json"), indent=2))
        return session

    def delete(self, session_id: str) -> None:
        path = self._path_for(session_id)
        if path.exists():
            path.unlink()

    def _path_for(self, session_id: str) -> Path:
        safe_id = "".join(ch if ch.isalnum() or ch in "_-" else "-" for ch in session_id)
        return self._base_dir / f"{safe_id}.json"
