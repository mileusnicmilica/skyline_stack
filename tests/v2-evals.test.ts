import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_CONFIG } from "../src/game/config";
import {
  advanceSession,
  createGameSession,
  resolveLanding,
  restartSession,
} from "../src/game/engine";
import { findDetachedSections, intersectHorizontal } from "../src/game/geometry";
import { requestKeyboardDrop, requestPointerDrop } from "../src/game/input";

describe("Crane Tower V2 evals", () => {
  it("V2-E1: the attached floor sways with the cable while height stays fixed", () => {
    const initial = createGameSession(DEFAULT_GAME_CONFIG);
    const advanced = advanceSession(initial, DEFAULT_GAME_CONFIG, 0.25);

    expect(advanced.activeBlock.motion).toBe("moving");
    expect(advanced.activeBlock.x).not.toBe(initial.activeBlock.x);
    expect(advanced.activeBlock.y).toBe(initial.activeBlock.y);
    expect(advanced.swingPhase).toBeGreaterThan(initial.swingPhase);
  });

  it("V2-E2: one release freezes x and advances only the vertical fall", () => {
    const initial = createGameSession(DEFAULT_GAME_CONFIG);
    const released = requestKeyboardDrop(initial, false);
    const repeated = requestPointerDrop(released);
    const advanced = advanceSession(released, DEFAULT_GAME_CONFIG, 0.1);

    expect(released.activeBlock.motion).toBe("falling");
    expect(repeated).toBe(released);
    expect(advanced.activeBlock.x).toBe(released.activeBlock.x);
    expect(advanced.activeBlock.y).toBeGreaterThan(released.activeBlock.y);
  });

  it("V2-E3: partial overlap conserves the floor and crumbles only the unsupported side", () => {
    const session = createGameSession(DEFAULT_GAME_CONFIG);
    const support = session.placedBlocks.at(-1);
    if (!support) throw new Error("Expected a support floor");
    const releasedWidth = session.activeBlock.width;
    session.activeBlock = {
      ...session.activeBlock,
      x: support.x + 30,
      y: support.y - session.activeBlock.height,
      motion: "falling",
    };
    session.dropAccepted = true;
    const overlap = intersectHorizontal(session.activeBlock, support);
    const sections = findDetachedSections(session.activeBlock, overlap, "placed");
    const resolved = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(overlap.width + sections.reduce((sum, section) => sum + section.width, 0)).toBe(
      releasedWidth,
    );
    expect(resolved.placedBlocks.at(-1)?.width).toBe(releasedWidth - 30);
    expect(resolved.debris.length).toBeGreaterThanOrEqual(4);
    expect(resolved.debris.every((piece) => piece.side === "right")).toBe(true);
  });

  it("V2-E4: one full miss ends the run and no lives state exists", () => {
    const session = createGameSession(DEFAULT_GAME_CONFIG);
    const support = session.placedBlocks.at(-1);
    if (!support) throw new Error("Expected a support floor");
    session.activeBlock = {
      ...session.activeBlock,
      x: support.x + support.width + 1,
      y: support.y - session.activeBlock.height,
      motion: "falling",
    };
    session.dropAccepted = true;
    const failed = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(failed.phase).toBe("gameOver");
    expect(failed.score).toBe(0);
    expect(failed.debris.length).toBeGreaterThanOrEqual(4);
    expect(Object.hasOwn(failed, "lives")).toBe(false);
    expect(Object.hasOwn(failed, "remainingLives")).toBe(false);
    expect(requestPointerDrop(failed)).toBe(failed);
  });

  it("V2-E5: camera keeps an eight-floor tower playable and restart clears V2 state", () => {
    let session = createGameSession(DEFAULT_GAME_CONFIG);

    for (let floor = 0; floor < 8; floor += 1) {
      const support = session.placedBlocks.at(-1);
      if (!support) throw new Error("Expected a support floor");
      session.activeBlock = {
        ...session.activeBlock,
        x: support.x,
        y: support.y - session.activeBlock.height,
        motion: "falling",
      };
      session.dropAccepted = true;
      session = resolveLanding(session, DEFAULT_GAME_CONFIG);
      session = advanceSession(session, DEFAULT_GAME_CONFIG, 1);
    }

    const support = session.placedBlocks.at(-1);
    if (!support) throw new Error("Expected a support floor");
    expect(session.activeBlock.y + session.cameraOffset).toBeGreaterThanOrEqual(0);
    expect(support.y + session.cameraOffset).toBeLessThan(
      DEFAULT_GAME_CONFIG.canvasHeight,
    );

    session.phase = "gameOver";
    session.debris = [
      {
        x: 0,
        y: 0,
        width: 5,
        height: 5,
        velocityX: 1,
        velocityY: 1,
        rotation: 0,
        angularVelocity: 1,
        life: 1,
        tone: 0,
        side: "full",
      },
    ];
    expect(restartSession(session, DEFAULT_GAME_CONFIG)).toEqual(
      createGameSession(DEFAULT_GAME_CONFIG),
    );
  });
});
