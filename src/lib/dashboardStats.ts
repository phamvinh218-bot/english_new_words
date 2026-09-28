import { getWordsForTopic, topics, words } from "../data/vocabulary";
import { getDailyTestHistory } from "./dailyTestStorage";
import { getAllProgress } from "./progress";

export interface TopicBreakdown {
  topicId: string;
  topicName: string;
  topicEmoji: string;
  knownCount: number;
  totalCount: number;
}

export interface ScoreTrendPoint {
  completedAt: number;
  percentage: number;
}

export function getOverallStats(): { knownCount: number; totalWords: number } {
  const progress = getAllProgress();
  const knownCount = Object.values(progress).filter((p) => p.status === "known").length;
  return { knownCount, totalWords: words.length };
}

export function getTopicBreakdown(): TopicBreakdown[] {
  const progress = getAllProgress();

  return topics.map((topic) => {
    const topicWords = getWordsForTopic(topic.id);
    const knownCount = topicWords.filter((w) => progress[w.id]?.status === "known").length;

    return {
      topicId: topic.id,
      topicName: topic.name,
      topicEmoji: topic.emoji,
      knownCount,
      totalCount: topicWords.length,
    };
  });
}

export function getScoreTrend(limit = 14): ScoreTrendPoint[] {
  const history = getDailyTestHistory();
  const sorted = [...history].sort((a, b) => a.completedAt - b.completedAt);

  return sorted.slice(-limit).map((result) => ({
    completedAt: result.completedAt,
    percentage: Math.round((result.correctCount / result.totalQuestions) * 100),
  }));
}
