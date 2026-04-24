# Architecture

## Objective

Build a production-oriented CLI that can talk to an existing Swiggy MCP server over standard input/output, without embedding platform-specific assumptions directly into the command layer.

## Scope for Version 0.1

The current implementation targets the Swiggy Food toolset shown in the provided references:

- `search_restaurants`
- `get_restaurant_menu`
- `update_food_cart`
- `get_food_cart`
- `place_food_order`
- `track_food_order`

Instamart and Dineout are intentionally excluded from the initial CLI implementation.

## Components

### TypeScript CLI

Located in `src/`.

- `index.ts`: entry point and lifecycle management
- `parser.ts`: lightweight command-line argument parsing
- `config.ts`: environment-driven MCP configuration
- `mcp-client.ts`: JSON-RPC over stdio implementation
- `commands.ts`: command-to-tool mapping for Swiggy Food flows
- `render.ts`: terminal output formatting
- `group-ordering/`: shared planning model for Slack and Microsoft Teams integrations

### Python Support Layer

Located in `python/`.

- `doctor.py`: validates local MCP command configuration
- `mock_swiggy_mcp.py`: local mock MCP server for integration testing and demos

## Integration Model

The CLI assumes an external MCP server process is available and can be started with:

`SWIGGY_MCP_COMMAND="<command>"`

Optional arguments can be supplied through:

`SWIGGY_MCP_ARGS="<arg1> <arg2> ..."`

This keeps the CLI portable across local development, containers, CI, and future agent workflows.

## Group Ordering Foundation

The first implementation slice for Group Ordering is intentionally platform-agnostic at the core:

- shared request and workflow types describe the team order lifecycle
- platform profiles define what Slack and Microsoft Teams can support
- the planner converts a collaboration request into a Swiggy MCP execution sequence

### Slack Capabilities

- Launch a group-order flow from a channel
- Collect responses through interactive blocks
- Send direct-message reminders to non-responders
- Run lightweight restaurant voting in threads
- Share confirmation and live order-status updates back to the channel

### Microsoft Teams Capabilities

- Launch a group-order flow from a Teams channel
- Collect structured submissions through adaptive cards
- Send direct reminder messages to pending participants
- Present review and approval states with card updates
- Share final order confirmation and delivery tracking updates

### Current Boundary

This repository now models the orchestration layer and capability matrix for Group Ordering, but it does not yet include live Slack or Microsoft Teams API adapters. Those adapters will be added on top of the shared planning layer.
