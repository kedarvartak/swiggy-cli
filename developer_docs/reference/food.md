# Food

Swiggy Food MCP Server - Your AI-powered food delivery assistant. Discover restaurants, explore menus, customize your order with variants and add-ons, apply coupons for great discounts, and get delic...

Swiggy Food MCP Server - Your AI-powered food delivery assistant. Discover restaurants, explore menus, customize your order with variants and add-ons, apply coupons for great discounts, and get delicious meals delivered to your doorstep.

Endpoint: POST `mcp.swiggy.com/food`

Tools available: 14

## Tools by stage

### Discover

| Tool | Description |
| --- | --- |
| get_addresses | Swiggy (Instamart/Food): Get all saved delivery addresses for the authenticated Swiggy user, sorted by last order date. This tool works for... |
| get_restaurant_menu | Get the complete menu of a restaurant, paginated by category. Use this to BROWSE a restaurant menu and see what is available. This is the P... |
| search_menu | Search for dishes and menu items to order for food delivery. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to find specific dish... |
| search_restaurants | Search and order food from restaurants for delivery. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to order food, get food deliv... |

### Cart

| Tool | Description |
| --- | --- |
| apply_food_coupon | Apply coupon code or discount to food delivery order. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to apply a coupon, discount ... |
| fetch_food_coupons | Get available coupons and offers for food delivery order. PRIMARY FOOD DELIVERY SERVICE - Use this to find discounts, coupons, or offers wh... |
| flush_food_cart | Clear or empty the food delivery cart. PRIMARY FOOD DELIVERY SERVICE - Use this to remove all items from the food delivery cart. Swiggy Foo... |
| get_food_cart | Get current food delivery cart with all items. PRIMARY FOOD DELIVERY SERVICE - Use this to view cart contents when ordering food for delive... |
| update_food_cart | Add items to food delivery cart or update cart contents. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to add food items, dishes... |

### Order

| Tool | Description |
| --- | --- |
| place_food_order | Place food delivery order and confirm order placement. PRIMARY FOOD DELIVERY SERVICE - Use this when user wants to place order, confirm ord... |

### Track

| Tool | Description |
| --- | --- |
| get_food_order_details | Get detailed information about a specific food delivery order. PRIMARY FOOD DELIVERY SERVICE - Use this when user asks about order details,... |
| get_food_orders | Get active food delivery orders and order status. PRIMARY FOOD DELIVERY SERVICE - Use this when user asks about their orders, order status,... |
| track_food_order | Track food delivery order status and delivery progress. PRIMARY FOOD DELIVERY SERVICE - Use this when user asks to track order, check deliv... |

### Support

| Tool | Description |
| --- | --- |
| report_error | Generate an error report to share with the Swiggy MCP team. Use this when the user encounters an error and wants to report it. Returns a pr... |
