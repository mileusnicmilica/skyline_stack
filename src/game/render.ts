import { worldToScreenY } from "./camera";
import type { GameConfig } from "./config";
import { getCraneGeometry, getHangingY } from "./crane";
import type { Block, GameSession, MasonryPiece } from "./model";

const FACADE_PALETTES = [
  { face: "#d95f45", light: "#f58a5e", shade: "#9f3e36", band: "#f2c078" },
  { face: "#3f78a8", light: "#70acd0", shade: "#28557f", band: "#d7e7df" },
  { face: "#d08b3e", light: "#edb35c", shade: "#985a2f", band: "#ffe1a1" },
  { face: "#7b6ba7", light: "#a497c9", shade: "#514874", band: "#e8d7bd" },
] as const;

const WINDOW_DARK = "#23465e";
const WINDOW_LIT = "#ffe59a";
const OUTLINE = "#263b50";

function drawCloud(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  opacity: number,
): void {
  context.save();
  context.globalAlpha = opacity;
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.ellipse(x, y, 30 * scale, 13 * scale, 0, 0, Math.PI * 2);
  context.ellipse(x + 25 * scale, y - 8 * scale, 24 * scale, 18 * scale, 0, 0, Math.PI * 2);
  context.ellipse(x + 52 * scale, y, 34 * scale, 14 * scale, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawSkylineLayer(
  context: CanvasRenderingContext2D,
  config: GameConfig,
  baseY: number,
  color: string,
  windowColor: string,
  scale: number,
  parallax: number,
): void {
  const heights = [72, 118, 88, 150, 104, 132, 78, 164, 96, 124, 84];
  const width = 38 * scale;
  context.save();
  context.translate(0, parallax);
  context.fillStyle = color;

  for (let index = 0; index < heights.length + 3; index += 1) {
    const x = index * width - 12;
    const height = heights[index % heights.length]! * scale;
    context.fillRect(x, baseY - height, width + 2, height);

    context.fillStyle = windowColor;
    context.globalAlpha = 0.38;
    for (let row = 0; row < Math.floor(height / 22); row += 1) {
      for (let column = 0; column < 2; column += 1) {
        if ((row + column + index) % 3 !== 0) continue;
        context.fillRect(x + 8 + column * 14, baseY - height + 12 + row * 20, 6, 8);
      }
    }
    context.globalAlpha = 1;
    context.fillStyle = color;
  }
  context.restore();
}

function drawBackground(
  context: CanvasRenderingContext2D,
  session: GameSession,
  config: GameConfig,
): void {
  const sky = context.createLinearGradient(0, 0, 0, config.canvasHeight);
  sky.addColorStop(0, "#3d9ed5");
  sky.addColorStop(0.52, "#8ed4ed");
  sky.addColorStop(1, "#f4d2a2");
  context.fillStyle = sky;
  context.fillRect(0, 0, config.canvasWidth, config.canvasHeight);

  const sun = context.createRadialGradient(76, 94, 4, 76, 94, 64);
  sun.addColorStop(0, "rgba(255, 244, 190, 0.95)");
  sun.addColorStop(1, "rgba(255, 244, 190, 0)");
  context.fillStyle = sun;
  context.fillRect(12, 30, 128, 128);

  const drift = Math.sin(session.swingPhase * 0.2) * 8;
  drawCloud(context, 26 + drift, 120, 0.72, 0.78);
  drawCloud(context, 322 - drift * 0.45, 202, 0.58, 0.62);
  drawCloud(context, 118 + drift * 0.2, 282, 0.46, 0.46);

  drawSkylineLayer(context, config, config.canvasHeight, "#7da7b4", "#d8edf0", 1.25, session.cameraOffset * 0.04);
  drawSkylineLayer(context, config, config.canvasHeight + 22, "#405f72", "#f6d795", 0.82, session.cameraOffset * 0.08);

  const haze = context.createLinearGradient(0, 420, 0, config.canvasHeight);
  haze.addColorStop(0, "rgba(255, 255, 255, 0)");
  haze.addColorStop(1, "rgba(236, 199, 153, 0.24)");
  context.fillStyle = haze;
  context.fillRect(0, 420, config.canvasWidth, config.canvasHeight - 420);
}

function drawWindowGrid(
  context: CanvasRenderingContext2D,
  block: Block,
  x: number,
  y: number,
): void {
  const usableWidth = Math.max(0, block.width - 18);
  const columns = Math.max(1, Math.floor(usableWidth / 19));
  const cellWidth = usableWidth / columns;
  const rows = block.height >= 36 ? 3 : block.height >= 26 ? 2 : 1;
  const top = y + 6;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const windowWidth = Math.max(3, Math.min(9, cellWidth - 6));
      const windowHeight = rows === 2 ? 5 : 8;
      const windowX = x + 8 + column * cellWidth + (cellWidth - windowWidth) / 2;
      const windowY = top + row * 9;
      const lit = (column * 3 + row + block.floorNumber) % 5 === 0;
      context.fillStyle = lit ? WINDOW_LIT : WINDOW_DARK;
      context.fillRect(windowX, windowY, windowWidth, windowHeight);
      context.fillStyle = "rgba(255, 255, 255, 0.35)";
      context.fillRect(windowX + 1, windowY + 1, Math.max(1, windowWidth * 0.35), 1);
    }
  }
}

