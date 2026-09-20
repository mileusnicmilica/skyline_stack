# Contract: Deterministic Gameplay Rules

## Horizontal movement

- Movement updates only an active block in `moving` motion while phase is
  `playing`.
- The updated horizontal interval remains within `[0, canvasWidth]`.
- Contact with either horizontal edge clamps to the edge and reverses direction.

## Drop acceptance

A drop request is accepted only when:

1. session phase is `playing`;
2. active motion is `moving`;
3. the request is not a repeated keydown from holding Space.

An accepted request changes motion to `falling` once. Click and tap use the
same request boundary as Space.

## Overlap

For active interval `[active.x, active.x + active.width]` and support interval
`[support.x, support.x + support.width]`:

```text
overlapLeft  = max(active.x, support.x)
overlapRight = min(active.x + active.width, support.x + support.width)
overlap      = max(0, overlapRight - overlapLeft)
```

- If `overlap >= minOverlap`, placement succeeds at `overlapLeft` with width
  `overlap`.
- If `overlap < minOverlap`, placement fails.
- Exact equality is successful.

## Successful placement

One resolution must:

1. append only the trimmed overlap as a placed block;
2. increase score by exactly one;
3. optionally rebase the viewport without changing relative overlap;
4. spawn exactly one moving active block with the placed width;
5. reset per-block drop acceptance.

## Failed placement

One resolution must:

1. keep score unchanged;
2. set phase to `gameOver`;
3. freeze the missed active block;
4. ignore later drop requests;
5. preserve visible final score and tower.

## Restart

R or Restart is accepted only in `gameOver` and returns the same observable
state as a fresh session: score 0, Ready status, one base, one moving active
block of starting width, initial direction, and cleared transient input.

