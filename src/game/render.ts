import type { GameConfig } from "./config";
import type { Block, GameSession } from "./model";

const COLORS = {
  skyTop: "#11122f",
  skyBottom: "#281d4c",
  grid: "rgba(118, 244, 255, 0.08)",
  base: "#7d6bff",
  placed: "#55e6c1",
  active: "#ffcf5a",
  missed: "#ff5c8a",
  highlight: "rgba(255, 255, 255, 0.32)",
} as const;

function drawBlock(context: CanvasRenderingContext2D, block: Block): void {
  const fill =
    block.motion === "missed"
      ? COLORS.missed
      : block.role === "active"
        ? COLORS.active
        : block.role === "base"
          ? COLORS.base
          : COLORS.placed;

  context.fillStyle = fill;
  context.fillRect(block.x, block.y, block.width, block.height);
  context.fillStyle = COLORS.highlight;
  context.fillRect(block.x + 3, block.y + 3, Math.max(0, block.width - 6), 3);
}

export function renderGame(
  context: CanvasRenderingContext2D,
  session: GameSession,
  config: GameConfig,
): void {
  const background = context.createLinearGradient(0, 0, 0, config.canvasHeight);
  background.addColorStop(0, COLORS.skyTop);
  background.addColorStop(1, COLORS.skyBottom);
  context.fillStyle = background;
  context.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

  context.strokeStyle = COLORS.grid;
  context.lineWidth = 1;
  for (let x = 0; x <= config.canvasWidth; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, config.canvasHeight);
    context.stroke();
  }
  for (let y = 0; y <= config.canvasHeight; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(config.canvasWidth, y);
    context.stroke();
  }

  for (const block of session.placedBlocks) {
    drawBlock(context, block);
  }
  drawBlock(context, session.activeBlock);

  if (session.phase === "gameOver") {
    context.fillStyle = "rgba(9, 10, 26, 0.72)";
    context.fillRect(0, config.canvasHeight / 2 - 54, config.canvasWidth, 108);
    context.fillStyle = "#ffcf5a";
    context.font = "bold 32px 'Courier New', monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("GAME OVER", config.canvasWidth / 2, config.canvasHeight / 2 - 10);
    context.fillStyle = "#f8f4ff";
    context.font = "16px 'Courier New', monospace";
    context.fillText(
      `FINAL SCORE ${session.score}`,
      config.canvasWidth / 2,
      config.canvasHeight / 2 + 28,
    );
  }
}
