from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


AuthState = Literal["authenticated", "unauthenticated", "reauth_required"]


class OAuthEndpointMetadata(BaseModel):
    authorizeUrl: str
    tokenUrl: str
    logoutUrl: str
    pkceRequired: bool = True
    scopes: list[str] = Field(default_factory=list)
    tokenLifetimeSeconds: int = 432000
    refreshSupported: bool = False


class AuthToken(BaseModel):
    accessTokenPresent: bool = False
    tokenType: str = "Bearer"
    expiresAt: str | None = None
    scopes: list[str] = Field(default_factory=list)
    issuedAt: str | None = None
    lastValidatedAt: str | None = None


class AuthDomainAccess(BaseModel):
    food: bool = False
    instamart: bool = False
    dineout: bool = False


class AuthSessionState(BaseModel):
    sessionId: str
    state: AuthState
    reauthRequired: bool = False
    clientId: str | None = None
    token: AuthToken = Field(default_factory=AuthToken)
    domains: AuthDomainAccess = Field(default_factory=AuthDomainAccess)
    lastAuthError: str | None = None
    authFreshUntil: str | None = None
    userSessionExpiresAt: str | None = None
    devMode: bool = False
    createdAt: str
    updatedAt: str


class AuthStatusResponse(BaseModel):
    session: AuthSessionState
    oauth: OAuthEndpointMetadata
