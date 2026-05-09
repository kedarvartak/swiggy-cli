# Backend Contract

## Purpose

This document freezes the backend-facing contract before deeper refactors begin.

It exists to answer three questions:

1. What API surface should the backend eventually expose?
2. What canonical response shapes should frontend and CLI rely on?
3. How should workflow definitions and workflow runs be represented?

This is the target contract for the next phases. The current implementation does not yet satisfy all of it.

## Contract Principles

- The backend is the single runtime authority for workflow planning and execution.
- Frontend and CLI are clients of the same backend contract.
- Raw MCP transport details stay behind backend-owned services.
- Workflow planning and workflow execution are distinct models.
- Every mutation-heavy path must expose approval checkpoints.
- Every tool call and workflow run should surface enough metadata for debugging and production support.

## API Namespaces

The backend should converge to these namespaces:

- `/health`
- `/api/auth/*`
- `/api/mcp/*`
- `/api/workflows/*`
- `/api/runs/*`

### `/health`

Purpose:

- backend liveness/readiness

### `/api/auth/*`

Purpose:

- auth runtime status
- token/session state
- re-auth required state
- future OAuth orchestration hooks

### `/api/mcp/*`

Purpose:

- server/domain status
- tool discovery
- direct tool execution for diagnostics or advanced use cases

### `/api/workflows/*`

Purpose:

- workflow catalog browsing
- workflow definition retrieval
- workflow planning from user inputs
- workflow creation/update for internal or power-user authoring

### `/api/runs/*`

Purpose:

- create workflow runs
- inspect run state
- advance execution
- pause/resume/approve
- stream or poll run events

## Canonical Response Envelope

