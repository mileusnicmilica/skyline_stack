import { DEFAULT_GAME_CONFIG, selectGameConfig } from "./game/config";
import { advanceSession, createGameSession } from "./game/engine";
import {
  requestKeyboardDrop,
  requestKeyboardRestart,
  requestPointerDrop,
  requestRestart,
} from "./game/input";
import { deriveStatus } from "./game/model";
import { renderGame } from "./game/render";
import "./style.css";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required page element is missing: ${selector}`);
  }
  return element;
}

function requireRenderingContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D rendering is unavailable.");
  }

  return context;
}

const canvas = requireElement<HTMLCanvasElement>("#game-canvas");
const context = requireRenderingContext(canvas);
const score = requireElement<HTMLElement>("#score");
const status = requireElement<HTMLElement>("#status");
const restartButton = requireElement<HTMLButtonElement>("#restart-button");
const warningRegion = requireElement<HTMLElement>("#config-warning");
const configurableWindow = window as Window & { SKYLINE_STACK_CONFIG?: unknown };
const suppliedConfig = Object.hasOwn(configurableWindow, "SKYLINE_STACK_CONFIG")
  ? configurableWindow.SKYLINE_STACK_CONFIG
  : DEFAULT_GAME_CONFIG;
const configSelection = selectGameConfig(suppliedConfig);
const config = configSelection.config;
let session = createGameSession(config);
let previousTimestamp = performance.now();

canvas.width = config.canvasWidth;
canvas.height = config.canvasHeight;
if (configSelection.warning !== null) {
  warningRegion.textContent = configSelection.warning;
  warningRegion.hidden = false;
}

function updatePage(): void {
  score.textContent = String(session.score);
  status.textContent = deriveStatus(session);
  restartButton.disabled = session.phase !== "gameOver";
  renderGame(context, session, config);
}

function animate(timestamp: number): void {
  const deltaSeconds = Math.min((timestamp - previousTimestamp) / 1000, 0.05);
  previousTimestamp = timestamp;
  session = advanceSession(session, config, deltaSeconds);
  updatePage();
  requestAnimationFrame(animate);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    session = requestKeyboardDrop(session, event.repeat);
    return;
  }

  session = requestKeyboardRestart(session, event.key, config);
});

canvas.addEventListener("pointerdown", () => {
  session = requestPointerDrop(session);
});

restartButton.addEventListener("click", () => {
  session = requestRestart(session, config);
  previousTimestamp = performance.now();
  updatePage();
});

updatePage();
requestAnimationFrame(animate);
