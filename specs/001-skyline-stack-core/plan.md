# Implementation Plan: Skyline Stack Core

**Branch**: `N/A — feature directory 001-skyline-stack-core; Git extension disabled` | **Date**: 2026-09-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-skyline-stack-core/spec.md`

**Note**: This plan covers design only. Application setup and implementation belong to Phase B after human approval.

## Summary

Build the bounded Skyline Stack Core as a framework-free TypeScript browser
application with one HTML Canvas and a small DOM HUD. Keep gameplay transitions
in deterministic pure functions, isolate browser input/rendering, validate the
structured configuration at runtime, and use Vite only to serve/build TypeScript
plus Vitest to run deterministic tests through the same transform pipeline.

## Technical Context

**Language/Version**: TypeScript 5.x on the installed Node.js 24.20 runtime;
package versions will be pinned in Phase B and recorded from the generated lockfile

**Primary Dependencies**: Browser Canvas API; Vite as the minimal TypeScript
dev/build tool; no runtime library or framework

**Storage**: N/A; score and session state are memory-only

**Testing**: Vitest in Node for pure configuration, geometry, state-transition,
input-gating, and eval tests; separate browser smoke/visual verification

**Target Platform**: Modern evergreen desktop and touch-capable browsers;
offline gameplay after local assets load

**Project Type**: Single static browser application with no backend

**Performance Goals**: Smooth requestAnimationFrame-driven motion at a 60 fps
target on a typical development machine; a single input is accepted within the
next animation frame

**Constraints**: One canvas; no network calls, external assets, persistence,
backend, deployment, framework, game engine, or physics library; invalid
configuration must fall back safely; no implementation before Phase A approval

**Scale/Scope**: One local player, one active block, one screen, seven config
fields, four or more fixed eval scenarios, and a small module/test set

## Constitution Check

*GATE: passed before Phase 0 and re-checked after Phase 1.*

| Principle or constraint | Pre-research | Post-design | Evidence |
| --- | --- | --- | --- |
| Specification before implementation | PASS | PASS | Spec and checklist precede this plan; Phase B is gated |
| Minimal Core scope | PASS | PASS | No framework, backend, network, database, or deployment |
| Verifiable evidence | PASS | PASS | Quickstart distinguishes planned commands from results |
| Runtime contract and safe fallback | PASS | PASS | Config contract covers type, runtime checks, fallback, and warning |
| One controlled change | PASS | PASS | Baseline/eval workflow is preserved; E4 remains TBD until observed |
| Security constraints | PASS | PASS | No secret inputs, environment values, or private payloads are required |

No constitutional violation requires complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-skyline-stack-core/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── game-config.md
│   └── gameplay.md
├── checklists/
│   └── requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root; proposed for Phase B)

```text
index.html
package.json
tsconfig.json
src/
├── main.ts
├── style.css
└── game/
    ├── config.ts
    ├── geometry.ts
    ├── model.ts
    ├── engine.ts
    ├── input.ts
    └── render.ts
tests/
├── config.test.ts
├── geometry.test.ts
├── engine.test.ts
├── input.test.ts
└── evals.test.ts
```

**Structure Decision**: Use one flat browser project. Pure game rules live in
`src/game/`; `main.ts` wires DOM, input, validation, animation, and rendering.
Tests stay in the required root `tests/` directory. A separate frontend/backend
split, component framework, and asset pipeline would add no Core value.

## Complexity Tracking

No constitution violations or exceptions are proposed.
