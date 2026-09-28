import { beforeEach, describe, expect, test, vi } from "vitest";
import { getDailyTestHistory, saveDailyTestResult } from "./dailyTestStorage";
import type { PlacementResult } from "../types";

beforeEach(() => {
  window.localStorage.clear();
});

const resultA: PlacementResult = {
  completedAt: 1000,
  totalQuestions: 20,
  correctCount: 15,
  topicStats: { animals: { correct: 5, total: 5 } },
};

const resultB: PlacementResult = {
  completedAt: 2000,
  totalQuestions: 20,
  correctCount: 18,
  topicStats: { animals: { correct: 5, total: 5 } },
};

describe("daily test history storage", () => {
  test("getDailyTestHistory returns an empty array when nothing is stored", () => {
    expect(getDailyTestHistory()).toEqual([]);
  });

  test("saveDailyTestResult appends to the history", () => {
    saveDailyTestResult(resultA);
    saveDailyTestResult(resultB);
    expect(getDailyTestHistory()).toEqual([resultA, resultB]);
  });

  test("getDailyTestHistory returns an empty array if stored JSON is corrupted", () => {
    window.localStorage.setItem("vocab-daily-test-history", "{not valid json");
    expect(getDailyTestHistory()).toEqual([]);
  });

  test("saveDailyTestResult does not throw when localStorage.setItem fails", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => saveDailyTestResult(resultA)).not.toThrow();

    spy.mockRestore();
  });
});
