# Developer quickstart

Zero to first successful Swiggy tool call, self-serve.

This is the self-serve path. You'll ship working agent code that calls a Swiggy MCP tool against a staging endpoint. You will move through account access, framework install, OAuth, and a first tool call.

You'll need approved credentials before you can hit production endpoints. Apply at /access; fill out the form while you work through step 1.

## 1. Understand what you're building

Every Swiggy MCP tool call goes through the same loop:

- Your agent picks a tool from the server's catalogue (e.g. search_restaurants).
- The MCP client in your agent framework sends a JSON-RPC call to mcp.swiggy.com/{server}.
- The server authenticates the session, runs the tool, returns { success, data }.
- Your agent reads the result and decides what to call next.

Three servers, independent per URL: Food (/food), Instamart (/im), Dineout (/dineout).

## 2. Request access

Production is whitelist-only today. You can prototype on http://localhost before applying - record a short video of your agent flow working end-to-end and include the link with your application; it dramatically speeds up review.

Apply at /access with:

- Integration name and organization
- Redirect URIs for OAuth (exact-match, HTTPS - http://localhost allowed for dev)
- Which servers you need - any of food, instamart, dineout (access is bound to your client_id's server allowlist; v1 scopes are mcp:tools, mcp:resources, mcp:prompts)
- Expected volume and use case
- A demo video link (Loom, Drive, YouTube unlisted) - or email it to builders@swiggy.in

You'll get a client_id and staging credentials. See Access for the full flow.

## 3. Pick a framework

Any MCP-compatible framework works. Pick what you already use; if you're starting fresh, OpenAI Agents SDK and Vercel AI SDK have the lowest-friction MCP story in 2026.

Supported frameworks (recipes in Build an agent):

- OpenAI Agents SDK (TypeScript + Python)
- Anthropic SDK - native MCP connector
- LangGraph / LangChain (via langchain-mcp-adapters)
- Vercel AI SDK 6 (experimental_createMCPClient)
- Mastra, PydanticAI, CrewAI, Google ADK
- Raw MCP client (@modelcontextprotocol/sdk or mcp Python package)

## 4. Complete OAuth

OAuth 2.1 with PKCE. See Authenticate for the full endpoint walkthrough. Most frameworks handle this for you - you paste the auth URL into your config, a browser window opens for phone + OTP, and you're back.

## 5. Make your first tool call

Follow the framework recipe at Build an agent. The minimal first call:

```ts
const result = await client.callTool({
  name: "get_addresses",
  arguments: {},
});
```

If you see a user's saved addresses, you're wired up. Now try search_restaurants with an addressId from that response. From there, the world is yours.

## 6. Build something real

Pick a recipe:

- Order food end-to-end - 7 tools, full journey, COD payment.
- Order groceries end-to-end - Instamart cart + checkout.
- Book a table - Dineout availability + reservation.
- Combined: plan my evening - food + dineout in one agent turn.
