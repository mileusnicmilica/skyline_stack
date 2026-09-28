import { describe, expect, it } from "vitest";

import { DEFAULT_GAME_CONFIG } from "../src/game/config";
import { advanceSession, createGameSession, resolveLanding } from "../src/game/engine";
import type { GameSession } from "../src/game/model";
import { renderGame } from "../src/game/render";

function captureCraneAndFloorY(session: GameSession) {
  let pathStartY = Number.NaN;
  let boomY = Number.NaN;
  let activeFloorY = Number.NaN;
  let strokeStyle = "";
  const gradient = { addColorStop() {} } as unknown as CanvasGradient;
  const context = {
    get strokeStyle() { return strokeStyle; },
    set strokeStyle(value: string) { strokeStyle = value; },
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    save() {},
    restore() {},
    beginPath() {},
    moveTo(_x: number, y: number) { pathStartY = y; },
    lineTo() {},
    stroke() {
      if (strokeStyle === "#f4b942") boomY = pathStartY;
    },
    strokeRect(_x: number, y: number) {
      if (strokeStyle === "#fff4c7") activeFloorY = y;
    },
    fillRect() {},
    ellipse() {},
    arc() {},
    fill() {},
    translate() {},
    rotate() {},
    setLineDash() {},
  } as unknown as CanvasRenderingContext2D;

  renderGame(context, session, DEFAULT_GAME_CONFIG);
  return { boomY, activeFloorY };
}

describe("crane rendering during camera follow", () => {
  it("never draws a newly spawned floor above the horizontal boom through eight floors", () => {
    let session = createGameSession(DEFAULT_GAME_CONFIG);

    for (let floor = 1; floor <= 8; floor += 1) {
      const support = session.placedBlocks.at(-1);
      if (!support) throw new Error("Expected a supporting floor.");
      session.activeBlock = {
        ...session.activeBlock,
        x: support.x,
        y: support.y - DEFAULT_GAME_CONFIG.blockHeight,
        motion: "falling",
      };
      session = resolveLanding(session, DEFAULT_GAME_CONFIG);

      for (const elapsed of [0, 1 / 60, 0.1, 1]) {
        session = advanceSession(session, DEFAULT_GAME_CONFIG, elapsed);
        const { boomY, activeFloorY } = captureCraneAndFloorY(session);
        expect(Number.isFinite(boomY)).toBe(true);
        expect(Number.isFinite(activeFloorY)).toBe(true);
        expect(activeFloorY).toBeGreaterThan(boomY + 10);
      }
    }
  });
});
