import { getWordById } from "../data/vocabulary";
import { buildChoices } from "./placementTest";
import type { PlacementQuestion, VocabWord } from "../types";

type RandomFn = () => number;

function shuffle<T>(items: T[], random: RandomFn): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectDailyTestWords(
  seenWordIds: string[],
  count: number,
  random: RandomFn = Math.random
): VocabWord[] {
  const seenWords = seenWordIds
    .map((id) => getWordById(id))
    .filter((w): w is VocabWord => w !== undefined);
  return shuffle(seenWords, random).slice(0, count);
}

export function generateDailyTest(
  seenWordIds: string[],
  count = 20,
  random: RandomFn = Math.random
): PlacementQuestion[] {
  const selectedWords = selectDailyTestWords(seenWordIds, count, random);
  const questions = selectedWords.map((word) => ({
    word,
    choices: buildChoices(word, random),
  }));
  return shuffle(questions, random);
}
