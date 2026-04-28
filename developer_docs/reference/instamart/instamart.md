# Instamart

Swiggy Instamart MCP Server - Your AI-powered grocery and essentials shopping assistant. Get everything from fresh fruits, vegetables, dairy, and staples to snacks, beverages, ...

Swiggy Instamart MCP Server - Your AI-powered grocery and essentials shopping assistant. Get everything from fresh fruits, vegetables, dairy, and staples to snacks, beverages, personal care, electronics, baby care, pet supplies, and more. Browse a wide variety of products across 50+ categories, enjoy great deals, manage your cart, and place orders with quick delivery right to your doorstep.

- Endpoint: POST `mcp.swiggy.com/im`

- Tools available: 13

## Tools by stage

### Discover

| Tool | Description |
| --- | --- |
| create_address | Swiggy (Instamart/Food): Create a new delivery address for the authenticated user. |
| delete_address | Swiggy (Instamart/Food): Delete a saved delivery address for the authenticated user. |
| get_addresses | Swiggy (Instamart/Food): Get all saved delivery addresses for the authenticated Swiggy user, sorted by last order date. This tool works for... |
| search_products | Search for products available at the selected address. Returns products with their variants (e.g., different pack sizes, quantities). When ... |
| your_go_to_items | Fetch the user's Your Go To Items (frequently or recently ordered items) for the selected delivery address. Use addressId from get_addresse... |

### Cart

| Tool | Description |
| --- | --- |
| clear_cart | Clear (remove all items from) the Instamart cart. Authentication is handled automatically. |
| get_cart | Swiggy Instamart (Grocery): Get current Swiggy Instamart grocery cart with all items and bill breakdown. Use this for Instamart grocery ord... |
| update_cart | Swiggy Instamart (Grocery): Update Swiggy Instamart grocery cart with items. Replaces entire cart with the provided items. Use this for Ins... |

### Order

| Tool | Description |
| --- | --- |
| checkout | Swiggy Instamart (Grocery): Place and confirm Swiggy Instamart grocery order. Creates order and confirms payment in a single operation. Use... |

### Track

| Tool | Description |
| --- | --- |
| get_order_details | Get detailed information for a specific Swiggy Instamart order by order ID. Use this when the user wants to see complete details about a sp... |
| get_orders | Swiggy Instamart order history - Use this to fetch ORDER HISTORY, past orders, or order preferences. Use this FIRST when user asks: "show m... |
| track_order | Track Swiggy Instamart order status in real-time. PRIMARY TOOL for order tracking - Use this FIRST when user asks: "where is my order", "tr... |

### Support

| Tool | Description |
| --- | --- |
| report_error | Generate an error report to share with the Swiggy MCP team. Use this when the user encounters an error and wants to report it. Returns a pr... |

## Related

- Authenticate

- Error codes

- Quickstart
