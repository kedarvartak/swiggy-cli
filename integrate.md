# Backend Integration Plan

## Purpose

This document turns the current repository state plus the `developer_docs/` contract into an execution plan.

The goal is not just to "connect backend to frontend and CLI". The goal is to make the backend the single reliable runtime for:

- Swiggy MCP connectivity
- OAuth/session handling
- workflow catalog and planning
- workflow execution and approval checkpoints
- shared status/error semantics for both frontend and CLI

The work should be implemented phase by phase, in order, without skipping foundational pieces.

## What The Docs Imply

From `developer_docs/`, the backend must eventually support:

- three Swiggy MCP server domains: `food`, `instamart`, `dineout`
- OAuth 2.1 with PKCE and token lifecycle handling
- per-tool retry/idempotency rules
- session-aware, multi-turn workflow execution
- cart refresh patterns before mutation and before placement
- production-grade observability with session ids
- a stable tool layer separated from workflow logic
- a workflow layer that compiles user intent into MCP-backed execution

## Current State

The current backend is still a thin scaffold:

- `backend/app/mcp/service.py` starts an MCP process over stdio and exposes `status`, `list_tools`, `call_tool`
- `backend/app/workflows/service.py` reads workflow JSON files and creates static plans
- there is no execution engine
- there is no OAuth/session management
- there is no persistent workflow run state
- there is no domain-aware backend contract for frontend workflow screens
- CLI and frontend are not yet consuming a full shared backend runtime, only thin endpoints

So the backend structure is not yet aligned with the developer docs.

## Target Backend Shape

The backend should move toward this structure:

```text
backend/app/
  main.py
  core/
    config.py
    logging.py
    errors.py
    ids.py
  api/
    health.py
    mcp.py
    workflows.py
    runs.py
    auth.py
  domain/
    workflows/
      models.py
      catalog_service.py
      planner_service.py
      execution_service.py
      state_service.py
    mcp/
      models.py
      client.py
      tool_registry.py
      tool_executor.py
      retry_policy.py
    auth/
      models.py
      service.py
      token_store.py
  infrastructure/
    persistence/
    mcp/
    oauth/
```

This does not need to be implemented in one shot. It is the direction the phases below should converge toward.

## Guiding Rules

1. The backend owns real workflow execution semantics.
2. Frontend and CLI should become thin clients over backend APIs.
3. Raw MCP tools stay isolated from workflow policy logic.
4. Workflow planning and workflow execution are separate concerns.
5. Mutation-heavy steps must support approval checkpoints.
6. Cart and order state must be re-read server-side at turn boundaries.
7. Error handling and observability must be identical regardless of client.

## Phase 0: Baseline And Contract Freeze

### Objective

Freeze the intended architecture and inventory the gap between the current scaffold and the developer docs.

### Deliverables

- Finalize this plan document.
- Audit every documented Swiggy tool into a backend-owned tool registry shape.
- Define canonical backend response envelopes for:
  - tool metadata
  - workflow definitions
  - workflow plans
  - workflow runs
  - approval checkpoints
  - tool execution events
- Decide where workflow JSON definitions live and how they are versioned.

### Implementation Notes

- Keep current APIs working while we refactor internals.
- No frontend or CLI feature expansion yet beyond compatibility fixes.

### Exit Criteria

- We have a written contract for backend models and endpoints.
- We know exactly which developer docs map to which backend modules.

## Phase 1: Restructure Backend Internals

### Objective

Refactor the backend from "routers calling utility functions" into a layered service structure that matches the long-term runtime.

### Deliverables

- Introduce `core/`, `api/`, and `domain/` folders.
- Move router code into `backend/app/api/`.
- Split `workflows/service.py` into:
  - catalog loading
  - plan generation
  - validation
- Split `mcp/service.py` into:
  - config loading
  - session/client transport
  - tool execution
  - error mapping
- Add shared error classes and config loading.

### Implementation Notes

- Do not change business behavior yet.
- This is an internal structure phase.
- Keep the existing `/api/mcp/*` and `/api/workflows/*` routes stable unless a migration is explicitly planned.

### Exit Criteria

- Backend folders reflect clear boundaries.
- The current feature set still works after refactor.
- The codebase is ready to add execution/auth/state without piling everything into two service files.