function drawBuildingFloor(
  context: CanvasRenderingContext2D,
  block: Block,
  screenY: number,
  emphasized: boolean,
): void {
  if (block.width <= 0 || block.motion === "missed") return;

  const palette = FACADE_PALETTES[block.floorNumber % FACADE_PALETTES.length]!;
  const centerX = block.x + block.width / 2;
  const centerY = screenY + block.height / 2;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(block.tilt);
  context.translate(-centerX, -centerY);
  context.fillStyle = "rgba(25, 39, 52, 0.22)";
  context.fillRect(block.x + 5, screenY + 7, block.width, block.height);
  context.fillStyle = palette.face;
  context.fillRect(block.x, screenY, block.width, block.height);
  context.fillStyle = palette.light;
  context.fillRect(block.x + 3, screenY + 4, Math.max(0, block.width - 11), 4);
  context.fillStyle = palette.shade;
  context.fillRect(block.x + Math.max(0, block.width - 8), screenY, Math.min(8, block.width), block.height);
  context.fillStyle = palette.band;
  context.fillRect(block.x - 2, screenY, block.width + 4, 4);
  context.fillRect(block.x - 2, screenY + block.height - 4, block.width + 4, 4);
  drawWindowGrid(context, block, block.x, screenY);
  context.strokeStyle = emphasized ? "#fff4c7" : OUTLINE;
  context.lineWidth = emphasized ? 2.5 : 1.5;
  context.strokeRect(block.x, screenY, block.width, block.height);

  if (block.role === "base") {
    context.fillStyle = "#344957";
    context.fillRect(block.x - 14, screenY + block.height - 5, block.width + 28, 9);
    context.fillStyle = "#9db4b9";
    context.fillRect(block.x - 10, screenY + block.height - 3, block.width + 20, 2);
  }
  context.restore();
}

