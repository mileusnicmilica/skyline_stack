import type { GameConfig } from "./config";
import { restartSession } from "./engine";
import type { GameSession } from "./model";

function requestDrop(session: GameSession): GameSession {
  if (
    session.phase !== "playing" ||
    session.activeBlock.motion !== "moving" ||
    session.dropAccepted
  ) {
    return session;
  }

  return {
    ...session,
    activeBlock: {
      ...session.activeBlock,
      motion: "falling",
    },
    dropAccepted: true,
  };
}

export function requestKeyboardDrop(session: GameSession, repeated: boolean): GameSession {
  return repeated ? session : requestDrop(session);
}

export function requestPointerDrop(session: GameSession): GameSession {
  return requestDrop(session);
}

export function requestRestart(session: GameSession, config: GameConfig): GameSession {
  return restartSession(session, config);
}

export function requestKeyboardRestart(
  session: GameSession,
  key: string,
  config: GameConfig,
): GameSession {
  return key.toLowerCase() === "r" ? requestRestart(session, config) : session;
}