## Phase 2: MCP Domain Registry And Tool Layer

### Objective

Make the backend MCP layer domain-aware and aligned with documented Swiggy servers.

### Deliverables

- Add explicit server/domain support:
  - `food`
  - `instamart`
  - `dineout`
- Build a backend-owned tool registry derived from `developer_docs/reference/**`.
- Normalize tool metadata across domains:
  - tool name
  - domain
  - kind
  - retry class
  - idempotency rules
  - approval sensitivity
- Add backend policies for:
  - pure reads
  - cart mutations
  - placement tools
  - tracking tools

### Implementation Notes

- This phase should encode the `ship/prod.md` retry rules as code, not just notes.
- Placement tools must be marked non-blind-retry.
- Food/Instamart/Dineout should not be treated as a generic undifferentiated tool bag.

### Exit Criteria

- Backend can answer "what tools exist and how should each be handled?" in a structured way.
- Retry and idempotency policy is code-backed.

## Phase 3: Workflow Catalog And Planning Model

### Objective

Upgrade workflow definitions from simple JSON display artifacts into real backend planning inputs.

### Deliverables

- Expand workflow definition schema to support:
  - `domain`
  - `goal`
  - `constraints`
  - `approval_points`
  - `success_output`
  - `fallback_rules`
  - `tool_strategy`
- Keep marketplace-facing metadata separate from execution-facing metadata.
- Improve planning output to include:
  - ordered execution graph
  - missing inputs
  - guardrails
  - approval checkpoints
  - user-facing summary

### Implementation Notes

- Planning is still not execution.
- This phase should serve both:
  - frontend workflow detail/creation views
  - CLI workflow preview commands

### Exit Criteria

- A workflow plan is rich enough to drive the frontend flow board and CLI preview.
- Workflow JSON is no longer underspecified relative to the product direction.

## Phase 4: Workflow Run State And Execution Engine

### Objective

Add real workflow execution orchestration with state, step progression, and approval pausing.

### Deliverables

- Introduce a workflow run model:
  - `run_id`
  - `workflow_id`
  - `status`
  - `current_step`
  - `completed_steps`
  - `pending_approval`
  - `tool_events`
  - `provided_inputs`
  - `resolved_context`
- Add execution endpoints such as:
  - create run
  - get run
  - advance run
  - approve run
  - cancel run
- Execute tool steps server-side in sequence.
- Persist run state at least in a local file or lightweight store first.

### Implementation Notes

- Follow `developer_docs/agent-patterns/multi-turn-cart-state.md`.
- Every turn that touches cart/order state should refresh the server-side truth before mutating or placing.
- Approval steps must stop execution cleanly and expose enough data for UI review.

### Exit Criteria

- Backend owns the execution lifecycle rather than just returning static plans.
- A workflow can be created, started, paused, resumed, and inspected.

## Phase 5: Auth And Session Foundation

### Objective

Shape the backend around the documented OAuth reality even before production credentials are available.

### Deliverables

- Add auth/session abstractions:
  - token model
  - token storage interface
  - auth status endpoint
  - re-auth required state
- Design the OAuth integration points around `developer_docs/auth/auth.md`.
- Support environment-based dev mocks for now, real OAuth later.
- Store per-session domain access and auth freshness state.

### Implementation Notes

- We do not need production OAuth fully live in this phase.
- We do need the backend interfaces and error handling to be ready for it.
- `401`, token expiry, and re-auth flows should already have backend semantics.

### Exit Criteria

- Backend can represent authenticated vs unauthenticated runtime state cleanly.
- The switch from mock/dev auth to prod OAuth does not require architectural rewrite.

## Phase 6: Observability, Errors, And Production Safety

### Objective

Encode the operational requirements from `developer_docs/ship/prod.md`.

### Deliverables

- Structured logging for every tool call and workflow run event.
- Session id capture and propagation.
- Unified backend error envelope:
  - error code
  - message
  - retryability
  - domain
  - tool
  - session id
- Metrics hooks for:
  - tool latency
  - tool success rate
  - workflow completion rate
  - approval drop-off
  - auth failure rate
- Production retry helpers per documented tool class.

