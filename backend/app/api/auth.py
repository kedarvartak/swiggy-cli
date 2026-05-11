from __future__ import annotations

from fastapi import APIRouter, Query

from app.domain.auth.models import AuthStatusResponse
from app.domain.auth.service import (
    get_auth_status,
    logout_auth_session,
    mark_session_authenticated,
    mark_session_reauth_required,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/status", response_model=AuthStatusResponse)
def auth_status(session_id: str | None = Query(default=None)) -> AuthStatusResponse:
    return get_auth_status(session_id)


@router.post("/logout", response_model=AuthStatusResponse)
def auth_logout(session_id: str | None = Query(default=None)) -> AuthStatusResponse:
    session = logout_auth_session(session_id)
    return AuthStatusResponse(session=session, oauth=get_auth_status(session_id).oauth)


@router.post("/dev/mark-authenticated", response_model=AuthStatusResponse)
def auth_mark_authenticated(session_id: str | None = Query(default=None)) -> AuthStatusResponse:
    session = mark_session_authenticated(session_id)
    return AuthStatusResponse(session=session, oauth=get_auth_status(session_id).oauth)


@router.post("/dev/mark-reauth-required", response_model=AuthStatusResponse)
def auth_mark_reauth_required(
    session_id: str | None = Query(default=None),
    error_code: str | None = Query(default=None),
) -> AuthStatusResponse:
    session = mark_session_reauth_required(session_id, error_code)
    return AuthStatusResponse(session=session, oauth=get_auth_status(session_id).oauth)
