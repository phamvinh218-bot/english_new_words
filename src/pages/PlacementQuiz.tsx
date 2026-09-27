import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import PlacementQuestionCard from "../components/PlacementQuestionCard";
import ProgressBar from "../components/ProgressBar";
import { computeTopicStats } from "../lib/placementTest";
import { savePlacementResult } from "../lib/placementStorage";
import { recordProgress } from "../lib/progress";
import type { PlacementAnswer, PlacementQuestion } from "../types";

interface QuizLocationState {
  questions?: PlacementQuestion[];
}

export default function PlacementQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);

  const state = location.state as QuizLocationState | null;
  const questions = state?.questions;

  if (!questions || questions.length === 0) {
    return <Navigate to="/placement-test" replace />;
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  function handleNext(answer: PlacementAnswer) {
    if (answer.correct) {
      recordProgress(answer.wordId, "known");
    }
    const nextAnswers = [...answers, answer];

    if (currentIndex === totalQuestions - 1) {
      const topicStats = computeTopicStats(nextAnswers);
      const result = {
        completedAt: Date.now(),
        totalQuestions: nextAnswers.length,
        correctCount: nextAnswers.filter((a) => a.correct).length,
        topicStats,
      };
      savePlacementResult(result);
      navigate("/placement-test/results", { state: { result } });
      return;
    }

    setAnswers(nextAnswers);
    setCurrentIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6">
      <ProgressBar current={currentIndex} total={totalQuestions} />
      <PlacementQuestionCard
        key={currentQuestion.word.id}
        question={currentQuestion}
        onNext={handleNext}
      />
    </div>
  );
}
