// Follow before the hanging floor reaches the crane boom. The smaller safety
// inset protects that relationship even when a new floor appears before the
// eased camera has reached its target.
const CAMERA_FOLLOW_SCREEN_Y = 100;
const MINIMUM_HANGING_SCREEN_Y = 64;
const CAMERA_EASING_PER_SECOND = 6;

export function getCameraTarget(hangingWorldY: number): number {
  return Math.max(0, CAMERA_FOLLOW_SCREEN_Y - hangingWorldY);
}

export function getMinimumCameraOffset(hangingWorldY: number): number {
  return Math.max(0, MINIMUM_HANGING_SCREEN_Y - hangingWorldY);
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
