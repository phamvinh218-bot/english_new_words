import { useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { getTopicById, getWordById, getWordsForTopic } from "../data/vocabulary";
import { recordProgress } from "../lib/progress";
import Flashcard from "../components/Flashcard";
import ProgressBar from "../components/ProgressBar";
import type { ProgressStatus, SessionResult, VocabWord } from "../types";

interface SessionLocationState {
  wordIds?: string[];
}

export default function Session() {
  const { topicId } = useParams<{ topicId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);

  const topic = topicId ? getTopicById(topicId) : undefined;

  if (!topic) {
    return <Navigate to="/" replace />;
  }

  const state = location.state as SessionLocationState | null;
  const wordIds = state?.wordIds ?? getWordsForTopic(topic.id).map((w) => w.id);
  const sessionWords: VocabWord[] = wordIds
    .map((id) => getWordById(id))
    .filter((w): w is VocabWord => w !== undefined);

  if (sessionWords.length === 0) {
    return <Navigate to={`/topic/${topic.id}`} replace />;
  }

  const currentWord = sessionWords[currentIndex];

  function handleAnswer(status: ProgressStatus) {
    recordProgress(currentWord.id, status);
    const nextResults = [...results, { wordId: currentWord.id, status }];

    if (currentIndex === sessionWords.length - 1) {
      navigate(`/topic/${topic.id}/summary`, { state: { results: nextResults } });
      return;
    }

    setResults(nextResults);
    setCurrentIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6">
      <ProgressBar current={currentIndex} total={sessionWords.length} />
      <Flashcard key={currentWord.id} word={currentWord} onAnswer={handleAnswer} />
    </div>
  );
}
