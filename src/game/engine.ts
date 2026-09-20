import type { GameConfig } from "./config";
import { intersectHorizontal } from "./geometry";
import type { Block, Direction, GameSession } from "./model";

const MOVING_LANE_GAP_IN_BLOCKS = 3;
const TOP_MARGIN_IN_BLOCKS = 1;

function getLastSupport(session: GameSession): Block {
  const support = session.placedBlocks.at(-1);
  if (!support) {
    throw new Error("A game session must contain a supporting block.");
  }

  return support;
}

function getMovingLaneY(supportY: number, blockHeight: number): number {
  return supportY - blockHeight * MOVING_LANE_GAP_IN_BLOCKS;
}

function moveWithinBounds(
  x: number,
  width: number,
  direction: Direction,
  distance: number,
  canvasWidth: number,
): { x: number; direction: Direction } {
  const maxX = Math.max(0, canvasWidth - width);
  let nextX = x + direction * distance;
  let nextDirection = direction;

  while (nextX < 0 || nextX > maxX) {
    if (nextX > maxX) {
      nextX = maxX - (nextX - maxX);
      nextDirection = -1;
    }
    if (nextX < 0) {
      nextX = -nextX;
      nextDirection = 1;
    }
  }

  return { x: nextX, direction: nextDirection };
}

export function createGameSession(config: GameConfig): GameSession {
  const base: Block = {
    x: (config.canvasWidth - config.startingBlockWidth) / 2,
    y: config.canvasHeight - config.blockHeight,
    width: config.startingBlockWidth,
    height: config.blockHeight,
    role: "base",
    motion: "stationary",
  };

  return {
    phase: "playing",
    score: 0,
    placedBlocks: [base],
    activeBlock: {
      x: 0,
      y: getMovingLaneY(base.y, config.blockHeight),
      width: config.startingBlockWidth,
      height: config.blockHeight,
      role: "active",
      motion: "moving",
    },
    direction: 1,
    dropAccepted: false,
  };
}

export function resolveLanding(session: GameSession, config: GameConfig): GameSession {
  if (session.phase !== "playing" || session.activeBlock.motion !== "falling") {
    return session;
  }

  const support = getLastSupport(session);
  const overlap = intersectHorizontal(session.activeBlock, support);
  const contactY = support.y - session.activeBlock.height;

  if (overlap.width < config.minOverlap) {
    return {
      ...session,
      phase: "gameOver",
      activeBlock: {
        ...session.activeBlock,
        y: contactY,
        motion: "missed",
      },
    };
  }

  const placedBlock: Block = {
    x: overlap.left,
    y: contactY,
    width: overlap.width,
    height: session.activeBlock.height,
    role: "placed",
    motion: "stationary",
  };
  let placedBlocks = [...session.placedBlocks, placedBlock];
  let activeY = getMovingLaneY(placedBlock.y, config.blockHeight);
  const topMargin = config.blockHeight * TOP_MARGIN_IN_BLOCKS;

  if (activeY < topMargin) {
    placedBlocks = placedBlocks.map((block) => ({
      ...block,
      y: block.y + config.blockHeight,
    }));
    activeY += config.blockHeight;
  }

  return {
    phase: "playing",
    score: session.score + 1,
    placedBlocks,
    activeBlock: {
      x: 0,
      y: activeY,
      width: overlap.width,
      height: config.blockHeight,
      role: "active",
      motion: "moving",
    },
    direction: 1,
    dropAccepted: false,
  };
}

export function advanceSession(
  session: GameSession,
  config: GameConfig,
  deltaSeconds: number,
): GameSession {
  if (session.phase !== "playing") {
    return session;
  }

  const elapsed = Math.max(0, deltaSeconds);

  if (session.activeBlock.motion === "moving") {
    const moved = moveWithinBounds(
      session.activeBlock.x,
      session.activeBlock.width,
      session.direction,
      config.moveSpeed * elapsed,
      config.canvasWidth,
    );

    return {
      ...session,
      direction: moved.direction,
      activeBlock: {
        ...session.activeBlock,
        x: moved.x,
      },
    };
  }

  if (session.activeBlock.motion === "falling") {
    const support = getLastSupport(session);
    const contactY = support.y - session.activeBlock.height;
    const nextY = session.activeBlock.y + config.fallSpeed * elapsed;
    const fallingSession: GameSession = {
      ...session,
      activeBlock: {
        ...session.activeBlock,
        y: Math.min(nextY, contactY),
      },
    };

    return nextY >= contactY ? resolveLanding(fallingSession, config) : fallingSession;
  }

  return session;
}

export function restartSession(session: GameSession, config: GameConfig): GameSession {
  return session.phase === "gameOver" ? createGameSession(config) : session;
}
