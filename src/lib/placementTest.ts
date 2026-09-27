import { getWordsForTopic, topics } from "../data/vocabulary";
import type { PlacementAnswer, PlacementQuestion, TopicStats, VocabWord } from "../types";

type RandomFn = () => number;

function shuffle<T>(items: T[], random: RandomFn): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectPlacementWords(
  count: number,
  random: RandomFn = Math.random
): VocabWord[] {
  const remainingByTopic = new Map(
    topics.map((topic) => [topic.id, shuffle(getWordsForTopic(topic.id), random)])
  );
  const shuffledTopicIds = shuffle(
    topics.map((topic) => topic.id),
    random
  );
  const selected: VocabWord[] = [];

  while (selected.length < count) {
    let pickedAny = false;

    for (const topicId of shuffledTopicIds) {
      if (selected.length >= count) break;

      const pool = remainingByTopic.get(topicId)!;
      const next = pool.pop();
      if (next) {
        selected.push(next);
        pickedAny = true;
      }
    }

    if (!pickedAny) break;
  }

  return selected;
}

export function buildChoices(word: VocabWord, random: RandomFn = Math.random): VocabWord[] {
  const sameTopicOthers = getWordsForTopic(word.topicId).filter((w) => w.id !== word.id);
  const distractors = shuffle(sameTopicOthers, random).slice(0, 3);
  return shuffle([word, ...distractors], random);
}

export function generatePlacementTest(
  count = 30,
  random: RandomFn = Math.random
): PlacementQuestion[] {
  const selectedWords = selectPlacementWords(count, random);
  const questions = selectedWords.map((word) => ({
    word,
    choices: buildChoices(word, random),
  }));
  return shuffle(questions, random);
}

export function computeTopicStats(answers: PlacementAnswer[]): TopicStats {
  const stats: TopicStats = {};

  for (const answer of answers) {
    const stat = stats[answer.topicId] ?? { correct: 0, total: 0 };
    stat.total += 1;
    if (answer.correct) {
      stat.correct += 1;
    }
    stats[answer.topicId] = stat;
  }

  return stats;
}

export function findWeakestTopicId(stats: TopicStats): string | undefined {
  let weakestId: string | undefined;
  let weakestRatio = Infinity;

  for (const topic of topics) {
    const stat = stats[topic.id];
    if (!stat || stat.total === 0) continue;

    const ratio = stat.correct / stat.total;
    if (ratio < weakestRatio) {
      weakestRatio = ratio;
      weakestId = topic.id;
    }
  }

  return weakestId;
}
