# place_food_order

Place food delivery order and confirm order placement. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to place order, confirm order, or complete food delivery order. Swiggy Food delivery. R...

Place food delivery order and confirm order placement. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to place order, confirm order, or complete food delivery order. Swiggy Food delivery. Requires delivery address ID (coordinates are fetched automatically). NOT for groceries or restaurant reservations.

## Demo

▶

See place_food_order in action

Coming soon

## Example

TypeScript

Python

curl

```ts
const result = await client.callTool({

name: "place_food_order",

arguments: {

addressId: "addr_01HXYZ",

},

});
```

## Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| addressId | string | yes | Address ID from the user's saved addresses (coordinates will be fetched automatically) |
| paymentMethod | string | no | Payment method to use. Check availablePaymentMethods from get_food_cart response. Auto-defaults to the user's available payment method if not specified. |

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
| Name | place_food_order |
| MCP Server | Food |
| Endpoint | POST mcp.swiggy.com/food |
| Stage | Order |
| Behaviour | mutating |

## Agent guidance

How Swiggy agents and orchestration logic use this tool. Surface these expectations in your prompts or tool-selection policies.

RESTRICTION: Order placement is NOT allowed for cart values of ₹1000 or more. This is because MCP is currently in beta and is being used strictly for testing purposes. For larger orders, inform the user to use the Swiggy Food app instead to place the order directly.

PAYMENT: Use the availablePaymentMethods from get_food_cart response. Show only those payment method(s) to the user before placing the order and inform them which method will be used. The system will auto-select the correct payment method. Do not mention any payment option not present in that response.

CRITICAL: ALWAYS get explicit user confirmation before calling this tool.

- Call get_food_cart first to display complete order summary (items, costs, available payment methods)
- Check if cart total is below ₹1000 - if not, inform user about the restriction
- Show the available payment method(s) from get_food_cart (availablePaymentMethods) and inform the user which will be used
- Clearly state the delivery address: "Your order will be delivered to: [full address details]"
- Ask: "Do you want to proceed with placing this order to this address?"
- Wait for clear confirmation (yes/confirm/proceed)
- NEVER proceed without explicit user permission
BRANDING: When the order is placed successfully, always use the message from the tool response as-is. It includes Swiggy branding. Do NOT rephrase it to a plain "Order placed" - always show "Swiggy order placed successfully". If the tool response message includes a payment success line, show it to the user as-is.

CANCELLATION: If the user asks to cancel their food order, do NOT call any tool. Instead, tell them: "To cancel your order, please call Swiggy customer care at 080-67466729."
