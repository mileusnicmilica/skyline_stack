# Gameplay Contract: Crane Tower Gameplay

## Fresh session

- Score is `0`, phase is `playing`, debris is empty, and camera/crane state is reset.
- The centered base is the only placed block.
- Exactly one active floor exists, has the starting width, and is attached (`motion: moving`).
- Visible status is `Ready`.

## Animation tick

- Negative elapsed time behaves as zero; the application caps large frame deltas before calling the engine.
- An attached floor derives its horizontal position from the advanced swing phase and does not change vertical position.
- A falling floor keeps its horizontal release position and advances downward no farther than contact height before landing is resolved.
- Camera easing, fragment gravity/rotation, and impact decay are deterministic for equal state and elapsed time.
- In Game Over, tower, score, active collision geometry, and swing state do not advance; existing debris and visual feedback may advance.

## Drop input

- A non-repeated Space event or pointer event changes exactly one attached floor to `falling` and sets `dropAccepted`.
- A repeated Space event, a second input during the same fall, or any drop input during Game Over returns the unchanged gameplay state.

## Accepted landing

- Acceptance condition: `overlap.width >= config.minOverlap`.
- Append one stationary placed block equal to the overlap interval at the support top.
- Increase score by exactly one.
- Derive detached sections from every unsupported interval; their total width plus placed width equals released width within `0.001`.
- Convert detached sections into deterministic masonry pieces; full overlap creates none.
- Spawn exactly one next attached floor with width equal to the placed floor.
- Set a new camera target that keeps the active construction zone visible.

## Failed landing

- Failure condition: `overlap.width < config.minOverlap`.
- Do not append a floor and do not change score.
- Convert the complete released floor into at least four masonry pieces.
- Set the active floor to `missed` and phase to `gameOver`.
- Visible status is `Game Over`; further drop input is ignored.

## Restart

- R and Restart act only during Game Over.
- The returned state is deeply equal to a newly created session for the same valid configuration.
