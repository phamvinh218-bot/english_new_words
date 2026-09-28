import type { PlacementResult } from "../types";

const STORAGE_KEY = "vocab-daily-test-history";

function readHistory(): PlacementResult[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlacementResult[]) : [];
  } catch {
    return [];
  }
}

export function saveDailyTestResult(result: PlacementResult): void {
  try {
    const history = readHistory();
    history.push(result);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage unavailable (e.g. private browsing) — the result just won't persist.
  }
}

export function getDailyTestHistory(): PlacementResult[] {
  return readHistory();
}
