# Coach API Contract

## `GET /api/health`

Returns `200 { "status": "ok" }` from the separate loopback backend without
calling a provider. Vite proxies this route in development and preview; it
serves as the frontend/backend split check.

## `POST /api/ai/coach`

Same-origin browser request to the project backend. JSON request body follows
[`CoachRequest`](../data-model.md#coachrequest); the entire game session is
never accepted or forwarded.

### Request checks

- `Content-Type: application/json`; bounded body (maximum 64 KiB).
- Only the three documented top-level fields and the six documented fields
  per drop are accepted; extra private text is rejected before provider use.
- Exact route and `POST` method; unsupported methods receive a safe 405.
- `finalScore` is integer 0..500; `startingWidth` is finite and positive.
- `drops` has 1..501 records; floors are sequential from 1, numbers are finite,
  widths are possible/non-negative, and at most one zero-width terminal miss
  can occur as the final record.
- Number of positive-width drops equals `finalScore`; no successful drops
  follow a miss.
- The first `widthBefore` equals `startingWidth`; each subsequent
  `widthBefore` equals the preceding successful `widthAfter`; successful
  resulting width is consistent with the recorded center offset. Only the
  final record may have `widthAfter: 0`; a zero-offset drop cannot be a miss.
- Direction is `-1` or `1`; timing is recomputed from offset/direction and
  the 1-pixel centered tolerance.
- Invalid requests are rejected before calling the provider. No request data,
  prompt, provider response body, or secret is logged.

### Success

`200 application/json`

```json
{
  "success": true,
  "advice": {
    "headline": "Usmeri blok malo ranije",
    "timingBias": "late",
    "biggestMistakeFloor": 4,
    "tip": "Pusti blok pre nego što njegov centar pređe centar tornja."
  }
}
```

The exact `CoachAdvice` shape is runtime-validated, including trimmed,
non-empty string lengths, enum membership, an integer width-loss floor from
1 through `finalScore + 1`, and semantic match to server-derived facts.
`null` is invalid. The biggest width-loss floor includes the terminal miss
when its loss is greatest.

### Safe failure

Non-success status with a stable public message; never provider diagnostics.

```json
{
  "success": false,
  "message": "AI analiza trenutno nije dostupna."
}
```

Malformed/oversized requests are `400`/`413`; unavailable, timed-out, or
malformed provider responses use a safe `503` response. The browser can still
restart and play. No provider detail, stack trace, or secret is returned.

## Provider seam

Server coach logic receives a provider interface that accepts only
server-derived `RunStatistics` and returns unknown structured content for
runtime validation. Nemanja's implementation and tests use a deterministic
fake provider only. Milica adds live Gemini wiring; key configuration is
server-only and the browser never calls Gemini.

## Request lifecycle

- External provider deadline: 10 seconds total, with at most one retry for
  transient network/429/5xx failures and a short backoff included in deadline.
- No retries for invalid input or deterministic malformed output.
- Client-visible total wait bound: 12 seconds; timeout maps to safe failure.
- No persistence, authentication, CORS allowance, or broad network binding.
