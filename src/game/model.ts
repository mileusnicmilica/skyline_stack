export type GamePhase = "playing" | "gameOver";
export type BlockRole = "base" | "placed" | "active";
export type BlockMotion = "stationary" | "moving" | "falling" | "missed";
export type Direction = -1 | 1;
export type DropTiming = "early" | "late" | "centered";
export type VisibleStatus = "Ready" | "Playing" | "Game Over";
export type DebrisSide = "left" | "right" | "full";

export type DropRecord = {
  floor: number;
  offsetPx: number;
  direction: Direction;
  timing: DropTiming;
  widthBefore: number;
  widthAfter: number;
};

export type Block = {
  x: number;
  y: number;
  width: number;
  height: number;
  role: BlockRole;
  motion: BlockMotion;
  tilt: number;
  floorNumber: number;
};

export type DetachedSection = {
  x: number;
  y: number;
  width: number;
  height: number;
  side: DebrisSide;
};

export type MasonryPiece = {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  angularVelocity: number;
  life: number;
  tone: 0 | 1 | 2;
  side: DebrisSide;
};

export type GameSession = {
  phase: GamePhase;
  score: number;
  drops: DropRecord[];
  placedBlocks: Block[];
  activeBlock: Block;
  direction: Direction;
  dropAccepted: boolean;
  swingPhase: number;
  cameraOffset: number;
  cameraTarget: number;
  debris: MasonryPiece[];
  impactPulse: number;
};

export function deriveStatus(session: GameSession): VisibleStatus {
  if (session.phase === "gameOver") {
    return "Game Over";
  }

  return session.score === 0 ? "Ready" : "Playing";
}
