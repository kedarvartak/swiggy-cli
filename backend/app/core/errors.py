from __future__ import annotations


class BackendError(RuntimeError):
    """Base error type for backend-owned runtime failures."""


class McpConfigurationError(BackendError):
    """Raised when MCP startup configuration is incomplete or invalid."""


class McpProtocolError(BackendError):
    """Raised when the MCP transport or JSON-RPC exchange fails."""


class WorkflowNotFoundError(BackendError):
    """Raised when a requested workflow definition cannot be found."""


class WorkflowDefinitionExistsError(BackendError):
    """Raised when a workflow write would overwrite an existing definition."""


class WorkflowValidationError(BackendError):
    """Raised when workflow payloads are invalid or incomplete."""


class WorkflowRunNotFoundError(BackendError):
    """Raised when a requested workflow run cannot be found."""


class WorkflowRunStateError(BackendError):
    """Raised when a workflow run cannot transition from its current state."""


class WorkflowExecutionError(BackendError):
    """Raised when workflow execution fails while advancing a run."""


class AuthRequiredError(BackendError):
    """Raised when the backend needs the caller to re-authenticate."""


class AuthForbiddenError(BackendError):
    """Raised when the active session lacks required domain access or scope."""
