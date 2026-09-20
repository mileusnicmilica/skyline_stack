export type GamePhase = "playing" | "gameOver";
export type BlockRole = "base" | "placed" | "active";
export type BlockMotion = "stationary" | "moving" | "falling" | "missed";
export type Direction = -1 | 1;
export type VisibleStatus = "Ready" | "Playing" | "Game Over";

export type Block = {
  x: number;
  y: number;
  width: number;
  height: number;
  role: BlockRole;
  motion: BlockMotion;
};

export type GameSession = {
  phase: GamePhase;
  score: number;
  placedBlocks: Block[];
  activeBlock: Block;
  direction: Direction;
  dropAccepted: boolean;
};

export function deriveStatus(session: GameSession): VisibleStatus {
  if (session.phase === "gameOver") {
    return "Game Over";
  }

  return session.score === 0 ? "Ready" : "Playing";
}

