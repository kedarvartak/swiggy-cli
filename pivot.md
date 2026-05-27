# Pivot: Workflow Studio as an AI-Assisted Authoring Surface

## What Changed And Why

The original framing treated the frontend as a workflow *runner*: pick from catalog,
fill inputs, execute, approve. That positions the product as a better Swiggy UI,
which is a weak story.

The new framing: the Studio is where people *create* workflows. The marketplace is
where those workflows live. The runner is just the last step — confirm and go.

The core insight is that the workflow JSON format already captures something genuinely
valuable: a named, parameterized, constraint-aware, approval-gated execution pattern
for a real consumer task. That artifact is worth creating, saving, and sharing. The
product should make it trivially easy to create one from a description.

## What The Product Becomes

> "Describe what you want Swiggy to do automatically. We turn that into a shareable
> workflow — with your constraints, your approval rules, your fallbacks. Save it,
> run it anytime, share it with your team."

The workflow studio stops being an execution dashboard and becomes an **authoring
surface backed by AI**. The marketplace is where those authored workflows live. The
CLI is where power users run them without the UI.

## New User Journey

### Before (current)
1. User lands on marketplace → browses 2 static workflows
2. Opens WorkflowCreation → selects workflow from dropdown
3. Fills inputs → hits "Create plan" → sees graph
4. Hits "Start run" → approves checkpoint → order placed

### After (pivot)
1. User lands on studio → sees a prompt input
2. Types: "I want a workflow that finds a high-protein meal under ₹500 and pauses
   for my approval before placing the order"
3. AI drafts the workflow definition: goal, inputs, constraints, approval points,
   tool sequence — using the known Swiggy MCP surface
4. User sees the graph preview + editable metadata (title, inputs, constraints)
5. User edits anything they want — rename inputs, add a constraint, adjust an
   approval point
6. User hits "Save to marketplace" — workflow is persisted via `POST /api/workflows`
7. From that point: user (or anyone they share it with) can open the workflow,
   fill inputs, and run it

The existing plan → run → approve flow is preserved entirely. It just becomes step 6
of authoring, not the primary UI surface.

## What The Draft Endpoint Does

A new backend endpoint `POST /api/workflows/draft` takes a natural language
description and returns a `WorkflowDefinition` JSON. It uses an LLM (Claude) with:

- The full Swiggy MCP tool registry as context (all tools, domains, retry classes,
  idempotency rules from `domain/mcp/tool_registry.py`)
- The documented constraints for each domain (₹1000 food cap, ₹99 instamart minimum,
  COD-only payment, non-idempotent placement tools)
- The `WorkflowDefinition` schema as the required output format
- The two existing workflows (`swiggy.healthy-meal.json`,
  `swiggy.team-offsite-meal-orchestration.json`) as few-shot examples

The response is a complete `WorkflowDefinition` — not a plan, not a summary. The
frontend receives it, renders it in the graph preview, and lets the user edit before
saving.

## What Stays The Same

- `WorkflowCreation` graph rendering — reused as the preview/confirm surface
- `WorkflowStudio` marketplace grid — reused as the discovery surface, now populated
  by user-created workflows
- `POST /api/workflows` save endpoint — already exists, no changes needed
- The plan → run → approve execution flow — unchanged, just accessed from the
  marketplace card ("Run this workflow") rather than being the entry point
- All backend domain services — catalog, planner, run, auth, observability

## What Changes

### Backend — New

**`POST /api/workflows/draft`**
- Input: `{ "description": string, "domain"?: "food" | "instamart" | "dineout" | "multi-domain" }`
- Output: `WorkflowDefinition` (same schema as catalog entries)
- Implementation: Claude API call with tool registry + schema context + few-shot examples
- Lives in: `backend/app/api/workflows.py` (new route) + `backend/app/domain/workflows/draft_service.py` (new service)
- The draft is not saved automatically — the frontend saves it only when the user
  confirms

### Frontend — Modified

**`WorkflowCreation`**
- Add a new `mode` prop: `"author"` | `"run"`
- In `author` mode: show a prompt input ("Describe your workflow") + domain selector
  before the graph. On submit, call `backendApi.draftWorkflow(description, domain)`
  and populate the graph with the returned definition.
- Add an editable metadata panel (title, inputs list, constraints list) alongside
  the graph preview — so users can adjust before saving
- Add a "Save to marketplace" button that calls `backendApi.saveWorkflow(definition)`
- In `run` mode: existing behavior unchanged

**`WorkflowStudio`**
- Change the "Open live board" button to two actions: "Run" (opens WorkflowCreation
  in run mode) and "Edit" (opens WorkflowCreation in author mode with the existing
  definition pre-loaded)
- Add a "Create new workflow" CTA that opens WorkflowCreation in author mode with
  an empty prompt

**`api/backend.ts`**
- Add `draftWorkflow(description: string, domain?: string): Promise<WorkflowDefinition>`
- Add `saveWorkflow(definition: WorkflowDefinition, force?: boolean): Promise<{ workflowId: string }>`
  (thin wrapper over existing `POST /api/workflows`)

### Frontend — Unchanged

- `HeroSection` — no changes
- `ExecutionConsole` — no changes (stays as homepage decoration for now)
- App routing — no changes

## Phase Order

### Phase A: Draft endpoint
Build `draft_service.py` and `POST /api/workflows/draft`. Test it returns valid
`WorkflowDefinition` JSON for 3-4 prompt examples. This is the core new capability.

### Phase B: Author mode in WorkflowCreation
Add the prompt input surface and wire it to the draft endpoint. The graph preview
already works — you just need to feed it a draft definition instead of a catalog
entry. Add the editable metadata panel and "Save" button.

### Phase C: Marketplace update
Add "Create new workflow" CTA to WorkflowStudio. Add "Edit" action to existing
workflow cards. The marketplace now shows both built-in and user-created workflows.

### Phase D: Refinement
- Draft quality: tune the prompt with more few-shot examples as the catalog grows
- Edit UX: allow reordering steps, adding/removing inputs inline in the graph
- Sharing: workflow URLs that others can open and run directly

## What This Unlocks

Once authoring works, the marketing story is concrete:

- "I described my usual protein meal order in one sentence. The studio built the
  workflow. Now I run it every Sunday."
- "We created a team offsite workflow with fallback restaurants and dietary coverage.
  Everyone on the team runs the same workflow — no one hand-orders anymore."
- The marketplace grows because creating a workflow costs one sentence, not writing
  JSON by hand.

## Immediate Next Step

Start with `draft_service.py`. It needs:
1. The tool registry serialized as context (already exists in `tool_registry.py`)
2. Both existing workflow JSONs as few-shot examples
3. A Claude API call with the `WorkflowDefinition` schema as the required output shape
4. Basic validation that the returned definition references only real tools from the
   registry

Everything else in the pivot depends on this endpoint working well.
