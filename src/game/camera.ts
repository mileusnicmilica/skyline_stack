// Keep the base and first five accepted floors visually anchored. Once the
// next hanging floor moves above the Canvas, follow it at a stable inset so
// the crane cable keeps its intended visual length instead of collapsing.
const CAMERA_FOLLOW_THRESHOLD_Y = 0;
const CAMERA_FOLLOW_SCREEN_Y = 100;
const CAMERA_EASING_PER_SECOND = 6;

export function getCameraTarget(hangingWorldY: number): number {
  return hangingWorldY < CAMERA_FOLLOW_THRESHOLD_Y
    ? CAMERA_FOLLOW_SCREEN_Y - hangingWorldY
    : 0;
}

export function advanceCamera(
  currentOffset: number,
  targetOffset: number,
  deltaSeconds: number,
): number {
  const safeTarget = Math.max(0, targetOffset);
  const factor = Math.min(1, Math.max(0, deltaSeconds) * CAMERA_EASING_PER_SECOND);
  return Math.max(0, currentOffset + (safeTarget - currentOffset) * factor);
}

export function worldToScreenY(worldY: number, cameraOffset: number): number {
  return worldY + cameraOffset;
}
