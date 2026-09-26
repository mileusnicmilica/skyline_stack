import { advanceCamera, getCameraTarget } from "./camera";
import type { GameConfig } from "./config";
import {
  advanceSwingPhase,
  getHangingY,
  getSwingPosition,
} from "./crane";
import { advanceMasonry, createMasonryPieces } from "./debris";
import { findDetachedSections, intersectHorizontal } from "./geometry";
import type { Block, DropTiming, GameSession } from "./model";

const CENTERED_TOLERANCE_PX = 1;

function classifyTiming(offsetPx: number, direction: -1 | 1): DropTiming {
  if (Math.abs(offsetPx) <= CENTERED_TOLERANCE_PX) return "centered";
  return offsetPx * direction > 0 ? "late" : "early";
}

function getLastSupport(session: GameSession): Block {
  const support = session.placedBlocks.at(-1);
  if (!support) {
    throw new Error("A game session must contain a supporting floor.");
  }

  return support;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function createActiveFloor(
  support: Block,
  width: number,
  floorNumber: number,
  config: GameConfig,
): Block {
  const swing = getSwingPosition(0, width, config);
  return {
    x: swing.x,
    y: getHangingY(support.y, config.blockHeight),
    width,
    height: config.blockHeight,
    role: "active",
    motion: "moving",
    tilt: 0,
    floorNumber,
  };
}

export function createGameSession(config: GameConfig): GameSession {
  const base: Block = {
    x: (config.canvasWidth - config.startingBlockWidth) / 2,
    y: config.canvasHeight - config.blockHeight,
    width: config.startingBlockWidth,
    height: config.blockHeight,
    role: "base",
    motion: "stationary",
    tilt: 0,
    floorNumber: 0,
  };
  const activeBlock = createActiveFloor(base, config.startingBlockWidth, 1, config);

  return {
    phase: "playing",
    score: 0,
    drops: [],
    placedBlocks: [base],
    activeBlock,
    direction: 1,
    dropAccepted: false,
    swingPhase: 0,
    cameraOffset: 0,
    cameraTarget: getCameraTarget(activeBlock.y),
    debris: [],
    impactPulse: 0,
  };
}

function createDebrisForSections(
  session: GameSession,
  sections: ReturnType<typeof findDetachedSections>,
  floorNumber: number,
) {
  return [
    ...session.debris,
    ...sections.flatMap((section) => createMasonryPieces(section, floorNumber)),
  ];
}

export function resolveLanding(session: GameSession, config: GameConfig): GameSession {
  if (session.phase !== "playing" || session.activeBlock.motion !== "falling") {
    return session;
  }

  const support = getLastSupport(session);
  const overlap = intersectHorizontal(session.activeBlock, support);
  const contactY = support.y - session.activeBlock.height;
  const landedFloor = { ...session.activeBlock, y: contactY };
  const supportCenter = support.x + support.width / 2;
  const activeCenter = landedFloor.x + landedFloor.width / 2;
  const offsetPx = activeCenter - supportCenter;
  const dropRecord = {
    floor: session.activeBlock.floorNumber,
    offsetPx,
    direction: session.direction,
    timing: classifyTiming(offsetPx, session.direction),
    widthBefore: session.activeBlock.width,
    widthAfter: overlap.width,
  } as const;

  if (overlap.width < config.minOverlap) {
    const sections = findDetachedSections(landedFloor, overlap, "missed");
    return {
      ...session,
      phase: "gameOver",
      drops: [...session.drops, { ...dropRecord, widthAfter: 0 }],
      activeBlock: {
        ...landedFloor,
        motion: "missed",
      },
      debris: createDebrisForSections(
        session,
        sections,
        session.activeBlock.floorNumber,
      ),
      impactPulse: 1,
    };
  }

  const placedBlock: Block = {
    x: overlap.left,
    y: contactY,
    width: overlap.width,
    height: session.activeBlock.height,
    role: "placed",
    motion: "stationary",
    tilt: clamp(((activeCenter - supportCenter) / support.width) * 0.08, -0.055, 0.055),
    floorNumber: session.score + 1,
  };
  const sections = findDetachedSections(landedFloor, overlap, "placed");
  const activeBlock = createActiveFloor(
    placedBlock,
    overlap.width,
    session.score + 2,
    config,
  );

  return {
    ...session,
    phase: "playing",
    score: session.score + 1,
    drops: [...session.drops, dropRecord],
    placedBlocks: [...session.placedBlocks, placedBlock],
    activeBlock,
    direction: 1,
    dropAccepted: false,
    swingPhase: 0,
    cameraTarget: getCameraTarget(activeBlock.y),
    debris: createDebrisForSections(
      session,
      sections,
      session.activeBlock.floorNumber,
    ),
    impactPulse: 1,
  };
}

function advanceVisualState(
  session: GameSession,
  config: GameConfig,
  elapsed: number,
): GameSession {
  return {
    ...session,
    cameraOffset: advanceCamera(session.cameraOffset, session.cameraTarget, elapsed),
    debris: advanceMasonry(
      session.debris,
      elapsed,
      config.canvasHeight,
      session.cameraOffset,
    ),
    impactPulse: Math.max(0, session.impactPulse - elapsed * 1.8),
  };
}

export function advanceSession(
  session: GameSession,
  config: GameConfig,
  deltaSeconds: number,
): GameSession {
  const elapsed = Math.max(0, deltaSeconds);
  const advanced = advanceVisualState(session, config, elapsed);

  if (advanced.phase !== "playing") {
    return advanced;
  }

  if (advanced.activeBlock.motion === "moving") {
    const swingPhase = advanceSwingPhase(
      advanced.swingPhase,
      config.moveSpeed,
      elapsed,
    );
    const swing = getSwingPosition(swingPhase, advanced.activeBlock.width, config);

    return {
      ...advanced,
      swingPhase,
      direction: swing.direction,
      activeBlock: {
        ...advanced.activeBlock,
        x: swing.x,
        tilt: Math.sin(swingPhase) * 0.035,
      },
    };
  }

  if (advanced.activeBlock.motion === "falling") {
    const support = getLastSupport(advanced);
    const contactY = support.y - advanced.activeBlock.height;
    const nextY = advanced.activeBlock.y + config.fallSpeed * elapsed;
    const fallingSession: GameSession = {
      ...advanced,
      activeBlock: {
        ...advanced.activeBlock,
        y: Math.min(nextY, contactY),
      },
    };

    return nextY >= contactY
      ? resolveLanding(fallingSession, config)
      : fallingSession;
  }

  return advanced;
}

export function restartSession(session: GameSession, config: GameConfig): GameSession {
  return session.phase === "gameOver" ? createGameSession(config) : session;
}
