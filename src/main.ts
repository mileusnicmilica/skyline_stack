import { DEFAULT_GAME_CONFIG, selectGameConfig } from "./game/config";
import { requestCoachAnalysis, SAFE_ANALYSIS_MESSAGE } from "./coach/coach-client";
import type { CoachAdvice } from "./coach/coach-client";
import { AnalysisRequestGate } from "./coach/request-gate";
import { requestNextDrill, SAFE_DRILL_MESSAGE } from "./agent/next-drill-client";
import type { NextDrillRecommendation } from "./agent/next-drill-client";
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
const nextDrillButton = requireElement<HTMLButtonElement>("#next-drill-button");
const nextDrillPanel = requireElement<HTMLElement>("#next-drill-panel");
const nextDrillMessage = requireElement<HTMLElement>("#next-drill-message");
const nextDrillResult = requireElement<HTMLElement>("#next-drill-result");
const nextDrillTitle = requireElement<HTMLElement>("#next-drill-title");
const nextDrillInstruction = requireElement<HTMLElement>("#next-drill-instruction");
const nextDrillFinding = requireElement<HTMLElement>("#next-drill-finding");
const nextDrillEarly = requireElement<HTMLElement>("#next-drill-early");
const nextDrillLate = requireElement<HTMLElement>("#next-drill-late");
const nextDrillCentered = requireElement<HTMLElement>("#next-drill-centered");
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
const nextDrillGate = new AnalysisRequestGate();
let nextDrillController: AbortController | null = null;
let nextDrillState: "idle" | "pending" | "result" | "unavailable" = "idle";

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

function renderNextDrillState(recommendation?: NextDrillRecommendation): void {
  nextDrillPanel.hidden = nextDrillState === "idle";
  nextDrillPanel.setAttribute("aria-busy", String(nextDrillState === "pending"));
  nextDrillMessage.hidden = nextDrillState === "result";
  nextDrillResult.hidden = nextDrillState !== "result";
  if (nextDrillState === "idle") {
    nextDrillMessage.textContent = "";
    nextDrillTitle.textContent = "";
    nextDrillInstruction.textContent = "";
    nextDrillFinding.textContent = "";
    nextDrillEarly.textContent = "";
    nextDrillLate.textContent = "";
    nextDrillCentered.textContent = "";
  }
  if (nextDrillState === "pending") nextDrillMessage.textContent = "Tražim sledeću vežbu…";
  if (nextDrillState === "unavailable") nextDrillMessage.textContent = SAFE_DRILL_MESSAGE;
  if (nextDrillState === "result" && recommendation) {
    nextDrillTitle.textContent = recommendation.title;
    nextDrillInstruction.textContent = recommendation.instruction;
    nextDrillFinding.textContent = recommendation.evidence.finding;
    nextDrillEarly.textContent = String(recommendation.evidence.earlyCount);
    nextDrillLate.textContent = String(recommendation.evidence.lateCount);
    nextDrillCentered.textContent = String(recommendation.evidence.centeredCount);
  }
}

function resetNextDrill(): void {
  nextDrillGate.invalidate();
  nextDrillController?.abort();
  nextDrillController = null;
  nextDrillState = "idle";
  renderNextDrillState();
}

function restart(nextSession = requestRestart(session, config)): void {
  resetAnalysis();
  resetNextDrill();
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
  nextDrillButton.hidden = session.phase !== "gameOver";
  nextDrillButton.disabled = session.phase !== "gameOver" || nextDrillState === "pending";
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

nextDrillButton.addEventListener("click", async () => {
  if (session.phase !== "gameOver" || nextDrillState === "pending") return;
  const requestId = nextDrillGate.begin();
  if (requestId === null) return;
  nextDrillState = "pending";
  nextDrillController = new AbortController();
  renderNextDrillState();
  updatePage();

  const result = await requestNextDrill({
    goal: "choose_next_drill",
    finalScore: session.score,
    startingWidth: config.startingBlockWidth,
    drops: session.drops.map((drop) => ({ ...drop })),
  }, { signal: nextDrillController.signal });

  if (!nextDrillGate.isCurrent(requestId) || session.phase !== "gameOver") return;
  nextDrillGate.finish(requestId);
  nextDrillController = null;
  if (result.ok) {
    nextDrillState = "result";
    renderNextDrillState(result.recommendation);
  } else {
    nextDrillState = "unavailable";
    renderNextDrillState();
  }
  updatePage();
});

updatePage();
requestAnimationFrame(animate);
