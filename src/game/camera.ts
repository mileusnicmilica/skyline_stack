// Keep the base and first five accepted floors visually anchored. Camera
// follow begins only when the next hanging floor would move above the Canvas.
const CAMERA_FOLLOW_EDGE_Y = 0;
const CAMERA_EASING_PER_SECOND = 6;

export function getCameraTarget(hangingWorldY: number): number {
  return Math.max(0, CAMERA_FOLLOW_EDGE_Y - hangingWorldY);
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
