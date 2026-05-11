from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta

from app.core.errors import AuthForbiddenError, AuthRequiredError
from app.domain.mcp.models import McpDomain

from .models import AuthDomainAccess, AuthSessionState, AuthStatusResponse, AuthToken, OAuthEndpointMetadata
from .token_store import FileTokenStore, TokenStore


DEFAULT_SESSION_ID = "default"


def get_auth_status(session_id: str | None = None) -> AuthStatusResponse:
    resolved_session_id = _resolve_session_id(session_id)
    session = _load_or_bootstrap_session(resolved_session_id)
    return AuthStatusResponse(session=session, oauth=_oauth_metadata())


def require_authenticated_session(session_id: str | None = None, domain: McpDomain | None = None) -> AuthSessionState:
    resolved_session_id = _resolve_session_id(session_id)
    session = _load_or_bootstrap_session(resolved_session_id)
    refreshed = _derive_runtime_state(session)
    _store().put(refreshed)

    if refreshed.state != "authenticated" or refreshed.reauthRequired:
        raise AuthRequiredError(f"Session `{resolved_session_id}` requires authentication.")

    if domain in {"food", "instamart", "dineout"} and not getattr(refreshed.domains, domain):
        raise AuthForbiddenError(f"Session `{resolved_session_id}` does not have access to `{domain}`.")

    return refreshed


def mark_session_authenticated(
    session_id: str | None = None,
    *,
    access_token_present: bool | None = None,
    last_validated_at: str | None = None,
) -> AuthSessionState:
    resolved_session_id = _resolve_session_id(session_id)
    session = _load_or_bootstrap_session(resolved_session_id)
    now = _utc_now()
    session.state = "authenticated"
    session.reauthRequired = False
    session.lastAuthError = None
    session.updatedAt = now
    session.token.lastValidatedAt = last_validated_at or now
    if access_token_present is not None:
        session.token.accessTokenPresent = access_token_present
    if session.token.expiresAt is None and session.token.accessTokenPresent:
        session.token.expiresAt = _future_time(seconds=_oauth_metadata().tokenLifetimeSeconds)
    session.authFreshUntil = session.token.expiresAt
    return _store().put(session)


def mark_session_reauth_required(session_id: str | None = None, error_code: str | None = None) -> AuthSessionState:
    resolved_session_id = _resolve_session_id(session_id)
    session = _load_or_bootstrap_session(resolved_session_id)
    session.state = "reauth_required"
    session.reauthRequired = True
    session.lastAuthError = error_code or "unknown_auth_error"
    session.updatedAt = _utc_now()
    return _store().put(session)


def logout_auth_session(session_id: str | None = None) -> AuthSessionState:
    resolved_session_id = _resolve_session_id(session_id)
    session = _load_or_bootstrap_session(resolved_session_id)
    now = _utc_now()
    session.state = "unauthenticated"
    session.reauthRequired = True
    session.lastAuthError = "logged_out"
    session.updatedAt = now
    session.token = AuthToken(
        accessTokenPresent=False,
        tokenType="Bearer",
        scopes=session.token.scopes,
        issuedAt=session.token.issuedAt,
        lastValidatedAt=None,
        expiresAt=None,
    )
    session.authFreshUntil = None
    session.userSessionExpiresAt = None
    return _store().put(session)


def _load_or_bootstrap_session(session_id: str) -> AuthSessionState:
    session = _store().get(session_id)
    if session is not None:
        return _derive_runtime_state(session)
    bootstrapped = _bootstrap_session(session_id)
    return _store().put(_derive_runtime_state(bootstrapped))


