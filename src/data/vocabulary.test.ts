import { describe, expect, test } from "vitest";
import { getTopicById, getWordById, getWordsForTopic, topics, words } from "./vocabulary";

describe("vocabulary data integrity", () => {
  test("every word references a topic that exists", () => {
    const topicIds = new Set(topics.map((t) => t.id));
    for (const word of words) {
      expect(topicIds.has(word.topicId)).toBe(true);
    }
  });

  test("word ids are unique", () => {
    const ids = words.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("topic ids are unique", () => {
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every topic has at least 5 words", () => {
    for (const topic of topics) {
      expect(getWordsForTopic(topic.id).length).toBeGreaterThanOrEqual(5);
    }
  });

  test("getTopicById returns the matching topic", () => {
    expect(getTopicById("animals")?.name).toBe("Animals");
    expect(getTopicById("nonexistent")).toBeUndefined();
  });

  test("getWordById returns the matching word", () => {
    expect(getWordById("animals-dog")?.word).toBe("Dog");
  });
});
