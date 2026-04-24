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
- Group Ordering integration scaffolding for Slack and Microsoft Teams custom apps

Tracked for later:

- Group Ordering
- Dietary Planner
- Voice Agent

## Project Layout

```text
.
├── .env.example
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
│   ├── group-ordering
│   │   ├── adapters.ts
│   │   ├── config.ts
│   │   ├── planner.ts
│   │   ├── platforms.ts
│   │   └── types.ts
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

For Group Ordering custom app integrations, place sensitive Slack and Microsoft Teams values in environment variables. A complete template is included in `.env.example`.

Important Group Ordering environment values:

- `SLACK_APP_BASE_URL`: public base URL for your Slack integration
- `SLACK_BOT_TOKEN`: Slack bot token used to post messages and updates
- `SLACK_SIGNING_SECRET`: secret used to verify Slack requests
- `SLACK_OAUTH_REDIRECT_URL`: redirect URL configured in the Slack app
- `TEAMS_APP_BASE_URL`: public base URL for your Teams bot or API
- `TEAMS_APP_ID`: Teams or Azure app identifier
- `TEAMS_APP_PASSWORD`: Teams bot secret
- `TEAMS_BOT_ENDPOINT_PATH`: bot message endpoint path under the base URL
- `TEAMS_OAUTH_REDIRECT_URL`: redirect URL configured for Teams or Azure app auth

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

Inspect whether Slack and Teams integrations are configured:

```bash
node dist/index.js group-ordering:integration-status
```

Preview the platform-specific launch payload for a custom app:

```bash
node dist/index.js group-ordering:preview --payload '{"teamName":"Product","organizer":"kedar","platform":"slack","restaurantQuery":"biryani","participants":[{"userId":"u1","displayName":"Asha"}]}'
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

- The mock server exists so the CLI can be wired and documented before the production MCP endpoint is connected.
- Instamart and Dineout are excluded from the first implementation by design.
