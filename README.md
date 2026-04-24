# Swiggy CLI

Swiggy CLI is a TypeScript command-line application for interacting with an existing Swiggy MCP server. The first release is focused on the Swiggy Food flow: restaurant discovery, menu lookup, cart operations, order placement, and order tracking.

The repository also includes a small Python support layer for local validation and mock-server development.

## Current Scope

Implemented now:

- Swiggy Food MCP integration over stdio
- Tool discovery
- Restaurant search
- Restaurant menu retrieval
- Cart view and update
- Order placement
- Order tracking
- Group Ordering foundation with Slack and Microsoft Teams capability modeling

Tracked for later:

- Group Ordering
- Dietary Planner
- Voice Agent

## Project Layout

```text
.
├── README.md
├── docs
│   ├── architecture.md
│   └── roadmap.md
├── package.json
├── python
│   ├── doctor.py
│   └── mock_swiggy_mcp.py
├── src
│   ├── commands.ts
│   ├── config.ts
│   ├── index.ts
│   ├── mcp-client.ts
│   ├── parser.ts
│   ├── render.ts
│   └── types.ts
└── tsconfig.json
```

## Requirements

- Python 3.11 or newer
- Node.js 20 or newer
- A Swiggy MCP server executable that supports the Swiggy Food tools

## Configuration

Set the command that starts the Swiggy MCP server:

```bash
export SWIGGY_MCP_COMMAND="python3"
export SWIGGY_MCP_ARGS="python/mock_swiggy_mcp.py"
```

Replace the example above with the real Swiggy MCP server command when available.

## Installation

```bash
npm install
npm run build
```

## Usage

List supported CLI commands:

```bash
node dist/index.js help
```

List tools exposed by the MCP server:

```bash
node dist/index.js tools
```

Search restaurants:

```bash
node dist/index.js restaurants --query "biryani" --city bangalore
```

Fetch a restaurant menu:

```bash
node dist/index.js menu --restaurant-id rest-101
```

Update the cart:

```bash
node dist/index.js cart:update --payload '{"restaurant_id":"rest-101","items":[{"id":"dish-1","quantity":2}]}'
```

View the cart:

```bash
node dist/index.js cart:view
```

Place an order:

```bash
node dist/index.js order:place --payload '{"payment_mode":"cod"}'
```

Track an order:

```bash
node dist/index.js order:track --order-id order-demo-1001
```

Call any MCP tool directly:

```bash
node dist/index.js raw:call --tool search_restaurants --payload '{"query":"biryani"}'
```

Inspect Group Ordering platform capabilities:

```bash
node dist/index.js group-ordering:capabilities
```

Create a Group Ordering execution plan:

```bash
node dist/index.js group-ordering:plan --payload '{"teamName":"Product","organizer":"kedar","platform":"slack","restaurantQuery":"biryani","participants":[{"userId":"u1","displayName":"Asha"}]}'
```

## Python Utilities

Validate local MCP configuration:

```bash
python3 python/doctor.py
```

Run the local mock MCP server:

```bash
python3 python/mock_swiggy_mcp.py
```

## Notes

- This repository currently ships source code and documentation only. The local environment used for scaffolding did not have Node.js or npm installed.
- The mock server exists so the CLI can be wired and documented before the production MCP endpoint is connected.
- Instamart and Dineout are excluded from the first implementation by design.
