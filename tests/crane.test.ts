import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_CONFIG } from "../src/game/config";
import {
  advanceSwingPhase,
  getCraneGeometry,
  getHangingY,
  getSwingPosition,
} from "../src/game/crane";

describe("crane motion", () => {
  it("starts centered, advances sinusoidally, and reports direction", () => {
    const start = getSwingPosition(0, 200, DEFAULT_GAME_CONFIG);
    const phase = advanceSwingPhase(0, DEFAULT_GAME_CONFIG.moveSpeed, 0.25);
    const moved = getSwingPosition(phase, 200, DEFAULT_GAME_CONFIG);

    expect(start.x).toBe(140);
    expect(moved.x).toBeGreaterThan(start.x);
    expect(moved.direction).toBe(1);
    expect(getSwingPosition(Math.PI, 200, DEFAULT_GAME_CONFIG).direction).toBe(-1);
  });

  it("keeps the floor at a fixed hanging height and joins cable to its center", () => {
    const supportY = DEFAULT_GAME_CONFIG.canvasHeight - DEFAULT_GAME_CONFIG.blockHeight;
    const hangingY = getHangingY(supportY, DEFAULT_GAME_CONFIG.blockHeight);
    const geometry = getCraneGeometry(
      { x: 90, y: hangingY, width: 200, height: 28 },
      DEFAULT_GAME_CONFIG,
    );

    expect(hangingY).toBe(160);
    expect(geometry.hookX).toBe(190);
    expect(geometry.hookY).toBe(hangingY);
    expect(geometry.pivotY).toBeLessThan(geometry.hookY);
  });
});
