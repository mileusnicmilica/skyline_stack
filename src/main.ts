import { DEFAULT_GAME_CONFIG, selectGameConfig } from "./game/config";
import { requestCoachAnalysis, SAFE_ANALYSIS_MESSAGE } from "./coach/coach-client";
import type { CoachAdvice } from "./coach/coach-client";
import { AnalysisRequestGate } from "./coach/request-gate";
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
const analyzeButton = requireElement<HTMLButtonElement>("#analyze-button");
const coachPanel = requireElement<HTMLElement>("#coach-panel");
const coachMessage = requireElement<HTMLElement>("#coach-message");
const coachAdvice = requireElement<HTMLElement>("#coach-advice");
const coachHeadline = requireElement<HTMLElement>("#coach-headline");
const coachTiming = requireElement<HTMLElement>("#coach-timing");
const coachFloor = requireElement<HTMLElement>("#coach-floor");
const coachTip = requireElement<HTMLElement>("#coach-tip");
const warningRegion = requireElement<HTMLElement>("#config-warning");
const configurableWindow = window as Window & { SKYLINE_STACK_CONFIG?: unknown };
const suppliedConfig = Object.hasOwn(configurableWindow, "SKYLINE_STACK_CONFIG")
  ? configurableWindow.SKYLINE_STACK_CONFIG
  : DEFAULT_GAME_CONFIG;
const configSelection = selectGameConfig(suppliedConfig);
const config = configSelection.config;
let session = createGameSession(config);
let previousTimestamp = performance.now();
const analysisGate = new AnalysisRequestGate();
let analysisController: AbortController | null = null;
let analysisState: "idle" | "pending" | "advice" | "unavailable" = "idle";

const timingLabels: Record<CoachAdvice["timingBias"], string> = {
  early: "uglavnom rano",
  late: "uglavnom kasno",
  mixed: "neujednačen",
  consistent: "stabilan",
};

function renderAnalysisState(advice?: CoachAdvice): void {
  coachPanel.hidden = analysisState === "idle";
  coachPanel.setAttribute("aria-busy", String(analysisState === "pending"));
  coachAdvice.hidden = analysisState !== "advice";
  coachMessage.hidden = analysisState === "advice";

  if (analysisState === "pending") coachMessage.textContent = "Analiziram završenu partiju…";
  if (analysisState === "unavailable") coachMessage.textContent = SAFE_ANALYSIS_MESSAGE;
  if (analysisState === "advice" && advice) {
    coachHeadline.textContent = advice.headline;
    coachTiming.textContent = timingLabels[advice.timingBias];
    coachFloor.textContent = String(advice.biggestMistakeFloor);
    coachTip.textContent = advice.tip;
  }
}

function resetAnalysis(): void {
  analysisGate.invalidate();
  analysisController?.abort();
  analysisController = null;
  analysisState = "idle";
  renderAnalysisState();
}

function restart(nextSession = requestRestart(session, config)): void {
  resetAnalysis();
  session = nextSession;
  previousTimestamp = performance.now();
  updatePage();
}

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
  analyzeButton.hidden = session.phase !== "gameOver";
  analyzeButton.disabled = session.phase !== "gameOver" || analysisState === "pending";
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

  const nextSession = requestKeyboardRestart(session, event.key, config);
  if (nextSession !== session) restart(nextSession);
});

canvas.addEventListener("pointerdown", () => {
  session = requestPointerDrop(session);
});

restartButton.addEventListener("click", () => {
  restart();
});

analyzeButton.addEventListener("click", async () => {
  if (session.phase !== "gameOver" || analysisState === "pending") return;
  const requestId = analysisGate.begin();
  if (requestId === null) return;
  analysisState = "pending";
  analysisController = new AbortController();
  renderAnalysisState();
  updatePage();

  const result = await requestCoachAnalysis({
    finalScore: session.score,
    startingWidth: config.startingBlockWidth,
    drops: session.drops.map((drop) => ({ ...drop })),
  }, { signal: analysisController.signal });

  if (!analysisGate.isCurrent(requestId) || session.phase !== "gameOver") return;
  analysisGate.finish(requestId);
  analysisController = null;
  if (result.ok) {
    analysisState = "advice";
    renderAnalysisState(result.advice);
  } else {
    analysisState = "unavailable";
    renderAnalysisState();
  }
  updatePage();
});

updatePage();
requestAnimationFrame(animate);