function drawCrane(
  context: CanvasRenderingContext2D,
  session: GameSession,
  config: GameConfig,
  verticalShake: number,
): void {
  const support = session.placedBlocks.at(-1);
  if (!support) return;

  const hangingY = getHangingY(support.y, config.blockHeight);
  const crane = getCraneGeometry(
    { x: session.activeBlock.x, y: hangingY, width: session.activeBlock.width },
    config,
  );
  const pivotY = worldToScreenY(crane.pivotY, session.cameraOffset) + verticalShake;
  const hookY = worldToScreenY(crane.hookY, session.cameraOffset) + verticalShake;
  const boomY = Math.max(18, pivotY - 11);

  context.save();
  context.lineCap = "round";
  context.strokeStyle = "rgba(24, 51, 64, 0.28)";
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(20, boomY + 4);
  context.lineTo(config.canvasWidth - 18, boomY + 4);
  context.stroke();
  context.strokeStyle = "#f4b942";
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(18, boomY);
  context.lineTo(config.canvasWidth - 18, boomY);
  context.stroke();
  context.strokeStyle = "#704c2f";
  context.lineWidth = 2;
  for (let x = 28; x < config.canvasWidth - 28; x += 26) {
    context.beginPath();
    context.moveTo(x, boomY - 5);
    context.lineTo(x + 18, boomY + 5);
    context.stroke();
  }
  context.fillStyle = "#d88b2e";
  context.fillRect(crane.pivotX - 11, boomY - 10, 22, 21);
  context.fillStyle = "#ffe18a";
  context.beginPath();
  context.arc(crane.pivotX, boomY, 4, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#2f3f49";
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(crane.pivotX, boomY + 10);
  context.lineTo(crane.hookX, hookY - 7);
  context.stroke();
  context.fillStyle = "#293a44";
  context.fillRect(crane.hookX - 5, hookY - 9, 10, 7);
  context.strokeStyle = "#293a44";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(crane.hookX, hookY - 1, 8, -Math.PI * 0.2, Math.PI * 0.85);
  context.stroke();
  if (session.activeBlock.motion !== "moving") {
    context.strokeStyle = "rgba(255, 244, 199, 0.7)";
    context.lineWidth = 1.5;
    context.setLineDash([4, 7]);
    context.beginPath();
    context.moveTo(session.activeBlock.x + session.activeBlock.width / 2, hookY + 6);
    context.lineTo(session.activeBlock.x + session.activeBlock.width / 2, hookY + 32);
    context.stroke();
  }
  context.restore();
}

function drawMasonryPiece(
  context: CanvasRenderingContext2D,
  piece: MasonryPiece,
  cameraOffset: number,
): void {
  const colors = ["#d95f45", "#9f3e36", "#f2c078"] as const;
  const y = worldToScreenY(piece.y, cameraOffset);
  context.save();
  context.translate(piece.x + piece.width / 2, y + piece.height / 2);
  context.rotate(piece.rotation);
  context.fillStyle = colors[piece.tone];
  context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
  context.fillStyle = "rgba(41, 50, 55, 0.42)";
  context.fillRect(-piece.width / 2, piece.height / 2 - 3, piece.width, 3);
  context.strokeStyle = "rgba(39, 49, 56, 0.7)";
  context.lineWidth = 1;
  context.strokeRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
  context.restore();

  if (piece.life > 2.65) {
    context.save();
    context.globalAlpha = Math.min(0.32, (piece.life - 2.65) * 0.55);
    context.fillStyle = "#efe1c6";
    context.beginPath();
    context.arc(piece.x + piece.width / 2, y + piece.height, 7, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

function drawGameOver(
  context: CanvasRenderingContext2D,
  session: GameSession,
  config: GameConfig,
): void {
  context.fillStyle = "rgba(21, 38, 51, 0.58)";
  context.fillRect(0, 0, config.canvasWidth, config.canvasHeight);
  context.fillStyle = "rgba(255, 247, 221, 0.96)";
  context.fillRect(54, config.canvasHeight / 2 - 76, config.canvasWidth - 108, 152);
  context.strokeStyle = "#263b50";
  context.lineWidth = 4;
  context.strokeRect(54, config.canvasHeight / 2 - 76, config.canvasWidth - 108, 152);
  context.fillStyle = "#d95f45";
  context.fillRect(62, config.canvasHeight / 2 - 68, config.canvasWidth - 124, 8);
  context.fillStyle = "#263b50";
  context.font = "900 34px Trebuchet MS, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("TOWER DOWN", config.canvasWidth / 2, config.canvasHeight / 2 - 22);
  context.fillStyle = "#9f3e36";
  context.font = "700 17px Trebuchet MS, sans-serif";
  context.fillText(`${session.score} ${session.score === 1 ? "FLOOR" : "FLOORS"} BUILT`, config.canvasWidth / 2, config.canvasHeight / 2 + 20);
  context.fillStyle = "#526575";
  context.font = "700 13px Trebuchet MS, sans-serif";
  context.fillText("PRESS R OR RESTART", config.canvasWidth / 2, config.canvasHeight / 2 + 50);
}

export function renderGame(
  context: CanvasRenderingContext2D,
  session: GameSession,
  config: GameConfig,
): void {
  drawBackground(context, session, config);
  const verticalShake = Math.sin(session.impactPulse * Math.PI * 7) * session.impactPulse * 2.4;
  drawCrane(context, session, config, verticalShake);

  for (const block of session.placedBlocks) {
    drawBuildingFloor(context, block, worldToScreenY(block.y, session.cameraOffset) + verticalShake, false);
  }
  drawBuildingFloor(context, session.activeBlock, worldToScreenY(session.activeBlock.y, session.cameraOffset) + verticalShake, true);
  for (const piece of session.debris) {
    drawMasonryPiece(context, piece, session.cameraOffset);
  }
  if (session.phase === "gameOver") drawGameOver(context, session, config);
}
