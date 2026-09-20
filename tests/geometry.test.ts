import { describe, expect, it } from "vitest";

import { intersectHorizontal } from "../src/game/geometry";

describe("intersectHorizontal", () => {
  it("returns only the shared interval", () => {
    expect(intersectHorizontal({ x: 100, width: 200 }, { x: 150, width: 200 })).toEqual({
      left: 150,
      width: 150,
    });
  });

  it("returns zero width when intervals do not overlap", () => {
    expect(intersectHorizontal({ x: 0, width: 40 }, { x: 60, width: 40 })).toEqual({
      left: 60,
      width: 0,
    });
  });

  it("preserves an overlap exactly equal to the minimum boundary", () => {
    expect(intersectHorizontal({ x: 272, width: 80 }, { x: 200, width: 80 })).toEqual({
      left: 272,
      width: 8,
    });
  });
});