def _bootstrap_session(session_id: str) -> AuthSessionState:
    now = _utc_now()
    mode = _auth_mode()
    token_value = os.environ.get("SWIGGY_ACCESS_TOKEN", "").strip()
    scopes = _csv_env("SWIGGY_AUTH_SCOPES", default=["mcp:tools"])
    domains = _domain_access_from_env()
    client_id = os.environ.get("SWIGGY_AUTH_CLIENT_ID", "").strip() or None

    if mode == "dev":
        authenticated = _env_bool("SWIGGY_DEV_AUTHENTICATED", True)
        expires_at = _future_time(days=5) if authenticated and token_value else None
        return AuthSessionState(
            sessionId=session_id,
            state="authenticated" if authenticated else "unauthenticated",
            reauthRequired=not authenticated,
            clientId=client_id,
            token=AuthToken(
                accessTokenPresent=bool(token_value or authenticated),
                tokenType="Bearer",
                expiresAt=expires_at,
                scopes=scopes,
                issuedAt=now if authenticated else None,
                lastValidatedAt=now if authenticated else None,
            ),
            domains=domains,
            lastAuthError=None,
            authFreshUntil=expires_at,
            userSessionExpiresAt=_future_time(days=30) if authenticated else None,
            devMode=True,
            createdAt=now,
            updatedAt=now,
        )

    authenticated = bool(token_value)
    expires_at = os.environ.get("SWIGGY_ACCESS_TOKEN_EXPIRES_AT", "").strip() or (
        _future_time(days=5) if authenticated else None
    )
    return AuthSessionState(
        sessionId=session_id,
        state="authenticated" if authenticated else "unauthenticated",
        reauthRequired=not authenticated,
        clientId=client_id,
        token=AuthToken(
            accessTokenPresent=authenticated,
            tokenType="Bearer",
            expiresAt=expires_at,
            scopes=scopes,
            issuedAt=now if authenticated else None,
            lastValidatedAt=now if authenticated else None,
        ),
        domains=domains,
        lastAuthError="missing_access_token" if not authenticated else None,
        authFreshUntil=expires_at,
        userSessionExpiresAt=_future_time(days=30) if authenticated else None,
        devMode=False,
        createdAt=now,
        updatedAt=now,
    )


def _derive_runtime_state(session: AuthSessionState) -> AuthSessionState:
    now = datetime.now(UTC)
    if session.token.expiresAt:
        try:
            expires_at = datetime.fromisoformat(session.token.expiresAt.replace("Z", "+00:00"))
        except ValueError:
            expires_at = None
        if expires_at is not None and expires_at <= now:
            session.state = "reauth_required"
            session.reauthRequired = True
            session.lastAuthError = session.lastAuthError or "token_expired"

    if not session.token.accessTokenPresent and not session.devMode:
        session.state = "unauthenticated"
        session.reauthRequired = True
        session.lastAuthError = session.lastAuthError or "missing_access_token"

    session.updatedAt = _utc_now()
    return session


def _oauth_metadata() -> OAuthEndpointMetadata:
    base_url = os.environ.get("SWIGGY_OAUTH_BASE_URL", "https://mcp.swiggy.com").strip().rstrip("/")
    scopes = _csv_env("SWIGGY_AUTH_SCOPES", default=["mcp:tools"])
    return OAuthEndpointMetadata(
        authorizeUrl=f"{base_url}/auth/authorize",
        tokenUrl=f"{base_url}/auth/token",
        logoutUrl=f"{base_url}/auth/logout",
        pkceRequired=True,
        scopes=scopes,
        tokenLifetimeSeconds=432000,
        refreshSupported=False,
    )


def _domain_access_from_env() -> AuthDomainAccess:
    configured = {value.lower() for value in _csv_env("SWIGGY_AUTH_ALLOWED_DOMAINS", default=["food", "instamart", "dineout"])}
    return AuthDomainAccess(
        food="food" in configured,
        instamart="instamart" in configured,
        dineout="dineout" in configured,
    )


def _resolve_session_id(session_id: str | None) -> str:
    cleaned = (session_id or "").strip()
    return cleaned or os.environ.get("SWIGGY_SESSION_ID", DEFAULT_SESSION_ID).strip() or DEFAULT_SESSION_ID


def _store() -> TokenStore:
    return FileTokenStore()


def _auth_mode() -> str:
    return os.environ.get("SWIGGY_AUTH_MODE", "dev").strip().lower() or "dev"


def _csv_env(name: str, *, default: list[str]) -> list[str]:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return list(default)
    return [value.strip() for value in raw.split(",") if value.strip()]


def _env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _future_time(*, days: int = 0, seconds: int = 0) -> str:
    return (datetime.now(UTC) + timedelta(days=days, seconds=seconds)).isoformat()


def _utc_now() -> str:
    return datetime.now(UTC).isoformat()
