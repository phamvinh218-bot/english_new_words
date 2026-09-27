import { beforeEach, describe, expect, test, vi } from "vitest";
import { getPlacementResult, savePlacementResult } from "./placementStorage";
import type { PlacementResult } from "../types";

beforeEach(() => {
  window.localStorage.clear();
});

const sampleResult: PlacementResult = {
  completedAt: 1234567890,
  totalQuestions: 30,
  correctCount: 22,
  topicStats: { animals: { correct: 8, total: 10 } },
};

describe("placement result storage", () => {
  test("getPlacementResult returns undefined when nothing is stored", () => {
    expect(getPlacementResult()).toBeUndefined();
  });

  test("savePlacementResult persists and getPlacementResult reads it back", () => {
    savePlacementResult(sampleResult);
    expect(getPlacementResult()).toEqual(sampleResult);
  });

  test("savePlacementResult overwrites a previous result", () => {
    savePlacementResult(sampleResult);
    const updated: PlacementResult = { ...sampleResult, correctCount: 25 };
    savePlacementResult(updated);
    expect(getPlacementResult()).toEqual(updated);
  });

  test("getPlacementResult returns undefined if stored JSON is corrupted", () => {
    window.localStorage.setItem("vocab-placement", "{not valid json");
    expect(getPlacementResult()).toBeUndefined();
  });

  test("savePlacementResult does not throw when localStorage.setItem fails", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => savePlacementResult(sampleResult)).not.toThrow();

    spy.mockRestore();
  });
});
