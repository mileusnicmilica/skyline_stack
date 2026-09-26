# Data Model: AI Crane Coach

## DropRecord

One resolved release attempt, created once in `resolveLanding`.

| Field | Type | Meaning / validation |
|---|---|---|
| `floor` | integer | 1-based release order; sequential within one run |
| `offsetPx` | finite number | active block center minus support center at release/contact |
| `direction` | `-1 \| 1` | horizontal travel direction at release |
| `timing` | `early \| late \| centered` | Derived from `offsetPx * direction`; centered within the configured 1-world-pixel tolerance |
| `widthBefore` | finite positive number | Active width before overlap resolution |
| `widthAfter` | finite number >= 0 | Remaining overlap width; zero only for the terminal miss |

The record includes the direction so the backend can independently verify the
timing classification. A successful record has positive `widthAfter`; a
missed terminal record has `widthAfter: 0` and is the final record. Game score
equals the count of successful records. Restart creates a new empty history.
The request validator requires the first `widthBefore` to equal `startingWidth`
and every later `widthBefore` to equal the preceding successful record's
`widthAfter`. Successful resulting width must be geometrically possible for
the recorded center offset; only a terminal miss may resolve to zero width.

## CoachRequest

```ts
type CoachRequest = {
  finalScore: number;       // integer, 0..500
  startingWidth: number;    // finite positive number
  drops: DropRecord[];      // 1..501, ordered and internally consistent
};
```

The client sends only these fields, not the `GameSession`, canvas, debris,
configuration, or animation state. A 501-record request is permitted only for
500 successes followed by the final miss; an oversized request is rejected,
never truncated.

## RunStatistics (server-derived)

```ts
type RunStatistics = {
  finalScore: number;
  startingWidth: number;
  centeredCount: number;
  earlyCount: number;
  lateCount: number;
  centeredPercent: number;
  earlyPercent: number;
  latePercent: number;
  averageAbsoluteOffsetPx: number;
  timingBias: "early" | "late" | "mixed" | "consistent";
  biggestMistakeFloor: number;
  maxWidthLossPx: number;
};
```

Derived `timingBias`: `consistent` if at least 70% of all records are
centered; otherwise `early` or `late` if that timing is at least 60% of
non-centered records; otherwise `mixed`. Zero non-centered records yields
`consistent`. The biggest mistake is the drop with greatest
`widthBefore - widthAfter`, including the terminal miss; ties choose the
earliest floor. Every accepted completed run has a terminal miss with a
positive width loss, so the floor is always an integer from 1 through
`finalScore + 1`.

## CoachAdvice

```ts
type CoachAdvice = {
  headline: string; // non-empty, <= 80 characters
  timingBias: "early" | "late" | "mixed" | "consistent";
  biggestMistakeFloor: number;
  tip: string; // non-empty, <= 200 characters
};
```

The server validates shape and lengths, then requires `timingBias` to equal
the derived bias and `biggestMistakeFloor` to equal the derived floor. Only a
validated public advice object is returned to the browser.
