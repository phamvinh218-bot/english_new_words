import { afterEach, describe, expect, test, vi } from "vitest";
import { isSpeechSupported, speak } from "./speech";

afterEach(() => {
  delete (window as any).speechSynthesis;
  delete (window as any).SpeechSynthesisUtterance;
});

describe("speech", () => {
  test("isSpeechSupported returns false when speechSynthesis is missing", () => {
    expect(isSpeechSupported()).toBe(false);
  });

  test("isSpeechSupported returns true when speechSynthesis exists", () => {
    (window as any).speechSynthesis = { speak: vi.fn(), cancel: vi.fn() };
    expect(isSpeechSupported()).toBe(true);
  });

  test("speak() does nothing when speech is unsupported", () => {
    expect(() => speak("Dog")).not.toThrow();
  });

  test("speak() cancels any pending speech and speaks a slow, en-US utterance", () => {
    const cancel = vi.fn();
    const speakFn = vi.fn();
    (window as any).speechSynthesis = { speak: speakFn, cancel };
    (window as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text: string) => ({
      text,
      lang: "",
      rate: 1,
    }));

    speak("Dog");

    expect(cancel).toHaveBeenCalled();
    expect(speakFn).toHaveBeenCalledTimes(1);
    const utterance = speakFn.mock.calls[0][0];
    expect(utterance.text).toBe("Dog");
    expect(utterance.lang).toBe("en-US");
    expect(utterance.rate).toBe(0.85);
  });
});
