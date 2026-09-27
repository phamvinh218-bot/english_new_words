import { useEffect } from "react";
import { isSpeechSupported, speak } from "../lib/speech";
import type { ProgressStatus, VocabWord } from "../types";

interface FlashcardProps {
  word: VocabWord;
  onAnswer: (status: ProgressStatus) => void;
}

export default function Flashcard({ word, onAnswer }: FlashcardProps) {
  const speechSupported = isSpeechSupported();

  useEffect(() => {
    speak(word.word);
  }, [word]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-10 shadow-lg">
      <span className="text-8xl" aria-hidden="true">
        {word.emoji}
      </span>
      <h2 className="text-4xl font-bold">{word.word}</h2>

      {speechSupported ? (
        <button
          type="button"
          onClick={() => speak(word.word)}
          aria-label="Listen"
          className="rounded-full bg-sky-400 px-6 py-3 text-2xl text-white shadow transition-transform active:scale-95"
        >
          🔊
        </button>
      ) : (
        <p className="text-sm text-slate-400">Sound isn't available on this device.</p>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onAnswer("learning")}
          className="rounded-full bg-amber-400 px-6 py-4 text-lg font-bold text-white shadow transition-transform active:scale-95"
        >
          Still learning 🌱
        </button>
        <button
          type="button"
          onClick={() => onAnswer("known")}
          className="rounded-full bg-emerald-500 px-6 py-4 text-lg font-bold text-white shadow transition-transform active:scale-95"
        >
          I know it! ✅
        </button>
      </div>
    </div>
  );
}
