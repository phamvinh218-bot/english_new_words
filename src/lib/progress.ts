import type { ProgressStatus, ProgressStore, WordProgress } from "../types";

const STORAGE_KEY = "vocab-progress";

function readStore(): ProgressStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable (e.g. private browsing) — progress just won't persist.
  }
}

export function getProgress(wordId: string): WordProgress | undefined {
  return readStore()[wordId];
}

export function getAllProgress(): ProgressStore {
  return readStore();
}

export function recordProgress(wordId: string, status: ProgressStatus): WordProgress {
  const store = readStore();
  const existing = store[wordId];
  const updated: WordProgress = {
    status,
    lastSeen: Date.now(),
    timesSeen: (existing?.timesSeen ?? 0) + 1,
  };
  store[wordId] = updated;
  writeStore(store);
  return updated;
}
