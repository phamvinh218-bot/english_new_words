import type { PlacementResult } from "../types";

const STORAGE_KEY = "vocab-placement";

export function savePlacementResult(result: PlacementResult): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // localStorage unavailable (e.g. private browsing) — the result just won't persist.
  }
}

export function getPlacementResult(): PlacementResult | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlacementResult) : undefined;
  } catch {
    return undefined;
  }
}
