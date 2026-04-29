# Swiggy CLI

![Banner](./media/banner.png)

Swiggy CLI is a command-line wrapper for Swiggy actions into a workflow runtime for everyday software. The core idea is simple: connect apps through MCP, describe higher-level intent as reusable workflows, and let users invoke those workflows the same way they would invoke a skill.


## Idea

The idea is simple: skills.

Coming from a software background, a skill is a reusable workflow bundle that can be linked, shared, and reused to make an existing toolchain smarter. We want the same pattern for everyday apps. Instead of treating each app action as an isolated click or prompt, we can package the decision-making, sequencing, and fallback logic into a workflow that people can invoke again and again.

That matters because most useful app tasks are not one-step commands. They are multi-step outcomes with constraints, tradeoffs, and approvals. A prompt can express intent, but a workflow can encode the repeatable execution pattern behind that intent.

Swiggy CLI is the first proving ground for that idea: MCP gives us the app tools, and workflows give us the reusable intelligence on top.

## Example Complex Workflow

One example of a genuinely reusable workflow is a team offsite meal orchestration skill.

Imagine a founder, office manager, or chief of staff needs to arrange lunch for 26 people across two office floors during a product launch day. The workflow has to:

- split the order into vegetarian, vegan, Jain, high-protein, and no-onion-no-garlic groups
- avoid ingredients flagged by specific teammates
- keep every restaurant within a delivery radius and an arrival window
- balance total budget, packaging charges, and delivery fees
- prefer restaurants with high ratings and low cancellation risk
- avoid repeating cuisines the team already had earlier in the week
- split the order across multiple restaurants if one kitchen cannot fulfill the full requirement
- build fallback carts in case a top restaurant goes offline or key menu items sell out
- produce a reviewable execution plan before placing any order

This is useful as a reusable workflow because the hard part is not just expressing the request in natural language. The hard part is encoding the constraint handling, fallback logic, batching strategy, and execution order in a way that can be trusted and reused every time.

## What Is In This Repo

- `src/` contains the TypeScript CLI client and terminal-facing logic
- `../backend/` contains the shared backend, MCP integration, and backend-owned development helpers
- `../docs/` contains the architecture, roadmap, and change history for the pivot
- `.env.example` lists the backend URL used by the CLI
- `dist/` is the build output created after `npm run build`

## Current Shape Of The Codebase

The CLI now acts as a thin client:

1. `src/index.ts` starts the CLI
2. `src/commands.ts` routes user commands to backend APIs
3. `src/backend-client.ts` talks to the shared backend over HTTP
4. workflow logic and MCP connectivity live in `../backend/`

## Documentation

- `docs/architecture.md` explains the current code structure and the target workflow-marketplace architecture
- `docs/roadmap.md` explains the product pivot, near-term milestones, and future scope
- `docs/change-log.md` records versioned repository changes, including the documentation pivot

## Setup

```bash
npm install
npm run build
export SWIGGY_BACKEND_URL=http://127.0.0.1:8000
node dist/index.js help
```

## Environment

The CLI uses environment variables for backend connectivity. The full set of example values is in `.env.example`.

Important variable today:

- `SWIGGY_BACKEND_URL`

## Local Utilities

- `npm run doctor` checks CLI to backend connectivity
- the backend owns the mock MCP server at `../backend/dev/mock_swiggy_mcp.py`
