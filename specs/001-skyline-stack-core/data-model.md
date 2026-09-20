# Data Model: Skyline Stack Core

## GameConfig

Required numeric values:

| Field | Meaning | Validation |
| --- | --- | --- |
| `canvasWidth` | Logical play-area width | finite number greater than 0 |
| `canvasHeight` | Logical play-area height | finite number greater than 0 |
| `startingBlockWidth` | Base and first active width | greater than 0 and no wider than canvas |
| `blockHeight` | Shared block height | greater than 0 and smaller than canvas height |
| `moveSpeed` | Horizontal units per second | finite number greater than 0 |
| `fallSpeed` | Vertical units per second | finite number greater than 0 |
| `minOverlap` | Smallest successful overlap | greater than 0 and no wider than starting block |

The validator accepts `unknown`, requires an object with all seven own fields,
rejects `NaN` and both infinities, and applies the relationships above. A
single invalid condition rejects the whole candidate.

Known default:

```text
canvasWidth: 480
canvasHeight: 640
startingBlockWidth: 200
blockHeight: 28
moveSpeed: 180
fallSpeed: 520
minOverlap: 8
```

## Block

| Field | Type | Rule |
| --- | --- | --- |
| `x` | number | left edge in logical canvas units |
| `y` | number | top edge in logical canvas units |
| `width` | number | positive; active width never exceeds support width after success |
| `height` | number | equals selected `blockHeight` |
| `role` | base, placed, active | exactly one active block object exists |
| `motion` | stationary, moving, falling, missed | active-only transition state |

## GameSession

| Field | Type | Invariant |
| --- | --- | --- |
| `phase` | playing or gameOver | drops accepted only while playing |
| `score` | non-negative integer | equals successful placements after the base |
| `placedBlocks` | ordered Block list | first item is base; last item is support |
| `activeBlock` | Block | exactly one; frozen as missed after failure |
| `direction` | -1 or 1 | used only while active motion is moving |
| `dropAccepted` | boolean | true after the current block's one accepted drop |

Visible status is derived, not independently mutable:

- Ready when phase is playing and score is 0.
- Playing when phase is playing and score is greater than 0.
- Game Over when phase is gameOver.

## ConfigSelection

| Field | Type | Meaning |
| --- | --- | --- |
| `config` | GameConfig | validated candidate or a fresh default copy |
| `usedFallback` | boolean | true only when candidate validation failed |
| `warning` | string or null | one fixed safe message for fallback, otherwise null |

## State Transitions

```text
new/restart
  -> playing + score 0 + base + one moving active block

moving --accepted drop--> falling
falling --overlap >= minOverlap-->
  trim to overlap + append placed block + score +1 + optional viewport rebase
  + spawn one moving active block
falling --overlap < minOverlap-->
  gameOver + frozen missed active block + unchanged score
gameOver --R or Restart--> new/restart
```

Rejected transitions:

- Drop while falling.
- Repeated keydown from a held Space key.
- Drop while gameOver.
- Restart while playing under the supplied control contract.

