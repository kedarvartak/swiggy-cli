# get_cart

Swiggy Instamart (Grocery): Get current Swiggy Instamart grocery cart with all items and bill breakdown. Use this for Instamart grocery orders, NOT for Food delivery. Authentication is handled automa...

Swiggy Instamart (Grocery): Get current Swiggy Instamart grocery cart with all items and bill breakdown. Use this for Instamart grocery orders, NOT for Food delivery. Authentication is handled automatically.

## Demo

▶

See get_cart in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "get_cart",

arguments: {},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |

Session credentials (user identity, access token) are supplied automatically by the authenticated MCP session - you do not pass them in the tool call. See Authenticate.

## Response

All Swiggy MCP tools return:

```json
{

"success": true,

"data": { /* tool-specific payload */ },

"message": "optional human-readable message"

}
```

On failure:

```json
{

"success": false,

"error": { "message": "description of what went wrong" }

}
```

See Error codes for the full catalogue.

## Details

| Field | Value |
| --- | --- |
| Name | get_cart |
| MCP Server | Instamart |
| Endpoint | POST mcp.swiggy.com/im |
| Stage | Cart |
| Behaviour | read-only |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

PAYMENT METHODS: The response includes an "availablePaymentMethods" array in data. Display whatever payment method(s) are returned to the user before placing the order. Do not mention or assume any payment option that is not in the response.
