get_food_order_details
Get detailed information about a specific food delivery order. PRIMARY FOOD DELIVERY SERVICE - Use this when user asks about order details, order information, or wants to see what they ordered. Swigg...

Get detailed information about a specific food delivery order. PRIMARY FOOD DELIVERY SERVICE - Use this when user asks about order details, order information, or wants to see what they ordered. Swiggy Food delivery. Returns comprehensive order details including items, variants, pricing breakdown, delivery address, payment info, and order status.

▶
See get_food_order_details in action
Coming soon
Example
TypeScript
Python
curl
const result = await client.callTool({
  name: "get_food_order_details",
  arguments: {
    orderId: "ord_42",
  },
});
Parameters
Parameter	Type	Required	Description
orderId	string	yes	Order ID to fetch details for (can be obtained from get_food_orders)
Session credentials (user identity, access token) are supplied automatically by the authenticated MCP session - you do not pass them in the tool call. See Authenticate.

Response
All Swiggy MCP tools return:

{
  "success": true,
  "data": { /* tool-specific payload */ },
  "message": "optional human-readable message"
}
On failure:

{
  "success": false,
  "error": { "message": "description of what went wrong" }
}
See Error codes for the full catalogue.

Details
Field	Value
Name	get_food_order_details
MCP Server	Food
Endpoint	POST mcp.swiggy.com/food
Stage	Track
Behaviour	read-only
← Previous
place_food_order
Next →
get_food_orders