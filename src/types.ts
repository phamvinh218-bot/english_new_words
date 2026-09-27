export interface Topic {
  id: string;
  name: string;
  emoji: string;
  colorClass: string;
}

export interface VocabWord {
  id: string;
  word: string;
  topicId: string;
  emoji: string;
}

export type ProgressStatus = "known" | "learning";

export interface WordProgress {
  status: ProgressStatus;
  lastSeen: number;
  timesSeen: number;
}

export type ProgressStore = Record<string, WordProgress>;

export interface SessionResult {
  wordId: string;
  status: ProgressStatus;
}
