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
