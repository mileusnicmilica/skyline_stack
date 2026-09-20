# Phase 0 Research: Skyline Stack Core

## Decision 1: Plain TypeScript and Canvas

**Decision**: Use framework-free TypeScript, one HTML Canvas for the game, and
small semantic DOM elements for score, status, warning, controls, and Restart.

**Rationale**: The feature is one screen with a deterministic loop. Canvas
directly supports the required geometric shapes; DOM text keeps status and
controls readable. A framework or game engine would expand setup and obscure
the core state transitions.

**Alternatives considered**:

- React or another UI framework: rejected because component orchestration is
  unnecessary for one canvas and a small HUD.
- Game/physics engine: rejected because movement, interval intersection, and
  axis-aligned contact are simple arithmetic.
- DOM blocks instead of Canvas: rejected because the required single Canvas
  render is explicit.

## Decision 2: Vite as the only build/dev tool

**Decision**: Use Vite with a vanilla TypeScript entry and an explicit
`tsc --noEmit` typecheck script.

**Rationale**: Browsers do not execute TypeScript directly. Vite supplies a
small modern-browser dev server and build command, treats `index.html` as an
entry, and transpiles `.ts` imports without requiring a framework. Vite's own
documentation states that its TypeScript transform does not type-check, so a
separate TypeScript check is required.

**Alternatives considered**:

- Hand-written `tsc` output plus a separate static server: rejected because it
  requires two independently configured tools and output-path management.
- A larger application framework CLI: rejected as unnecessary.
- No build tool: rejected because the project contract requires TypeScript.

**Sources**:

- https://vite.dev/guide/
- https://vite.dev/guide/features

## Decision 3: Vitest for deterministic logic tests

**Decision**: Use Vitest with Node environment tests for pure modules; keep
browser rendering verification as a separate smoke/visual step.

**Rationale**: Vitest uses Vite's TypeScript transformation pipeline and finds
`*.test.ts` files without an additional transformer. Node tests are enough
for config validation, overlap arithmetic, state transitions, input gating, and
fixed eval cases. A browser automation dependency is not needed for the Core
test suite.

**Alternatives considered**:

- Jest plus a TypeScript transformer: rejected because it duplicates
  transformation configuration.
- Playwright/Cypress: rejected for the baseline because browser download and
  end-to-end infrastructure are disproportionate; a real-browser smoke and
  screenshot will still be recorded when available.
- Node's built-in test runner: viable, but would require a separate TypeScript
  execution step.

**Sources**:

- https://vitest.dev/guide/
- https://vitest.dev/guide/why
- https://vitest.dev/guide/learn/writing-tests

## Decision 4: Pure state transitions around a browser shell

**Decision**: Keep configuration selection, overlap calculation, drop
resolution, spawning, restart, and input eligibility as deterministic functions.
The animation loop supplies elapsed time and the renderer reads state.

**Rationale**: Pure rules make the min-overlap boundary, exact score increment,
single active block, and full restart directly repeatable without timing or
pixel sampling. Browser code remains a thin integration layer.

**Alternatives considered**:

- Mutating all state inside the animation callback: rejected because it couples
  rules to frame timing and makes eval reproduction brittle.
- General entity-component architecture: rejected as needless abstraction for
  one block type.

## Decision 5: Whole-object safe fallback for configuration

**Decision**: Validate an `unknown` input once. If any field or relationship is
invalid, discard the entire candidate, return a fresh copy of known defaults,
and request exactly one generic visible warning.

**Rationale**: Whole-object fallback matches the stated policy and avoids
partially trusted combinations. A generic warning exposes no raw input or
private values.

**Alternatives considered**:

- Per-field correction: rejected because the prompt says invalid values are not
  used and a known default configuration is applied.
- Throwing an exception: rejected because the application must not crash.
- Logging raw invalid input: rejected for safety and evidence hygiene.

## Decision 6: Simple viewport rebase

**Decision**: When a successful placement would move the next active block
above a fixed top margin, shift all placed blocks downward by one block height
before spawning the next block.

**Rationale**: This keeps the active block and immediate support visible while
preserving relative geometry. It supports the no-finite-win loop without a
camera system or decorative animation.

**Alternatives considered**:

- End the game at the top: rejected because no finite win/end condition exists.
- Smooth camera animation: rejected as visual scope expansion.
- Allow play to continue off-screen: rejected because the player could no
  longer make the primary timing decision.

## Decision 7: Verifiable baseline without Git

**Decision**: In Phase B, save the complete baseline as a read-only ZIP outside
the files included in that ZIP, record its SHA-256, and never overwrite it.

**Rationale**: Local Git was not initialized. A named archive plus hash is a
repeatable immutable-enough snapshot that can be extracted and evaluated
separately before and after the controlled change.

**Alternatives considered**:

- Local Git commit/tag: not selected because local Git was not approved or
  initialized.
- Copying a mutable folder only: rejected because accidental edits are harder
  to detect without a content hash.

