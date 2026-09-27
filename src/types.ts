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

export interface PlacementQuestion {
  word: VocabWord;
  choices: VocabWord[];
}

export interface PlacementAnswer {
  wordId: string;
  topicId: string;
  correct: boolean;
}

export interface TopicStat {
  correct: number;
  total: number;
}

export type TopicStats = Record<string, TopicStat>;

export interface PlacementResult {
  completedAt: number;
  totalQuestions: number;
  correctCount: number;
  topicStats: TopicStats;
}
