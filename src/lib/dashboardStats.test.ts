import { beforeEach, describe, expect, test } from "vitest";
import { getOverallStats, getScoreTrend, getTopicBreakdown } from "./dashboardStats";
import { recordProgress } from "./progress";
import { saveDailyTestResult } from "./dailyTestStorage";
import { topics, words } from "../data/vocabulary";

beforeEach(() => {
  window.localStorage.clear();
});

describe("getOverallStats", () => {
  test("returns 0 known and the full word count when nothing has been learned", () => {
    expect(getOverallStats()).toEqual({ knownCount: 0, totalWords: words.length });
  });

  test("counts only words marked known, not learning", () => {
    recordProgress("animals-dog", "known");
    recordProgress("animals-cat", "learning");
    recordProgress("colors-red", "known");

    expect(getOverallStats()).toEqual({ knownCount: 2, totalWords: words.length });
  });
});

describe("getTopicBreakdown", () => {
  test("returns one entry per topic, in canonical order, all at 0 when nothing is learned", () => {
    const breakdown = getTopicBreakdown();
    expect(breakdown).toHaveLength(topics.length);
    expect(breakdown.map((b) => b.topicId)).toEqual(topics.map((t) => t.id));
    for (const entry of breakdown) {
      expect(entry.knownCount).toBe(0);
      expect(entry.totalCount).toBeGreaterThan(0);
    }
  });

  test("counts known words per topic correctly", () => {
    recordProgress("animals-dog", "known");
    recordProgress("animals-cat", "known");
    recordProgress("animals-fish", "learning");
    recordProgress("colors-red", "known");

    const breakdown = getTopicBreakdown();
    const animals = breakdown.find((b) => b.topicId === "animals")!;
    const colors = breakdown.find((b) => b.topicId === "colors")!;

    expect(animals.knownCount).toBe(2);
    expect(colors.knownCount).toBe(1);
  });
});

describe("getScoreTrend", () => {
  test("returns an empty array when no daily tests have been taken", () => {
    expect(getScoreTrend()).toEqual([]);
  });

  test("maps results to rounded percentages, sorted oldest to newest", () => {
    saveDailyTestResult({ completedAt: 2000, totalQuestions: 20, correctCount: 15, topicStats: {} });
    saveDailyTestResult({ completedAt: 1000, totalQuestions: 3, correctCount: 1, topicStats: {} });

    expect(getScoreTrend()).toEqual([
      { completedAt: 1000, percentage: 33 },
      { completedAt: 2000, percentage: 75 },
    ]);
  });

  test("caps at the given limit, keeping only the most recent entries", () => {
    for (let i = 0; i < 20; i++) {
      saveDailyTestResult({
        completedAt: i,
        totalQuestions: 10,
        correctCount: 10,
        topicStats: {},
      });
    }

    const trend = getScoreTrend(5);
    expect(trend).toHaveLength(5);
    expect(trend.map((p) => p.completedAt)).toEqual([15, 16, 17, 18, 19]);
  });
});
