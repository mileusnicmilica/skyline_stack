import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_CONFIG } from "../src/game/config";
import { createGameSession } from "../src/game/engine";
import {
  requestKeyboardDrop,
  requestKeyboardRestart,
  requestPointerDrop,
  requestRestart,
} from "../src/game/input";

describe("drop input", () => {
  it("rejects repeated Space events and accepts one fresh press", () => {
    const session = createGameSession(DEFAULT_GAME_CONFIG);

    expect(requestKeyboardDrop(session, true)).toBe(session);

    const accepted = requestKeyboardDrop(session, false);
    expect(accepted.activeBlock.motion).toBe("falling");
    expect(accepted.dropAccepted).toBe(true);
    expect(requestKeyboardDrop(accepted, false)).toBe(accepted);
  });

  it("routes pointer input through the same drop transition", () => {
    const keyboard = requestKeyboardDrop(createGameSession(DEFAULT_GAME_CONFIG), false);
    const pointer = requestPointerDrop(createGameSession(DEFAULT_GAME_CONFIG));

    expect(pointer).toEqual(keyboard);
  });

  it("ignores input while the active block is already falling", () => {
    const falling = requestPointerDrop(createGameSession(DEFAULT_GAME_CONFIG));

    expect(requestPointerDrop(falling)).toBe(falling);
    expect(requestKeyboardDrop(falling, false)).toBe(falling);
  });

  it("ignores drop input after Game Over", () => {
    const gameOver = createGameSession(DEFAULT_GAME_CONFIG);
    gameOver.phase = "gameOver";
    gameOver.activeBlock.motion = "missed";

    expect(requestPointerDrop(gameOver)).toBe(gameOver);
    expect(requestKeyboardDrop(gameOver, false)).toBe(gameOver);
  });

  it("accepts R and Restart only after Game Over and clears stale input", () => {
    const playing = createGameSession(DEFAULT_GAME_CONFIG);
    expect(requestKeyboardRestart(playing, "r", DEFAULT_GAME_CONFIG)).toBe(playing);
    expect(requestRestart(playing, DEFAULT_GAME_CONFIG)).toBe(playing);

    const gameOver = createGameSession(DEFAULT_GAME_CONFIG);
    gameOver.phase = "gameOver";
    gameOver.score = 3;
    gameOver.dropAccepted = true;
    gameOver.activeBlock.motion = "missed";

    const fromKey = requestKeyboardRestart(gameOver, "R", DEFAULT_GAME_CONFIG);
    const fromButton = requestRestart(gameOver, DEFAULT_GAME_CONFIG);

    expect(fromKey).toEqual(createGameSession(DEFAULT_GAME_CONFIG));
    expect(fromButton).toEqual(createGameSession(DEFAULT_GAME_CONFIG));
    expect(fromKey.dropAccepted).toBe(false);
  });
});
