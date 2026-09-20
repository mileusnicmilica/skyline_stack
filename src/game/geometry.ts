export type HorizontalInterval = {
  x: number;
  width: number;
};

export type HorizontalIntersection = {
  left: number;
  width: number;
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

