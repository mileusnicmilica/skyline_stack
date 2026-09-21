import type { DetachedSection, MasonryPiece } from "./model";

const TARGET_PIECE_WIDTH = 22;
const ROWS = 2;
const GRAVITY = 720;
const PIECE_LIFETIME = 3.2;

function horizontalVelocity(
  side: DetachedSection["side"],
  column: number,
  columns: number,
): number {
  const speed = 46 + column * 8;
  if (side === "left") return -speed;
  if (side === "right") return speed;
  return column < columns / 2 ? -speed : speed;
}

export function createMasonryPieces(
  section: DetachedSection,
  floorNumber: number,
): MasonryPiece[] {
  if (section.width <= 0 || section.height <= 0) return [];

  const columns = Math.max(2, Math.ceil(section.width / TARGET_PIECE_WIDTH));
  const pieceWidth = section.width / columns;
  const pieceHeight = section.height / ROWS;
  const pieces: MasonryPiece[] = [];

  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const sign = (row + column + floorNumber) % 2 === 0 ? 1 : -1;
      pieces.push({
        x: section.x + column * pieceWidth,
        y: section.y + row * pieceHeight,
        width: pieceWidth,
        height: pieceHeight,
        velocityX: horizontalVelocity(section.side, column, columns),
        velocityY: 22 + row * 18 + column * 3,
        rotation: sign * 0.025 * (column + 1),
        angularVelocity: sign * (1.8 + row * 0.7 + column * 0.12),
        life: PIECE_LIFETIME,
        tone: ((row + column + floorNumber) % 3) as 0 | 1 | 2,
        side: section.side,
      });
    }
  }

  return pieces;
}

export function advanceMasonry(
  pieces: readonly MasonryPiece[],
  deltaSeconds: number,
  canvasHeight: number,
  cameraOffset: number,
): MasonryPiece[] {
  const elapsed = Math.max(0, deltaSeconds);

  return pieces
    .map((piece) => {
      const velocityY = piece.velocityY + GRAVITY * elapsed;
      return {
        ...piece,
        x: piece.x + piece.velocityX * elapsed,
        y: piece.y + piece.velocityY * elapsed + 0.5 * GRAVITY * elapsed * elapsed,
        velocityY,
        rotation: piece.rotation + piece.angularVelocity * elapsed,
        life: piece.life - elapsed,
      };
    })
    .filter(
      (piece) => piece.life > 0 && piece.y + cameraOffset < canvasHeight + 160,
    );
}
