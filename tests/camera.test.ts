import { describe, expect, it } from "vitest";

import {
  advanceCamera,
  getCameraTarget,
  worldToScreenY,
} from "../src/game/camera";

describe("tower camera", () => {
  it("keeps the first five-floor build-up still, then preserves the crane cable inset", () => {
    expect(getCameraTarget(160)).toBe(0);
    expect(getCameraTarget(40)).toBe(0);
    expect(getCameraTarget(0)).toBe(0);
    expect(getCameraTarget(-60)).toBe(220);
    expect(getCameraTarget(300)).toBe(0);
  });

  it("holds a followed hanging floor 160 pixels below the top edge", () => {
    const hangingWorldY = -40;
    const target = getCameraTarget(hangingWorldY);

    expect(worldToScreenY(hangingWorldY, target)).toBe(160);
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
