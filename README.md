# Swiggy CLI

Swiggy CLI is a TypeScript repository for a terminal-based Swiggy workflow layer. It connects to an MCP server over stdio, provides a command-line interface for Swiggy Food operations, and includes early scaffolding for Group Ordering across Slack and Microsoft Teams.

## What Is In This Repo

- `src/` contains the TypeScript CLI, MCP client, Group Ordering logic, and local development helpers.
- `docs/` contains the written guide to the repository, including architecture, roadmap, and change history.
- `.env.example` lists the environment variables used by the CLI and Group Ordering integrations.
- `dist/` is the build output created after `npm run build`.

## Quick View

The repository is organized around a simple flow:

1. `src/index.ts` starts the CLI.
2. `src/commands.ts` routes each command to either local logic or the MCP client.
3. `src/mcp-client.ts` talks to the external Swiggy MCP server.
4. `src/group-ordering/` holds the Group Ordering planning and platform scaffolding.
5. `src/dev/` holds local utilities for validation and mock MCP development.

## Documentation

- `docs/architecture.md` explains the codebase structure and data flow.
- `docs/roadmap.md` explains the business direction and future scope.
- `docs/change-log.md` records versioned changes in the repository.

## Setup

```bash
npm install
npm run build
export SWIGGY_MCP_COMMAND=node
export SWIGGY_MCP_ARGS="dist/dev/mock-swiggy-mcp.js"
export SWIGGY_MCP_COMMAND=node
export SWIGGY_MCP_ARGS="dist/dev/mock-swiggy-mcp.js"
node dist/index.js help
```

## Environment

The repository uses environment variables for runtime configuration and integration secrets. The full set of example values is in `.env.example`.

Important variables:

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

## Local Utilities

- `npm run doctor` checks local configuration.
- `npm run mock:mcp` starts the mock MCP server.

## Current Focus

- Swiggy Food MCP connectivity
- Tool discovery and food ordering flow
- Group Ordering planning and platform scaffolding
- TypeScript-only codebase and local utilities
