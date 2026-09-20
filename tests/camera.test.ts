import { describe, expect, it } from "vitest";

import {
  advanceCamera,
  getCameraTarget,
  worldToScreenY,
} from "../src/game/camera";

describe("tower camera", () => {
  it("uses no offset for the initial hanging height and follows higher floors", () => {
    expect(getCameraTarget(160)).toBe(0);
    expect(getCameraTarget(-60)).toBe(220);
    expect(getCameraTarget(300)).toBe(0);
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
