import { describe, expect, test } from "vitest";
import { generateDailyTest, selectDailyTestWords } from "./dailyTest";
import { words } from "../data/vocabulary";

function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe("selectDailyTestWords", () => {
  test("returns up to count words from the seen word ids", () => {
    const seenWordIds = ["animals-dog", "animals-cat", "colors-red", "colors-blue", "food-apple"];
    const selected = selectDailyTestWords(seenWordIds, 3, createSeededRandom(1));

    expect(selected).toHaveLength(3);
    for (const word of selected) {
      expect(seenWordIds).toContain(word.id);
    }
  });

  test("never returns more words than were seen", () => {
    const seenWordIds = ["animals-dog", "animals-cat"];
    const selected = selectDailyTestWords(seenWordIds, 20, createSeededRandom(2));
    expect(selected).toHaveLength(2);
  });

  test("returns an empty array when no words have been seen", () => {
    expect(selectDailyTestWords([], 20, createSeededRandom(3))).toEqual([]);
  });

  test("ignores unresolvable word ids defensively", () => {
    const selected = selectDailyTestWords(
      ["animals-dog", "not-a-real-word"],
      5,
      createSeededRandom(4)
    );
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe("animals-dog");
  });
});

describe("generateDailyTest", () => {
  test("generates one question per selected word, each with 4 choices containing the answer", () => {
    const seenWordIds = words.slice(0, 25).map((w) => w.id);
    const questions = generateDailyTest(seenWordIds, 20, createSeededRandom(5));

    expect(questions).toHaveLength(20);
    for (const question of questions) {
      expect(question.choices).toHaveLength(4);
      expect(question.choices.map((c) => c.id)).toContain(question.word.id);
      expect(seenWordIds).toContain(question.word.id);
    }
  });

  test("caps at the number of seen words when fewer than count", () => {
    const seenWordIds = ["animals-dog", "animals-cat", "colors-red"];
    const questions = generateDailyTest(seenWordIds, 20, createSeededRandom(6));
    expect(questions).toHaveLength(3);
  });
});
