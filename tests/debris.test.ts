import { describe, expect, it } from "vitest";

import { advanceMasonry, createMasonryPieces } from "../src/game/debris";
import type { DetachedSection } from "../src/game/model";

describe("masonry debris", () => {
  const rightSection: DetachedSection = {
    x: 260,
    y: 400,
    width: 40,
    height: 28,
    side: "right",
  };

  it("tiles the detached section into at least four deterministic pieces", () => {
    const pieces = createMasonryPieces(rightSection, 3);
    const area = pieces.reduce((sum, piece) => sum + piece.width * piece.height, 0);

    expect(pieces.length).toBeGreaterThanOrEqual(4);
    expect(area).toBeCloseTo(rightSection.width * rightSection.height, 6);
    expect(pieces.every((piece) => piece.side === "right" && piece.velocityX > 0)).toBe(
      true,
    );
    expect(createMasonryPieces(rightSection, 3)).toEqual(pieces);
  });

  it("applies gravity, rotation, and finite lifetime", () => {
    const pieces = createMasonryPieces(rightSection, 3);
    const advanced = advanceMasonry(pieces, 0.25, 640, 0);

    expect(advanced[0]?.y).toBeGreaterThan(pieces[0]?.y ?? 0);
    expect(advanced[0]?.velocityY).toBeGreaterThan(pieces[0]?.velocityY ?? 0);
    expect(advanced[0]?.rotation).not.toBe(pieces[0]?.rotation);
    expect(advanceMasonry(pieces, 5, 640, 0)).toEqual([]);
  });

  it("biases left debris leftward and splits a full miss both ways", () => {
    const left = createMasonryPieces({ ...rightSection, side: "left" }, 2);
    const full = createMasonryPieces({ ...rightSection, side: "full" }, 2);

    expect(left.every((piece) => piece.velocityX < 0)).toBe(true);
    expect(full.some((piece) => piece.velocityX < 0)).toBe(true);
    expect(full.some((piece) => piece.velocityX > 0)).toBe(true);
  });
});
