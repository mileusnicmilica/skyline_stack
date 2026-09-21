export type HorizontalInterval = {
  x: number;
  width: number;
};

export type HorizontalIntersection = {
  left: number;
  width: number;
};

import type { DetachedSection } from "./model";

export type Rectangle = HorizontalInterval & {
  y: number;
  height: number;
};

export function intersectHorizontal(
  active: HorizontalInterval,
  support: HorizontalInterval,
): HorizontalIntersection {
  const left = Math.max(active.x, support.x);
  const right = Math.min(active.x + active.width, support.x + support.width);

  return {
    left,
    width: Math.max(0, right - left),
  };
}

export function findDetachedSections(
  active: Rectangle,
  overlap: HorizontalIntersection,
  outcome: "placed" | "missed",
): DetachedSection[] {
  if (outcome === "missed") {
    return [
      {
        x: active.x,
        y: active.y,
        width: active.width,
        height: active.height,
        side: "full",
      },
    ];
  }

  const sections: DetachedSection[] = [];
  const activeRight = active.x + active.width;
  const overlapRight = overlap.left + overlap.width;
  const leftWidth = Math.max(0, overlap.left - active.x);
  const rightWidth = Math.max(0, activeRight - overlapRight);

  if (leftWidth > 0) {
    sections.push({
      x: active.x,
      y: active.y,
      width: leftWidth,
      height: active.height,
      side: "left",
    });
  }

  if (rightWidth > 0) {
    sections.push({
      x: overlapRight,
      y: active.y,
      width: rightWidth,
      height: active.height,
      side: "right",
    });
  }

  return sections;
}
