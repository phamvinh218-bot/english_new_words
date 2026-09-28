import { Link, useNavigate } from "react-router-dom";
import { generateDailyTest } from "../lib/dailyTest";
import { getAllProgress } from "../lib/progress";

export default function DailyTestIntro() {
  const navigate = useNavigate();
  const seenWordIds = Object.keys(getAllProgress());

  function handleStart() {
    const questions = generateDailyTest(seenWordIds);
    navigate("/daily-test/quiz", { state: { questions } });
  }

  if (seenWordIds.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
        <h1 className="text-4xl font-extrabold text-slate-700">Daily Check-up 🎯</h1>
        <p className="text-xl text-slate-500">
          Learn some words first, then come back to check up!
        </p>
        <Link
          to="/"
          className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Back to Word Explorer
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Daily Check-up 🎯</h1>
      <p className="text-xl text-slate-500">
        Quick daily check-up! Let's see what you remember.
      </p>
      <button
        type="button"
        onClick={handleStart}
        className="rounded-full bg-emerald-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
      >
        Start Test
      </button>
    </div>
  );
}