### Implementation Notes

- The backend should decide retry policy, not each client separately.
- Frontend and CLI should receive the same normalized error interpretation.

### Exit Criteria

- Backend behavior matches the documented production runbook shape.
- Support/debug traces are good enough for real integration incidents.

## Phase 7: Frontend Integration

### Objective

Move the frontend from mocked/static workflow data to backend-driven workflow planning and execution.

### Deliverables

- Replace hardcoded workflow marketplace cards with backend-loaded catalog data.
- Replace static workflow graph generation with backend plan/run responses.
- Drive the workflow board from backend plan/run models:
  - nodes
  - edges
  - current step
  - approval state
  - step status
- Add approval actions backed by backend endpoints.

### Implementation Notes

- Frontend should not build execution truth locally.
- The frontend is a visualization and approval client for backend state.

### Exit Criteria

- Workflow Studio and Workflow Creation screens are backed by live backend data.
- The flow board reflects real run state, not simulated local timers.

## Phase 8: CLI Integration

### Objective

Make the CLI a true thin client over the same backend runtime.

### Deliverables

- Extend `cli/src/backend-client.ts` for run lifecycle APIs.
- Add CLI commands for:
  - list workflows
  - inspect workflow
  - create plan
  - start run
  - show run status
  - approve step
- Remove any logic that duplicates backend planning/execution behavior.

### Implementation Notes

- CLI should remain product-facing and readable.
- Transport and rendering stay in CLI.
- Workflow orchestration moves to backend.

### Exit Criteria

- CLI and frontend use the same source of truth.
- Running a workflow from CLI and frontend hits the same backend execution engine.

## Phase 9: End-to-End Dev Harness Before Prod Access

### Objective

Prove the full architecture locally before production API access lands.

### Deliverables

- Local mock MCP path remains usable.
- End-to-end demo flows for:
  - food ordering
  - grocery restock
  - dineout reservation
- Seed workflow definitions that reflect real documented tool journeys.
- Integration tests for:
  - plan generation
  - run execution
  - approval checkpoints
  - retry branching
  - cart refresh pattern

### Implementation Notes

- This phase is critical. The prod API should plug into a tested runtime, not be the first time the architecture is exercised.

### Exit Criteria

- We can demo the full flow with the mock backend/runtime.
- Production credentials become an integration swap, not a discovery exercise.

## Recommended Phase Order

Implement in this order:

1. Phase 0: Baseline And Contract Freeze
2. Phase 1: Restructure Backend Internals
3. Phase 2: MCP Domain Registry And Tool Layer
4. Phase 3: Workflow Catalog And Planning Model
5. Phase 4: Workflow Run State And Execution Engine
6. Phase 5: Auth And Session Foundation
7. Phase 6: Observability, Errors, And Production Safety
8. Phase 7: Frontend Integration
9. Phase 8: CLI Integration
10. Phase 9: End-to-End Dev Harness Before Prod Access

## Suggested Milestone Cuts

### Milestone A: Backend Skeleton Aligned

Includes phases 0-2.

Result:

- backend structure is no longer a scaffold
- MCP layer is domain-aware
- tool policy is encoded

### Milestone B: Workflow Runtime Exists

Includes phases 3-4.

Result:

- workflow planning is rich
- runs can execute and pause for approval

### Milestone C: Production-Ready Backend Contract

Includes phases 5-6.

Result:

- auth, retries, errors, and observability are correctly modeled

### Milestone D: Unified Product Clients

Includes phases 7-8.

Result:

- frontend and CLI both run through the same backend runtime

### Milestone E: Pre-Prod Confidence

Includes phase 9.

Result:

- mock-backed end-to-end confidence before real API access

## Immediate Next Step

Start with Phase 0 and Phase 1 together:

- freeze backend API/model contracts
- refactor backend folders and services
- preserve existing routes while moving internals into the target layered structure

That is the highest-leverage first implementation block. Without it, later workflow/auth/runtime work will pile into the current thin files and create avoidable rewrite churn.


NOTE - AT EVERY STEP MAKE SURE THE TOOLS AND BACKEND STRUCTURES FOLLOW THE ONES IN DEVELOPER_DOCS DIRECTORY