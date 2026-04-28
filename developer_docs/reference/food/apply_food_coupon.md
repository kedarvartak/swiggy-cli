# apply_food_coupon

Apply coupon code or discount to food delivery order. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to apply a coupon, discount code, or offer to their food delivery order. Swiggy Food del...

Apply coupon code or discount to food delivery order. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to apply a coupon, discount code, or offer to their food delivery order. Swiggy Food delivery. Returns the updated cart with coupon applied, including new pricing, discounts, and savings information. Requires coupon code and address ID (coordinates are fetched automatically).

## Demo

▶

See apply_food_coupon in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "apply_food_coupon",

arguments: {

couponCode: "WELCOME20",

addressId: "addr_01HXYZ",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| couponCode | string | yes | Coupon code to apply |
| addressId | string | yes | Address ID where the order will be delivered (coordinates will be fetched automatically) |
| cartId | string | no | Optional cart ID |

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
| Name | apply_food_coupon |
| MCP Server | Food |
| Endpoint | POST mcp.swiggy.com/food |
| Stage | Cart |
| Behaviour | mutating |

## Next in this journey →

- Continue with place_food_order.
