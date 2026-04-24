# Swiggy CLI

Swiggy CLI is a command-line product for orchestrating Swiggy Food workflows through an MCP-compatible backend. The project starts with direct food-ordering operations and extends toward higher-level agents such as Group Ordering, Dietary Planner, Voice Agent, Reorder Agent, and Budget Optimizer Agent.

The codebase is fully TypeScript. It contains the product CLI, the MCP transport layer, Group Ordering integration scaffolding for Slack and Microsoft Teams, and local development utilities such as an environment doctor and a mock MCP server.

## Product Idea

The core idea is to turn Swiggy capabilities into a programmable workflow surface.

At the base layer, the CLI can call Swiggy Food tools through MCP. On top of that, the project adds business workflows that are more useful than raw tool calls, such as collecting team meal preferences, planning constrained orders, or preparing future agent-driven experiences.

## Current Product Scope

The current implementation covers:

- Swiggy Food MCP connectivity over stdio
- Tool discovery
- Restaurant search
- Restaurant menu retrieval
- Cart view and cart update
- Order placement and order tracking
- Group Ordering planning
- Slack and Microsoft Teams integration scaffolding for Group Ordering

## Document Guide

- `README.md`: brief product overview
- `docs/roadmap.md`: business scope, value, and future direction
- `docs/architecture.md`: codebase explanation and technical design
- `docs/change-log.md`: versioned change history

## Quick Start

1. Install dependencies.
2. Build the project.
3. Configure the MCP server command in environment variables.
4. Run the CLI.

```bash
npm install
npm run build
export SWIGGY_MCP_COMMAND=node
export SWIGGY_MCP_ARGS="dist/dev/mock-swiggy-mcp.js"
node dist/index.js help
```

## Environment Configuration

Sensitive values are expected through environment variables. A full template is available in `.env.example`.

Important values:

- `SWIGGY_MCP_COMMAND`
- `SWIGGY_MCP_ARGS`
- `SLACK_APP_BASE_URL`
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_OAUTH_REDIRECT_URL`
- `TEAMS_APP_BASE_URL`
- `TEAMS_APP_ID`
- `TEAMS_APP_PASSWORD`
- `TEAMS_OAUTH_REDIRECT_URL`

## Local Development Utilities

The repository includes TypeScript-based local utilities:

- `npm run doctor`: validate local runtime configuration
- `npm run mock:mcp`: run a mock Swiggy MCP server

## Notes

- The current implementation is focused on Swiggy Food.
- Instamart and Dineout are intentionally outside the first delivery scope.
- Slack and Microsoft Teams integrations are scaffolded but not yet connected to live platform APIs.
