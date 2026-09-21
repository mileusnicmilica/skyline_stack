import { describe, expect, it } from "vitest";

import {
  CONFIG_WARNING,
  DEFAULT_GAME_CONFIG,
  selectGameConfig,
} from "../src/game/config";

const valid = { ...DEFAULT_GAME_CONFIG };

describe("selectGameConfig", () => {
  it("accepts the complete valid seven-field contract without a warning", () => {
    expect(selectGameConfig(valid)).toEqual({
      config: valid,
      usedFallback: false,
      warning: null,
    });
  });

  it.each([
    ["non-object", null],
    ["missing own field", { ...valid, fallSpeed: undefined }],
    ["inherited fields", Object.create(valid) as unknown],
    ["wrong type", { ...valid, moveSpeed: "180" }],
    ["NaN", { ...valid, minOverlap: Number.NaN }],
    ["positive infinity", { ...valid, moveSpeed: Number.POSITIVE_INFINITY }],
    ["negative infinity", { ...valid, fallSpeed: Number.NEGATIVE_INFINITY }],
    ["zero canvas width", { ...valid, canvasWidth: 0 }],
    ["negative canvas height", { ...valid, canvasHeight: -1 }],
    ["zero starting width", { ...valid, startingBlockWidth: 0 }],
    ["zero block height", { ...valid, blockHeight: 0 }],
    ["zero move speed", { ...valid, moveSpeed: 0 }],
    ["negative fall speed", { ...valid, fallSpeed: -1 }],
    ["starting block wider than canvas", { ...valid, startingBlockWidth: 481 }],
    ["block as tall as canvas", { ...valid, blockHeight: 640 }],
    ["zero minimum overlap", { ...valid, minOverlap: 0 }],
    ["negative minimum overlap", { ...valid, minOverlap: -1 }],
    ["minimum wider than start", { ...valid, minOverlap: 201 }],
  ])("rejects %s with the whole-object fallback", (_label, candidate) => {
    const selection = selectGameConfig(candidate);

    expect(selection.config).toEqual(DEFAULT_GAME_CONFIG);
    expect(selection.config).not.toBe(DEFAULT_GAME_CONFIG);
    expect(selection.usedFallback).toBe(true);
    expect(selection.warning).toBe(CONFIG_WARNING);
  });

  it("returns a fresh default copy for every invalid selection", () => {
    const first = selectGameConfig({});
    const second = selectGameConfig({});

    expect(first.config).not.toBe(second.config);
    first.config.canvasWidth = 1;
    expect(second.config.canvasWidth).toBe(DEFAULT_GAME_CONFIG.canvasWidth);
  });
});

