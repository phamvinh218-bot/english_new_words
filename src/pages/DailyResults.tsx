import { Link, Navigate, useLocation } from "react-router-dom";
import type { PlacementResult } from "../types";

interface ResultsLocationState {
  result?: PlacementResult;
}

export default function DailyResults() {
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;
  const result = state?.result;

  if (!result) {
    return <Navigate to="/daily-test" replace />;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Check-up Complete! 🎉</h1>
      <p className="text-2xl text-emerald-600">
        {result.correctCount} / {result.totalQuestions} correct!
      </p>
      <p className="text-xl text-slate-500">Great job practicing today!</p>
      <Link
        to="/"
        className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
      >
        Back to Word Explorer
      </Link>
    </div>
  );
}
