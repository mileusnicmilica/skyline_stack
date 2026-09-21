import type { GameConfig } from "./config";
import type { Direction } from "./model";

const SWING_RATE_DIVISOR = 100;
const MINIMUM_HANGING_CLEARANCE = 440;
const CABLE_LENGTH = 130;

export type SwingPosition = {
  x: number;
  direction: Direction;
};

export type CraneGeometry = {
  pivotX: number;
  pivotY: number;
  hookX: number;
  hookY: number;
};

export function advanceSwingPhase(
  phase: number,
  moveSpeed: number,
  deltaSeconds: number,
): number {
  const elapsed = Math.max(0, deltaSeconds);
  const next = phase + (moveSpeed / SWING_RATE_DIVISOR) * elapsed;
  return next % (Math.PI * 2);
}

export function getSwingPosition(
  phase: number,
  floorWidth: number,
  config: Pick<GameConfig, "canvasWidth">,
): SwingPosition {
  const halfFloorWidth = floorWidth / 2;
  const centerX = config.canvasWidth / 2;
  const amplitude = Math.max(0, centerX - halfFloorWidth);
  const floorCenter = centerX + Math.sin(phase) * amplitude;

  return {
    x: floorCenter - floorWidth / 2,
    direction: Math.cos(phase) >= 0 ? 1 : -1,
  };
}

export function getHangingY(supportY: number, blockHeight: number): number {
  return supportY - Math.max(MINIMUM_HANGING_CLEARANCE, blockHeight * 8);
}

export function getCraneGeometry(
  floor: { x: number; y: number; width: number; height?: number },
  config: Pick<GameConfig, "canvasWidth">,
): CraneGeometry {
  return {
    pivotX: config.canvasWidth / 2,
    pivotY: floor.y - CABLE_LENGTH,
    hookX: floor.x + floor.width / 2,
    hookY: floor.y,
  };
}
