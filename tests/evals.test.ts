import { describe, expect, it } from "vitest";

import {
  CONFIG_WARNING,
  DEFAULT_GAME_CONFIG,
  selectGameConfig,
} from "../src/game/config";
import { advanceSession, createGameSession, resolveLanding } from "../src/game/engine";
import type { GameSession } from "../src/game/model";

describe("locked evals", () => {
  it("E1: moves and resolves a clear successful overlap from score 0 to 1", () => {
    const initial = createGameSession(DEFAULT_GAME_CONFIG);
    const moved = advanceSession(initial, DEFAULT_GAME_CONFIG, 0.1);
    const support = moved.placedBlocks[0];
    if (!support) throw new Error("Expected a base block");
    moved.activeBlock = {
      ...moved.activeBlock,
      x: support.x + 20,
      y: support.y - moved.activeBlock.height,
      motion: "falling",
    };
    moved.dropAccepted = true;

    const resolved = resolveLanding(moved, DEFAULT_GAME_CONFIG);

    expect(moved.activeBlock.x).not.toBe(initial.activeBlock.x);
    expect(resolved.score).toBe(1);
    expect(resolved.phase).toBe("playing");
    expect(resolved.placedBlocks[1]?.width).toBe(support.width - 20);
    expect(resolved.activeBlock.width).toBe(support.width - 20);
    expect(resolved.activeBlock.motion).toBe("moving");
  });

  it("E2: accepts overlap exactly equal to minOverlap", () => {
    const support = {
      x: 200,
      y: 500,
      width: 80,
      height: DEFAULT_GAME_CONFIG.blockHeight,
      role: "placed" as const,
      motion: "stationary" as const,
      tilt: 0,
      floorNumber: 4,
    };
    const session: GameSession = {
      phase: "playing",
      score: 4,
      drops: [],
      placedBlocks: [support],
      activeBlock: {
        x: support.x + support.width - DEFAULT_GAME_CONFIG.minOverlap,
        y: support.y - DEFAULT_GAME_CONFIG.blockHeight,
        width: support.width,
        height: DEFAULT_GAME_CONFIG.blockHeight,
        role: "active",
        motion: "falling",
        tilt: 0,
        floorNumber: 5,
      },
      direction: 1,
      dropAccepted: true,
      swingPhase: 0,
      cameraOffset: 0,
      cameraTarget: 0,
      debris: [],
      impactPulse: 0,
    };

    const resolved = resolveLanding(session, DEFAULT_GAME_CONFIG);

    expect(resolved.phase).toBe("playing");
    expect(resolved.score).toBe(5);
    expect(resolved.placedBlocks[1]?.width).toBe(DEFAULT_GAME_CONFIG.minOverlap);
    expect(resolved.activeBlock.width).toBe(DEFAULT_GAME_CONFIG.minOverlap);
  });

  it("E3: rejects an invalid config as a whole and requests one safe warning", () => {
    const invalidCandidate = {
      canvasWidth: 999,
      canvasHeight: 640,
      startingBlockWidth: 200,
      blockHeight: 28,
      moveSpeed: 180,
      minOverlap: 0,
    };

    const selection = selectGameConfig(invalidCandidate);
    const warningRequests = [selection.warning].filter((warning) => warning !== null);
    const session = createGameSession(selection.config);

    expect(selection.config).toEqual(DEFAULT_GAME_CONFIG);
    expect(selection.config.canvasWidth).not.toBe(invalidCandidate.canvasWidth);
    expect(selection.usedFallback).toBe(true);
    expect(warningRequests).toEqual([CONFIG_WARNING]);
    expect(CONFIG_WARNING).not.toContain("999");
    expect(session.phase).toBe("playing");
    expect(session.activeBlock.motion).toBe("moving");
  });
});
