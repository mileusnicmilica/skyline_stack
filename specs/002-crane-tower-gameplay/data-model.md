# Data Model: Crane Tower Gameplay

## GameSession

Represents one complete in-memory run.

| Field | Type | Rules |
| --- | --- | --- |
| `phase` | `playing | gameOver` | Only `playing` accepts drop input |
| `score` | non-negative integer | Increments exactly once per accepted landing |
| `placedBlocks` | ordered `Block[]` | Starts with one base; last item is current support |
| `activeBlock` | `Block` | Exactly one; role is `active` |
| `direction` | `-1 | 1` | Derived from current crane phase for visual direction |
| `dropAccepted` | boolean | False while attached; true from release through landing |
| `swingPhase` | finite number | Advances only while the active floor is attached |
| `cameraOffset` | non-negative number | Current eased world-to-screen vertical translation |
| `cameraTarget` | non-negative number | Target translation after the latest tower change |
| `debris` | `MasonryPiece[]` | Transient visual fragments; never supports blocks |
| `impactPulse` | number in `[0, 1]` | Short visual feedback that decays during animation |

### State transitions

```text
fresh playing / attached
  └─ release input → playing / falling
       ├─ accepted overlap → score + 1 / attached next floor
       └─ below-minimum overlap → gameOver / missed + full-floor debris

gameOver
  ├─ animation tick → debris/camera visual state only
  └─ R or Restart → fresh playing / attached
```

## Block

An axis-aligned building floor for collision and a decorated facade for rendering.

| Field | Type | Rules |
| --- | --- | --- |
| `x`, `y` | finite number | World-space top-left position |
| `width`, `height` | positive number | Active width always matches previous accepted overlap |
| `role` | `base | placed | active` | Determines architectural styling |
| `motion` | `stationary | moving | falling | missed` | `moving` means attached to the crane |
| `tilt` | finite number | Decorative radians, clamped to a small visible range |
| `floorNumber` | non-negative integer | Stable facade variation and window-light pattern |

## CraneState (derived)

Not stored as a separate mutable object. It is derived from `swingPhase`, configuration, current support, active width, and camera.

| Value | Rule |
| --- | --- |
| `pivotX` | Horizontal play-area center |
| `pivotY` | Fixed distance above the hanging floor in world space |
| `hookX` | Active floor center while attached; always within `active width / 2 .. canvasWidth - active width / 2` |
| `hookY` | Active floor top while attached |
| `direction` | Sign of the sine derivative |

## DetachedSection

An intermediate immutable result of landing geometry.

| Field | Type | Rules |
| --- | --- | --- |
| `x`, `y`, `width`, `height` | finite rectangle | Width must be positive |
| `side` | `left | right | full` | Indicates source relative to accepted overlap |

For successful placement, the sum of section widths plus overlap width equals the released width within `0.001`. A perfect landing has zero sections. A failed landing has one `full` section equal to the active floor.

## MasonryPiece

A visual fragment derived deterministically from a detached section.

| Field | Type | Rules |
| --- | --- | --- |
| `x`, `y`, `width`, `height` | finite numbers | Initial rectangles exactly tile their source section |
| `velocityX`, `velocityY` | finite numbers | Side-biased horizontal motion; gravity advances vertical velocity |
| `rotation`, `angularVelocity` | finite numbers | Deterministic from row, column, and source side |
| `life` | positive number | Decreases each tick; expired/off-screen pieces are removed |
| `tone` | integer `0..2` | Chooses one of three facade/rubble shades |
| `side` | `left | right | full` | Retained for tests and visual bias |

## Camera

Camera values live on `GameSession`. Rendering converts world `y` to screen `y` using `screenY = worldY + cameraOffset`. The target is recomputed only when a next floor is spawned and never changes collision coordinates.

## GameConfig

The existing seven required positive finite numeric fields remain unchanged: `canvasWidth`, `canvasHeight`, `startingBlockWidth`, `blockHeight`, `moveSpeed`, `fallSpeed`, and `minOverlap`. Existing size relationships, all-or-nothing validation, safe defaults, and one-warning behavior remain authoritative.
