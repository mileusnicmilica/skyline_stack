import { describe, expect, it } from "vitest";

import {
  advanceCamera,
  getCameraTarget,
  getMinimumCameraOffset,
  worldToScreenY,
} from "../src/game/camera";

describe("tower camera", () => {
  it("starts following before the hanging floor reaches the crane boom", () => {
    expect(getCameraTarget(160)).toBe(0);
    expect(getCameraTarget(100)).toBe(0);
    expect(getCameraTarget(80)).toBe(20);
    expect(getCameraTarget(40)).toBe(60);
    expect(getCameraTarget(0)).toBe(100);
    expect(getCameraTarget(-60)).toBe(160);
    expect(getCameraTarget(300)).toBe(0);
  });

  it("keeps a newly spawned floor below the boom even before easing completes", () => {
    expect(getMinimumCameraOffset(160)).toBe(0);
    expect(getMinimumCameraOffset(40)).toBe(24);
    expect(getMinimumCameraOffset(0)).toBe(64);
    expect(getMinimumCameraOffset(-40)).toBe(104);
    expect(worldToScreenY(-40, getMinimumCameraOffset(-40))).toBe(64);
  });

  it("holds a followed hanging floor 100 pixels below the top edge", () => {
    const hangingWorldY = -40;
    const target = getCameraTarget(hangingWorldY);

    expect(worldToScreenY(hangingWorldY, target)).toBe(100);
  });

  it("eases toward a non-negative target without overshooting", () => {
    const first = advanceCamera(0, 84, 0.1);

    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThanOrEqual(84);
    expect(advanceCamera(first, 84, 10)).toBe(84);
    expect(advanceCamera(10, -50, 1)).toBe(0);
    expect(worldToScreenY(100, 28)).toBe(128);
  });
});
