import { describe, expect, it } from "vitest";

import { findDetachedSections, intersectHorizontal } from "../src/game/geometry";

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

describe("findDetachedSections", () => {
  const active = { x: 100, y: 200, width: 200, height: 28 };

  it("returns the unsupported right interval and conserves width", () => {
    const overlap = { left: 100, width: 155 };
    const sections = findDetachedSections(active, overlap, "placed");

    expect(sections).toEqual([
      { x: 255, y: 200, width: 45, height: 28, side: "right" },
    ]);
    expect(overlap.width + sections.reduce((sum, section) => sum + section.width, 0)).toBe(
      active.width,
    );
  });

  it("returns the unsupported left interval", () => {
    expect(
      findDetachedSections(active, { left: 145, width: 155 }, "placed"),
    ).toEqual([{ x: 100, y: 200, width: 45, height: 28, side: "left" }]);
  });

  it("returns no section for perfect placement and the full floor for a miss", () => {
    expect(findDetachedSections(active, { left: 100, width: 200 }, "placed")).toEqual([]);
    expect(findDetachedSections(active, { left: 300, width: 0 }, "missed")).toEqual([
      { ...active, side: "full" },
    ]);
  });
});
