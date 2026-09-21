export type GameConfig = {
  canvasWidth: number;
  canvasHeight: number;
  startingBlockWidth: number;
  blockHeight: number;
  moveSpeed: number;
  fallSpeed: number;
  minOverlap: number;
};

export type ConfigSelection = {
  config: GameConfig;
  usedFallback: boolean;
  warning: string | null;
};

export const CONFIG_WARNING = "Invalid game configuration. Safe defaults are in use.";

const CONFIG_FIELDS = [
  "canvasWidth",
  "canvasHeight",
  "startingBlockWidth",
  "blockHeight",
  "moveSpeed",
  "fallSpeed",
  "minOverlap",
] as const satisfies readonly (keyof GameConfig)[];

export const DEFAULT_GAME_CONFIG: Readonly<GameConfig> = Object.freeze({
  canvasWidth: 480,
  canvasHeight: 640,
  startingBlockWidth: 200,
  blockHeight: 40,
  moveSpeed: 180,
  fallSpeed: 520,
  minOverlap: 8,
});

export function getDefaultGameConfig(): GameConfig {
  return { ...DEFAULT_GAME_CONFIG };
}

function isValidCandidate(input: unknown): input is GameConfig {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  for (const field of CONFIG_FIELDS) {
    if (!Object.hasOwn(input, field)) {
      return false;
    }

    const value = (input as Record<string, unknown>)[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return false;
    }
  }

  const candidate = input as GameConfig;
  return (
    candidate.startingBlockWidth <= candidate.canvasWidth &&
    candidate.blockHeight < candidate.canvasHeight &&
    candidate.minOverlap <= candidate.startingBlockWidth
  );
}

function copyCandidate(candidate: GameConfig): GameConfig {
  return {
    canvasWidth: candidate.canvasWidth,
    canvasHeight: candidate.canvasHeight,
    startingBlockWidth: candidate.startingBlockWidth,
    blockHeight: candidate.blockHeight,
    moveSpeed: candidate.moveSpeed,
    fallSpeed: candidate.fallSpeed,
    minOverlap: candidate.minOverlap,
  };
}

export function selectGameConfig(input: unknown): ConfigSelection {
  if (!isValidCandidate(input)) {
    return {
      config: getDefaultGameConfig(),
      usedFallback: true,
      warning: CONFIG_WARNING,
    };
  }

  return {
    config: copyCandidate(input),
    usedFallback: false,
    warning: null,
  };
}