All non-streaming backend endpoints should converge to a consistent envelope.

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-05-09T10:00:00Z"
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "MCP_UPSTREAM_TIMEOUT",
    "message": "Swiggy MCP server timed out while executing search_restaurants.",
    "retryable": true,
    "domain": "food",
    "tool": "search_restaurants",
    "sessionId": "sess_123"
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-05-09T10:00:00Z"
  }
}
```

## Metadata Fields

Every envelope `meta` block should support:

- `requestId`
- `timestamp`
- `backendVersion`
- `sessionId` when available
- `deprecation` when an upstream contract is changing

## Canonical MCP Models

### MCP Status

```json
{
  "server": "food",
  "transport": "stdio",
  "connected": true,
  "initialized": true,
  "serverInfo": {},
  "capabilities": {}
}
```

### Tool Descriptor

```json
{
  "name": "search_restaurants",
  "domain": "food",
  "stage": "discover",
  "description": "Search and order food from restaurants for delivery.",
  "inputSchema": {},
  "retryClass": "read",
  "requiresApproval": false,
  "supportsBlindRetry": true
}
```

### Tool Call Result

```json
{
  "name": "search_restaurants",
  "domain": "food",
  "sessionId": "sess_123",
  "success": true,
  "data": {},
  "timing": {
    "durationMs": 217
  }
}
```

## Canonical Workflow Catalog Models

### Workflow Summary

For marketplace/listing surfaces:

```json
{
  "id": "swiggy.weekday-lunch",
  "title": "Weekday Lunch Autopilot",
  "version": "0.1.0",
  "domain": "food",
  "summary": "Build a budget-safe lunch cart and stop before checkout.",
  "tags": ["quick-meals", "budget"],
  "difficulty": "simple",
  "approvalRequired": true
}
```

### Workflow Definition

For detail and authoring surfaces:

```json
{
  "id": "swiggy.weekday-lunch",
  "title": "Weekday Lunch Autopilot",
  "version": "0.1.0",
  "app": "swiggy",
  "domain": "food",
  "goal": "Order a usual weekday lunch under a budget threshold.",
  "summary": "Build a budget-safe lunch cart and stop before checkout.",
  "difficulty": "simple",
  "tags": ["quick-meals", "budget"],
  "inputs": [],
  "constraints": [],
  "approvalPoints": [],
  "tools": [],
  "steps": [],
  "guarantees": [],
  "limitations": [],
  "fallbackRules": [],
  "successOutput": {
    "type": "cart-ready"
  }
}
```

## Canonical Workflow Plan Models

Planning output should be richer than the current static plan shape.

### Workflow Plan

```json
{
  "workflowId": "swiggy.weekday-lunch",
  "title": "Weekday Lunch Autopilot",
  "summary": "Build a budget-safe lunch cart and stop before checkout.",
  "executable": true,
  "providedInputs": {},
  "missingRequiredInputs": [],
  "toolSequence": [
    "get_addresses",
    "search_restaurants",
    "get_restaurant_menu",
    "update_food_cart",
    "get_food_cart"
  ],
  "nextAction": "Create a workflow run to execute the plan.",
  "approvalRequired": true,
  "steps": [],
  "graph": {
    "nodes": [],
    "edges": []
  }
}
```

### Workflow Plan Step

```json
{
  "id": "prepare-cart",
  "title": "Prepare the cart",
  "kind": "tool-call",
  "description": "Add selected items to the server-side food cart.",
  "status": "ready",
  "toolName": "update_food_cart",
  "argumentHints": ["restaurantId", "items"]
}
```

## Canonical Workflow Run Models

### Workflow Run

```json
{
  "runId": "run_123",
  "workflowId": "swiggy.weekday-lunch",
  "status": "waiting_for_approval",
  "domain": "food",
  "title": "Weekday Lunch Autopilot",
  "providedInputs": {},
  "currentStepId": "pause-for-approval",
  "pendingApproval": true,
  "steps": [],
  "events": [],
  "summary": {
    "completedSteps": 4,
    "totalSteps": 5
  }
}
```

### Workflow Run Step

```json
{
  "id": "prepare-cart",
  "title": "Prepare the cart",
  "kind": "tool-call",
  "status": "completed",
  "toolName": "update_food_cart",
  "startedAt": "2026-05-09T10:00:00Z",
  "completedAt": "2026-05-09T10:00:01Z"
}
```

### Workflow Run Event

```json
{
  "id": "evt_123",
  "type": "tool_call_completed",
  "stepId": "prepare-cart",
  "toolName": "update_food_cart",
  "timestamp": "2026-05-09T10:00:01Z",
  "sessionId": "sess_123",
  "payload": {}
}
```

## Approval Checkpoint Contract

Any workflow that can place or mutate an order irreversibly should pause at an approval checkpoint.

### Approval Payload

```json
{
  "required": true,
  "kind": "final_confirmation",
  "stepId": "pause-for-approval",
  "message": "Review cart and confirm before placing order.",
  "reviewData": {
    "cartSummary": {},
    "total": {}
  }
}
```

## Workflow File Location And Versioning Decision

Phase 0 decision:

- Source of truth stays in `workflows/*.json`
- Backend loads from `SWIGGY_WORKFLOW_DIR` when set
- Default path remains the repository `workflows/` directory
- Each workflow definition owns a required `version`
- Versioning should use semver-style strings

Implication:

- workflow definitions are file-backed for now
- future registry/database support must preserve compatibility with the current file schema

## Client Integration Rules

### Frontend

- Treat workflow plan and run payloads as backend-owned truth
- Do not infer execution state locally once run APIs exist
- React Flow node/edge rendering should be driven from backend plan/run graph data

### CLI

- Use backend APIs for planning and execution
- Keep CLI focused on input parsing and rendering
- Do not duplicate workflow logic or retry semantics in CLI

## Non-Goals For Phase 0

- implementing workflow execution
- implementing OAuth
- changing current route behavior
- introducing persistence beyond current workflow JSON files

## Phase 0 Outputs

This contract document freezes:

- API namespaces
- response envelope shape
- workflow planning target shape
- workflow run target shape
- workflow file location/versioning decision

Phase 1 should now refactor the backend structure to match this contract direction without changing user-visible behavior yet.
