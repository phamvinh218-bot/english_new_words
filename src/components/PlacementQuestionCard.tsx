import { useEffect, useState } from "react";
import { isSpeechSupported, speak } from "../lib/speech";
import type { PlacementAnswer, PlacementQuestion } from "../types";

interface PlacementQuestionCardProps {
  question: PlacementQuestion;
  onNext: (answer: PlacementAnswer) => void;
}

export default function PlacementQuestionCard({ question, onNext }: PlacementQuestionCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const speechSupported = isSpeechSupported();

  useEffect(() => {
    setSelectedId(null);
    speak(question.word.word);
  }, [question]);

  function handleSelect(choiceId: string) {
    if (selectedId) return;
    setSelectedId(choiceId);
  }

  function handleNext() {
    if (!selectedId) return;
    onNext({
      wordId: question.word.id,
      topicId: question.word.topicId,
      correct: selectedId === question.word.id,
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-10 shadow-lg">
      <h2 className="text-4xl font-bold">{question.word.word}</h2>

      {speechSupported ? (
        <button
          type="button"
          onClick={() => speak(question.word.word)}
          aria-label="Listen"
          className="rounded-full bg-sky-400 px-6 py-3 text-2xl text-white shadow transition-transform active:scale-95"
        >
          🔊
        </button>
      ) : (
        <p className="text-sm text-slate-400">Sound isn't available on this device.</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {question.choices.map((choice) => {
          const isCorrectChoice = choice.id === question.word.id;
          const isSelected = choice.id === selectedId;
          const showFeedback = selectedId !== null;

          let stateClass = "bg-slate-100 hover:bg-slate-200";
          if (showFeedback && isCorrectChoice) {
            stateClass = "bg-emerald-400";
          } else if (showFeedback && isSelected) {
            stateClass = "bg-rose-400";
          }

          return (
            <button
              key={choice.id}
              type="button"
              disabled={selectedId !== null}
              onClick={() => handleSelect(choice.id)}
              aria-label={choice.word}
              className={`flex h-28 w-28 items-center justify-center rounded-3xl text-6xl shadow transition-colors ${stateClass}`}
            >
              <span aria-hidden="true">{choice.emoji}</span>
            </button>
          );
        })}
      </div>

      {selectedId && (
        <button
          type="button"
          onClick={handleNext}
          className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Next
        </button>
      )}
    </div>
  );
}
