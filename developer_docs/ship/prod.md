# Ship to production

Retries, observability, and the go-live checklist.

You've built it. Before flipping production traffic on, here's the punch list.

## Errors and retries

### Idempotency by tool class

| Class | Examples | Safe to retry on failure? |
| --- | --- | --- |
| Pure reads | get_addresses, search_restaurants, get_order_details | Always |
| Cart mutations | update_cart, update_food_cart, clear_cart, flush_food_cart | Yes - server is idempotent on session; retrying the same args won't double-add |
| Order placement | place_food_order, checkout, book_table | No, not by default - see below |
| Coupon application | apply_food_coupon | Yes |
| Tracking | track_order, track_food_order, get_booking_status | Always |

### Order placement (non-idempotent)

place_food_order, checkout, and book_table are not safe to blind-retry on network failure. Instead:

- On 5xx or network error, wait 2-5 seconds.
- Call get_food_orders / get_orders / get_booking_status to check if the order actually went through.
- If yes, treat the original failure as success.
- If no, retry the original call.

A future Idempotency-Key header will close this gap; the check-then-retry pattern works today.

### Exponential backoff

For retriable failures (generic 5xx and upstream timeouts / errors - symbolic codes UPSTREAM_TIMEOUT / UPSTREAM_ERROR / INTERNAL_ERROR ship once the error-code registry is live):

```ts
async function retry<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e: any) {
      attempt++;
      if (attempt >= maxAttempts) throw e;
      if (!isRetryable(e)) throw e;
      const baseMs = 500 * 2 ** (attempt - 1); // 500, 1000, 2000, 4000
      const jitterMs = Math.random() * baseMs * 0.3;
      await new Promise((r) => setTimeout(r, baseMs + jitterMs));
    }
  }
}

function isRetryable(e: any) {
  const status = e?.status ?? e?.response?.status;
  if (status && status >= 500 && status < 600) return true;
  const code = e?.body?.error?.code;
  return ["UPSTREAM_TIMEOUT", "UPSTREAM_ERROR", "INTERNAL_ERROR"].includes(code);
}
```

### Rate-limited (planned: 429)

MCP-layer rate limiting is not enforced in v1.0 - you will not see 429 Too Many Requests from a Swiggy MCP endpoint today (see rate-limits). Wire the handler so you're ready when v1.1 ships it:

```ts
if (response.status === 429) {
  const seconds = Number(response.headers.get("Retry-After") ?? 30);
  await new Promise((r) => setTimeout(r, seconds * 1000));
  return retry();
}
```

Once the header ships, always honour Retry-After - don't stack it on top of exponential backoff.

### Auth failures (401)

Re-run the OAuth flow. Never retry with the same token. Auth errors also surface via JSON-RPC -32001 at the transport layer.

```ts
if (response.status === 401) {
  await reAuthenticate();
  return retry();
}
```

### Retry budget

For user-facing flows: cap total retries at 30 seconds of wall-clock time. Beyond that, fail loudly and let the user decide.

## Observability

### The session id is your friend

Every tool call is tagged with a session id that flows across Swiggy's services. On your side, log it. When you file a support ticket, include the session id of the failing call - we can trace the full request path end-to-end in seconds.

### Recommended client-side log shape

```json
{
  "ts": "2026-04-17T10:00:00Z",
  "level": "info",
  "event": "mcp_tool_call",
  "client_id": "your_client_id",
  "tool": "search_restaurants",
  "user_id_hash": "sha256:...",
  "session_id": "...",
  "duration_ms": 217,
  "status": "ok"
}
```

Hash user IDs at rest unless you have a specific DPDP-compliant reason to store them plaintext. See data-and-compliance.

### Metrics to track client-side

| Metric | Why |
| --- | --- |
| Tool call latency (p50, p95, p99) | Surface regressions before users notice |
| Tool call success rate | Catches partial outages |
| 4xx / 5xx rate | Separates client bugs from server bugs |
| OAuth refresh frequency | Unusually high = token-management bug |

### OpenTelemetry

If your platform supports OpenTelemetry, instrument every callTool with a span. Tag with the session id. When you cross-reference with Swiggy support, we'll be on the same timeline.

## What Swiggy exposes

- status.swiggy.com/mcp - public status page (shipping in v1.1).
- Incident comms via email to your designated engineering contact.
- Per-partner usage dashboards for enterprise integrators.

## What's not available

- Raw server logs (security / privacy).
- Infra dashboards.
- User-level audit logs (only on lawful request - see data-and-compliance).

## Go-live checklist

Before your first real-user traffic:

- Credentials: production client_id issued, staging has been green for ≥ 48 hours.
- Redirect URIs: every URL your OAuth flow might redirect to is allowlisted (exact-match).
- Server allowlist: your client_id is approved only for the Swiggy MCP servers you actually call (food, instamart, dineout); v1 scopes (mcp:tools/mcp:resources/mcp:prompts) are requested uniformly.
- Error handling: retry logic per this page is in place; auth failures (401 / JSON-RPC -32001) and upstream timeouts each have an explicit branch.
- Idempotency guards: order-placement paths do check-then-retry, not blind retry.
- Cart confirmation: no order is placed without user-visible confirmation of items + total.
- Rate limits: you've benchmarked your expected QPS and confirmed you're under the ceiling (rate-limits).
- Observability: session id logged on every call; metrics exported to your usual observability stack.
- Deprecation monitoring: alerting set up on the _meta.swiggy.deprecation field so you won't miss a breaking change.
- Incident contact: Swiggy has an email + Slack channel to reach your on-call for S0/S1.
- Data handling: your product's data retention, deletion, and consent flows align with data-and-compliance.
- Voice vs chat: if you have a voice surface, your prompts are shaped per voice-vs-chat.
- Support runbook: you've written an internal runbook for "what do we do when Swiggy returns X".
- Rollout: traffic ramps 1% → 10% → 50% → 100% over at least 24 hours so any regression is caught early.

## When to escalate

If production traffic is failing and you've already:

- Verified tokens are fresh and scopes match.
- Confirmed you're hitting the right endpoints.
- Seen a sudden error-rate spike on Swiggy's side (not yours).

...mail builders@swiggy.in with the failing session ids and timestamps. Enterprise partners use their designated engineering contact + SEV channel.
