import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_CONFIG } from "../src/game/config";
import {
  advanceSession,
  createGameSession,
  resolveLanding,
  restartSession,
} from "../src/game/engine";

function prepareLanding(offset: number) {
  const session = createGameSession(DEFAULT_GAME_CONFIG);
  const support = session.placedBlocks.at(-1);
  if (!support) throw new Error("Expected a support floor");

  session.activeBlock = {
    ...session.activeBlock,
    x: support.x + offset,
    y: support.y - session.activeBlock.height,
    motion: "falling",
  };
  session.dropAccepted = true;
  return { session, support };
}

describe("game engine", () => {
  it("creates one centered crane floor and advances only its attached sway", () => {
    const session = createGameSession(DEFAULT_GAME_CONFIG);
    const initialY = session.activeBlock.y;

    const advanced = advanceSession(session, DEFAULT_GAME_CONFIG, 0.25);

    expect(session.activeBlock.x).toBe(140);
    expect(advanced.activeBlock.x).toBeGreaterThan(session.activeBlock.x);
    expect(advanced.activeBlock.y).toBe(initialY);
    expect(advanced.activeBlock.motion).toBe("moving");
    expect(advanced.swingPhase).toBeGreaterThan(session.swingPhase);
  });

  it("keeps the release x fixed while the active floor falls", () => {
    const session = createGameSession(DEFAULT_GAME_CONFIG);
    session.activeBlock = { ...session.activeBlock, x: 173, motion: "falling" };
    session.dropAccepted = true;

    const advanced = advanceSession(session, DEFAULT_GAME_CONFIG, 0.25);

    expect(advanced.activeBlock.x).toBe(173);
    expect(advanced.activeBlock.y).toBeGreaterThan(session.activeBlock.y);
    expect(advanced.swingPhase).toBe(session.swingPhase);
  });

  it("places only overlap, scores once, and crumbles the right overhang", () => {
    const { session, support } = prepareLanding(25);
    const resolved = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(resolved.score).toBe(1);
    expect(resolved.drops).toHaveLength(1);
    expect(resolved.drops[0]).toMatchObject({
      floor: 1,
      offsetPx: 25,
      direction: 1,
      timing: "late",
      widthBefore: DEFAULT_GAME_CONFIG.startingBlockWidth,
      widthAfter: DEFAULT_GAME_CONFIG.startingBlockWidth - 25,
    });
    expect(resolved.placedBlocks).toHaveLength(2);
    expect(resolved.placedBlocks[1]).toMatchObject({
      x: support.x + 25,
      width: support.width - 25,
      role: "placed",
      motion: "stationary",
      floorNumber: 1,
    });
    expect(resolved.activeBlock.width).toBe(support.width - 25);
    expect(resolved.activeBlock.motion).toBe("moving");
    expect(resolved.debris.length).toBeGreaterThanOrEqual(4);
    expect(resolved.debris.every((piece) => piece.side === "right")).toBe(true);
    expect(resolved.dropAccepted).toBe(false);
  });

  it("crumbles the left overhang from the left side", () => {
    const { session } = prepareLanding(-25);
    const resolved = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(resolved.debris.length).toBeGreaterThanOrEqual(4);
    expect(resolved.debris.every((piece) => piece.side === "left")).toBe(true);
    expect(resolved.drops[0]?.timing).toBe("early");
  });

  it("creates no debris for a perfect placement", () => {
    const { session } = prepareLanding(0);
    const resolved = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(resolved.score).toBe(1);
    expect(resolved.activeBlock.width).toBe(DEFAULT_GAME_CONFIG.startingBlockWidth);
    expect(resolved.debris).toEqual([]);
  });

  it("turns a full miss into masonry and freezes score/tower gameplay", () => {
    const { session, support } = prepareLanding(DEFAULT_GAME_CONFIG.startingBlockWidth + 1);
    session.score = 4;
    const failed = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(failed.phase).toBe("gameOver");
    expect(failed.score).toBe(4);
    expect(failed.drops.at(-1)).toMatchObject({
      floor: 1,
      widthAfter: 0,
    });
    expect(failed.placedBlocks).toEqual([support]);
    expect(failed.activeBlock.motion).toBe("missed");
    expect(failed.debris.length).toBeGreaterThanOrEqual(4);
    expect(failed.debris.every((piece) => piece.side === "full")).toBe(true);

    const animated = advanceSession(failed, DEFAULT_GAME_CONFIG, 0.1);
    expect(animated.score).toBe(failed.score);
    expect(animated.placedBlocks).toEqual(failed.placedBlocks);
    expect(animated.debris).not.toEqual(failed.debris);
  });

  it("keeps the active construction zone visible after eight floors", () => {
    let session = createGameSession(DEFAULT_GAME_CONFIG);

    for (let floor = 0; floor < 8; floor += 1) {
      const support = session.placedBlocks.at(-1);
      if (!support) throw new Error("Expected a support floor");
      session.activeBlock = {
        ...session.activeBlock,
        x: support.x,
        y: support.y - DEFAULT_GAME_CONFIG.blockHeight,
        motion: "falling",
      };
      session.dropAccepted = true;
      session = resolveLanding(session, DEFAULT_GAME_CONFIG);
      session = advanceSession(session, DEFAULT_GAME_CONFIG, 1);
    }

    const support = session.placedBlocks.at(-1);
    if (!support) throw new Error("Expected a support floor");
    const activeScreenY = session.activeBlock.y + session.cameraOffset;
    const supportScreenY = support.y + session.cameraOffset;

    expect(session.score).toBe(8);
    expect(activeScreenY).toBeGreaterThanOrEqual(0);
    expect(activeScreenY).toBeLessThan(DEFAULT_GAME_CONFIG.canvasHeight);
    expect(supportScreenY).toBeLessThan(DEFAULT_GAME_CONFIG.canvasHeight);
    expect(session.cameraOffset).toBeGreaterThan(0);
  });

  it("restarts every observable field to a fresh session", () => {
    const gameOver = createGameSession(DEFAULT_GAME_CONFIG);
    gameOver.phase = "gameOver";
    gameOver.score = 7;
    gameOver.drops = [{
      floor: 1,
      offsetPx: 0,
      direction: 1,
      timing: "centered",
      widthBefore: DEFAULT_GAME_CONFIG.startingBlockWidth,
      widthAfter: DEFAULT_GAME_CONFIG.startingBlockWidth,
    }];
    gameOver.dropAccepted = true;
    gameOver.activeBlock.motion = "missed";
    gameOver.cameraOffset = 120;
    gameOver.cameraTarget = 140;
    gameOver.impactPulse = 1;

    const restarted = restartSession(gameOver, DEFAULT_GAME_CONFIG);
    expect(restarted).toEqual(createGameSession(DEFAULT_GAME_CONFIG));
    expect(restarted.drops).toEqual([]);
  });
});
