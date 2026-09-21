# Research: Crane Tower Gameplay

## Decision 1: Recreate the feel, not the protected identity

City Bloxx is gameplay inspiration only.

**Decision**: Use the recognisable interaction vocabulary of a swaying crane load, rising building, blue sky, clouds, distant city, facade panels, windows, and falling masonry, while keeping the Skyline Stack name and drawing all visuals procedurally.

**Rationale**: The user's reference is primarily about gameplay readability and atmosphere. Original Canvas geometry can deliver that feel without copying another game's logo, characters, code, screenshots, or sprite sheets.

**Alternatives considered**: Importing or tracing reference-game assets was rejected because it creates an unnecessary copyright and dependency risk. A generic neon rectangle presentation was rejected because it does not satisfy the requested building detail.

## Decision 2: Attached floors use sinusoidal sway

**Decision**: Drive the attached floor's horizontal center from a deterministic sine phase. The cable endpoint follows the floor center; release freezes the horizontal coordinate and changes only vertical position.

**Rationale**: A sine curve reads as suspended motion, is frame-rate independent, remains easy to unit-test, and keeps drop timing understandable. Reusing `moveSpeed` as the phase-rate input preserves the public configuration contract.

**Alternatives considered**: A full rigid-body pendulum was rejected as unnecessary for one-input play and contrary to the no-physics-library constraint. Edge-reflecting linear motion was rejected because it does not feel suspended.

## Decision 3: Collision remains axis-aligned and authoritative

**Decision**: Preserve the existing horizontal interval intersection at the moment the falling floor reaches the support top. Small rendered tilts are decorative and do not change collision geometry.

**Rationale**: The overlap rule is already deterministic, tested, and explicitly requested. Keeping one authority avoids unpredictable visual-physics mismatches and preserves exact minimum-overlap behavior.

**Alternatives considered**: Polygon collision for rotated floors was rejected because it adds disproportionate complexity and would change the established placement contract.

## Decision 4: Debris is derived from detached intervals

**Decision**: First compute zero, one, or two detached horizontal sections; then split each non-zero section into a deterministic grid of masonry pieces with gravity, rotation, outward velocity, and a finite lifetime.

**Rationale**: Separating geometry from particles makes conservation testable: placed width plus detached width equals released width. Deterministic fragments provide repeatable tests and screenshots without a random-number source.

**Alternatives considered**: Dropping one intact slab did not provide the requested stone-like crumbling. Random particle generation was rejected because it weakens reproducibility.

## Decision 5: Camera is an eased vertical world offset

**Decision**: Store floors in stable world coordinates and add a positive camera offset at render time. After each success, target the offset that keeps the next hanging floor near the upper scene and its support near the lower scene; ease toward that target with bounded interpolation.

**Rationale**: This gives visible upward progression without rewriting settled geometry and keeps the crane, load, and support on screen for tall towers.

**Alternatives considered**: Mutating every floor position after each landing was rejected because it conflates world geometry with the viewport. A complex free camera was rejected as unnecessary.

## Decision 6: Procedural building art uses semantic layers

**Decision**: Render in this order: sky gradient and sun glow, drifting cloud silhouettes, parallax skyline, crane structure/cable, placed floors, active floor, debris/dust, HUD feedback, and Game Over veil. Floors use facade fill, roof/floor bands, side shade, window grid, and subtle wear marks.

**Rationale**: Layering gives the requested city and building detail while remaining fast, resolution-independent, and offline. Window count scales with floor width so even narrowed floors still read as architecture.

**Alternatives considered**: Raster sprites were rejected because no original art pack exists and external assets are out of scope. Heavy DOM composition was rejected because the project deliberately uses one Canvas.

## Decision 7: The existing configuration schema stays stable

**Decision**: Keep all seven public `GameConfig` fields and validation unchanged. Crane range, cable length, camera easing, gravity, and fragment tuning are internal named constants.

**Rationale**: The user requested gameplay and visual change, not a new external configuration API. This also preserves invalid-config fallback tests and the locked contract.

**Alternatives considered**: Adding many public particle/camera fields was rejected because it expands validation and user-facing surface without current value.

## Decision 8: Validation combines pure checks with a real browser smoke

**Decision**: Add deterministic tests for motion, geometry conservation, debris side, camera following, loss gating, and restart. Update the existing local Chromium smoke to time a successful drop, deliberately wait for a full miss, restart, and capture a V2 screenshot.

**Rationale**: Pure tests prove rules; the smoke proves that Canvas, input, animation, DOM status, and visuals work together in an actual browser.

**Alternatives considered**: Adding Playwright/Cypress was rejected because the existing dependency-free CDP script is sufficient and avoids a large browser download.

## Reference observations

- The classic review describes a one-button crane timing loop and tower instability as the building rises: https://www.gamespot.com/reviews/tower-bloxx-review/1900-6145707/
- Historical screenshots and the supplied `Example.jpeg` establish the visual vocabulary of a portrait sky, crane cable, stacked building modules, clouds, and city depth: https://www.mobygames.com/game/54085/tower-bloxx/screenshots/
