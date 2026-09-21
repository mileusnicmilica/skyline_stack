# Implementation Plan: Crane Tower Gameplay

**Branch**: `phase-b/crane-tower-v2` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-crane-tower-gameplay/spec.md`

## Summary

Evolve the existing Skyline Stack Canvas game into one focused crane-and-city tower loop. An original building floor hangs from a visible cable, sways sinusoidally within its full horizontal Canvas bounds, releases on one input, and falls vertically. Existing overlap geometry remains authoritative: supported masonry joins the tower, unsupported masonry is deterministically split into animated rubble, and a full miss ends the run. A camera offset follows the construction height while procedural sky, clouds, distant buildings, facade panels, windows, shadows, and a crane establish the requested classic mobile city-construction feel without copied assets.

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node.js 24.12.0

**Primary Dependencies**: Browser Canvas API; Vite 8.3.0 for local serving/build; no runtime framework, external assets, game engine, or physics library

**Storage**: N/A; session, tower, camera, and debris are memory-only

**Testing**: Vitest 5.0.1 for deterministic unit/eval checks; local Chromium CDP smoke flow for keyboard input, restart, runtime errors, and screenshot evidence

**Target Platform**: Modern evergreen desktop and touch-capable browsers with a portrait-oriented responsive game surface

**Project Type**: Single static browser application with no backend

**Performance Goals**: A 60 fps animation target; bounded delta time; fewer than 120 transient debris pieces in ordinary play; one input accepted within the next animation frame

**Constraints**: One Canvas and small DOM HUD; no network calls or downloaded assets; preserve the seven-field `GameConfig` contract and safe fallback; preserve Session 003 baseline/evidence; original Skyline Stack identity only

**Scale/Scope**: One local player, one active floor, one tower, one crane, one camera, a small deterministic debris set, three input paths, and one loss/restart loop

## Constitution Check

*GATE: passed before Phase 0 and re-checked after Phase 1.*

| Principle or constraint | Pre-research | Post-design | Evidence |
| --- | --- | --- | --- |
| Specification before implementation | PASS | PASS | V2 spec and 16/16 checklist precede implementation |
| Minimal Core scope | PASS | PASS | Existing framework-free Canvas app remains; no backend, network, engine, or runtime dependency |
| Verifiable evidence | PASS | PASS | Deterministic tests plus repeatable browser smoke and screenshot are defined |
| Runtime contract and safe fallback | PASS | PASS | Existing seven-field validation and fallback remain unchanged |
| Controlled scope change | PASS | PASS | User explicitly approved this new feature after Session 003; locked baseline evidence is preserved rather than rewritten |
| Original assets and security | PASS | PASS | Presentation is procedural; no copied asset, credential, private URL, or external request is introduced |

The requested visual and gameplay expansion is a new approved feature, not the single Session 003 baseline experiment. No constitutional complexity exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/002-crane-tower-gameplay/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── gameplay.md
│   └── visual-presentation.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html
src/
├── main.ts
├── style.css
└── game/
    ├── config.ts        # unchanged public config and fallback contract
    ├── model.ts         # tower, crane phase, camera, and debris state
    ├── geometry.ts      # overlap and detached-section calculations
    ├── crane.ts         # deterministic sway and cable geometry
    ├── debris.ts        # deterministic fragment creation and motion
    ├── camera.ts        # follow target and easing
    ├── engine.ts        # placement and session transitions
    ├── input.ts         # one-shot drop and restart gates
    └── render.ts        # procedural city, crane, floors, windows, rubble
tests/
├── config.test.ts
├── geometry.test.ts
├── crane.test.ts
├── debris.test.ts
├── camera.test.ts
├── engine.test.ts
├── input.test.ts
├── evals.test.ts
├── v2-evals.test.ts
└── browser-smoke.mjs
```

**Structure Decision**: Extend the existing flat browser project. Pure deterministic crane, debris, camera, geometry, and state rules remain separate from browser rendering. The Canvas renderer creates every visual from shapes and gradients, so the requested building detail does not require an asset pipeline or copyright-sensitive files.

## Complexity Tracking

No constitution violations or exceptions are proposed.
