import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_CONFIG } from "../src/game/config";
import {
  advanceSession,
  createGameSession,
  resolveLanding,
  restartSession,
} from "../src/game/engine";
import type { GameSession } from "../src/game/model";

describe("game engine", () => {
  it("creates one bounded moving block and advances only its horizontal position", () => {
    const session = createGameSession(DEFAULT_GAME_CONFIG);
    const initialY = session.activeBlock.y;

    const advanced = advanceSession(session, DEFAULT_GAME_CONFIG, 0.25);

    expect(advanced.activeBlock.x).toBeGreaterThan(session.activeBlock.x);
    expect(advanced.activeBlock.y).toBe(initialY);
    expect(advanced.activeBlock.x).toBeGreaterThanOrEqual(0);
    expect(advanced.activeBlock.x + advanced.activeBlock.width).toBeLessThanOrEqual(
      DEFAULT_GAME_CONFIG.canvasWidth,
    );
    expect(advanced.activeBlock.motion).toBe("moving");
  });

  it("reflects at the right edge without leaving the canvas", () => {
    const session = createGameSession(DEFAULT_GAME_CONFIG);
    session.activeBlock.x =
      DEFAULT_GAME_CONFIG.canvasWidth - session.activeBlock.width - 2;
    session.direction = 1;

    const advanced = advanceSession(session, DEFAULT_GAME_CONFIG, 0.1);

    expect(advanced.direction).toBe(-1);
    expect(advanced.activeBlock.x).toBeGreaterThanOrEqual(0);
    expect(advanced.activeBlock.x + advanced.activeBlock.width).toBeLessThanOrEqual(
      DEFAULT_GAME_CONFIG.canvasWidth,
    );
  });

  it("places only the overlap, increments once, and spawns one matching block", () => {
    const session = createGameSession(DEFAULT_GAME_CONFIG);
    const support = session.placedBlocks[0];
    if (!support) throw new Error("Expected a base block");
    session.activeBlock = {
      ...session.activeBlock,
      x: support.x + 25,
      y: support.y - session.activeBlock.height,
      motion: "falling",
    };
    session.dropAccepted = true;

    const resolved = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(resolved.score).toBe(1);
    expect(resolved.placedBlocks).toHaveLength(2);
    expect(resolved.placedBlocks[1]).toMatchObject({
      x: support.x + 25,
      width: support.width - 25,
      role: "placed",
      motion: "stationary",
    });
    expect(resolved.activeBlock.width).toBe(support.width - 25);
    expect(resolved.activeBlock.motion).toBe("moving");
    expect(resolved.dropAccepted).toBe(false);
  });

  it("rebases placed blocks by one height when the next moving lane reaches the top", () => {
    const support = {
      x: 160,
      y: DEFAULT_GAME_CONFIG.blockHeight * 4,
      width: 160,
      height: DEFAULT_GAME_CONFIG.blockHeight,
      role: "base" as const,
      motion: "stationary" as const,
    };
    const session: GameSession = {
      phase: "playing",
      score: 0,
      placedBlocks: [support],
      activeBlock: {
        x: support.x,
        y: support.y - DEFAULT_GAME_CONFIG.blockHeight,
        width: support.width,
        height: DEFAULT_GAME_CONFIG.blockHeight,
        role: "active",
        motion: "falling",
      },
      direction: 1,
      dropAccepted: true,
    };

    const resolved = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(resolved.placedBlocks[0]?.y).toBe(support.y + DEFAULT_GAME_CONFIG.blockHeight);
    expect(resolved.placedBlocks[1]?.y).toBe(support.y);
    expect(resolved.activeBlock.y).toBe(DEFAULT_GAME_CONFIG.blockHeight);
  });

  it("enters a frozen game-over state on a below-minimum miss", () => {
    const support = {
      x: 200,
      y: 500,
      width: 80,
      height: DEFAULT_GAME_CONFIG.blockHeight,
      role: "placed" as const,
      motion: "stationary" as const,
    };
    const session: GameSession = {
      phase: "playing",
      score: 4,
      placedBlocks: [support],
      activeBlock: {
        x: support.x + support.width - (DEFAULT_GAME_CONFIG.minOverlap - 1),
        y: support.y - DEFAULT_GAME_CONFIG.blockHeight,
        width: support.width,
        height: DEFAULT_GAME_CONFIG.blockHeight,
        role: "active",
        motion: "falling",
      },
      direction: 1,
      dropAccepted: true,
    };

    const failed = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(failed.phase).toBe("gameOver");
    expect(failed.score).toBe(4);
    expect(failed.placedBlocks).toEqual([support]);
    expect(failed.activeBlock.motion).toBe("missed");
    expect(advanceSession(failed, DEFAULT_GAME_CONFIG, 1)).toBe(failed);
  });

  it("restarts every observable field to a fresh session", () => {
    const gameOver = createGameSession(DEFAULT_GAME_CONFIG);
    gameOver.phase = "gameOver";
    gameOver.score = 7;
    gameOver.dropAccepted = true;
    gameOver.activeBlock.motion = "missed";

    expect(restartSession(gameOver, DEFAULT_GAME_CONFIG)).toEqual(
      createGameSession(DEFAULT_GAME_CONFIG),
    );
  });
});
