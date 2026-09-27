import { describe, expect, test } from "vitest";
import {
  buildChoices,
  computeTopicStats,
  findWeakestTopicId,
  generatePlacementTest,
  selectPlacementWords,
} from "./placementTest";
import { topics, words } from "../data/vocabulary";

function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe("selectPlacementWords", () => {
  test("selects the requested number of unique words", () => {
    const selected = selectPlacementWords(30, createSeededRandom(1));
    expect(selected).toHaveLength(30);
    expect(new Set(selected.map((w) => w.id)).size).toBe(30);
  });

  test("draws from every topic", () => {
    const selected = selectPlacementWords(30, createSeededRandom(2));
    const topicIds = new Set(selected.map((w) => w.topicId));
    expect(topicIds.size).toBe(topics.length);
  });

  test("never selects more words than exist", () => {
    const selected = selectPlacementWords(10000, createSeededRandom(3));
    expect(selected.length).toBe(words.length);
  });
});

describe("buildChoices", () => {
  test("returns 4 unique choices including the target word, all from its topic", () => {
    const word = words.find((w) => w.id === "animals-dog")!;
    const choices = buildChoices(word, createSeededRandom(4));

    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((c) => c.id)).size).toBe(4);
    expect(choices.map((c) => c.id)).toContain(word.id);
    for (const choice of choices) {
      expect(choice.topicId).toBe("animals");
    }
  });
});

describe("generatePlacementTest", () => {
  test("generates the requested number of questions, each with 4 choices containing the answer", () => {
    const test_ = generatePlacementTest(30, createSeededRandom(5));
    expect(test_).toHaveLength(30);
    for (const question of test_) {
      expect(question.choices).toHaveLength(4);
      expect(question.choices.map((c) => c.id)).toContain(question.word.id);
    }
  });
});

describe("computeTopicStats", () => {
  test("tallies correct and total per topic", () => {
    const stats = computeTopicStats([
      { wordId: "animals-dog", topicId: "animals", correct: true },
      { wordId: "animals-cat", topicId: "animals", correct: false },
      { wordId: "colors-red", topicId: "colors", correct: true },
    ]);

    expect(stats).toEqual({
      animals: { correct: 1, total: 2 },
      colors: { correct: 1, total: 1 },
    });
  });
});

describe("findWeakestTopicId", () => {
  test("returns the topic with the lowest correct ratio", () => {
    const weakest = findWeakestTopicId({
      animals: { correct: 8, total: 10 },
      colors: { correct: 1, total: 10 },
      food: { correct: 5, total: 10 },
    });

    expect(weakest).toBe("colors");
  });

  test("breaks ties using canonical topic order", () => {
    const weakest = findWeakestTopicId({
      food: { correct: 5, total: 10 },
      colors: { correct: 5, total: 10 },
    });

    expect(weakest).toBe("colors");
  });

  test("returns undefined when there are no stats", () => {
    expect(findWeakestTopicId({})).toBeUndefined();
  });
});
