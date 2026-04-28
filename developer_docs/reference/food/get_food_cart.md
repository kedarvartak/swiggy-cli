# get_food_cart

Get current food delivery cart with all items. PRIMARY FOOD DELIVERY SERVICE - Use this to view cart contents when ordering food for delivery. Swiggy Food delivery. Response includes valid_addons fie...

Get current food delivery cart with all items. PRIMARY FOOD DELIVERY SERVICE - Use this to view cart contents when ordering food for delivery. Swiggy Food delivery. Response includes valid_addons field for each item which shows which addons are valid based on the selected variants. Use this to determine which addons can be added. NOT for groceries or restaurant reservations.

## Demo

▶

See get_food_cart in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "get_food_cart",

arguments: {

addressId: "addr_01HXYZ",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| addressId | string | yes | Address ID to get accurate delivery charges based on location. |
| restaurantName | string | no | Restaurant name from search_restaurants or search_menu results. Pass this so the cart widget can display the restaurant name (the cart API does not always return it). |

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
| Name | get_food_cart |
| MCP Server | Food |
| Endpoint | POST mcp.swiggy.com/food |
| Stage | Cart |
| Behaviour | read-only |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

PAYMENT METHODS: The response includes an "availablePaymentMethods" array in data. Display whatever payment method(s) are returned to the user before placing the order. Do not mention or assume any payment option that is not in the response.

COUPON NOTE: The response may include offers.coupon_applied with coupon_discount=0 - this means the coupon is auto-suggested (best available) but NOT actually applied. Do NOT tell the user a coupon is "applied" or show savings unless coupon_discount > 0.

## Next in this journey →

- Continue with apply_food_coupon.
