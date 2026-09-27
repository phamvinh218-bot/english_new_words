import { beforeEach, describe, expect, test, vi } from "vitest";
import { getAllProgress, getProgress, recordProgress } from "./progress";

beforeEach(() => {
  window.localStorage.clear();
});

describe("progress persistence", () => {
  test("getProgress returns undefined for a word with no recorded progress", () => {
    expect(getProgress("animals-dog")).toBeUndefined();
  });

  test("recordProgress stores status and increments timesSeen", () => {
    recordProgress("animals-dog", "learning");
    const first = getProgress("animals-dog");
    expect(first?.status).toBe("learning");
    expect(first?.timesSeen).toBe(1);

    recordProgress("animals-dog", "known");
    const second = getProgress("animals-dog");
    expect(second?.status).toBe("known");
    expect(second?.timesSeen).toBe(2);
  });

  test("getAllProgress returns every recorded word", () => {
    recordProgress("animals-dog", "known");
    recordProgress("colors-red", "learning");
    const all = getAllProgress();
    expect(Object.keys(all).sort()).toEqual(["animals-dog", "colors-red"]);
  });

  test("getProgress returns undefined if stored JSON is corrupted", () => {
    window.localStorage.setItem("vocab-progress", "{not valid json");
    expect(getProgress("animals-dog")).toBeUndefined();
  });

  test("recordProgress does not throw when localStorage.setItem fails", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => recordProgress("animals-dog", "known")).not.toThrow();

    spy.mockRestore();
  });
});
