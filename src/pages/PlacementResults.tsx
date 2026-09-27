import { Link, Navigate, useLocation } from "react-router-dom";
import { getTopicById } from "../data/vocabulary";
import { findWeakestTopicId } from "../lib/placementTest";
import type { PlacementResult } from "../types";

interface ResultsLocationState {
  result?: PlacementResult;
}

export default function PlacementResults() {
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;
  const result = state?.result;

  if (!result) {
    return <Navigate to="/placement-test" replace />;
  }

  const weakestTopicId = findWeakestTopicId(result.topicStats);
  const weakestTopic = weakestTopicId ? getTopicById(weakestTopicId) : undefined;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Test Complete! 🎉</h1>
      <p className="text-2xl text-emerald-600">
        {result.correctCount} / {result.totalQuestions} correct!
      </p>

      {weakestTopic && (
        <div className="rounded-3xl bg-amber-100 p-6">
          <p className="text-lg text-amber-700">⭐ Try this next:</p>
          <Link
            to={`/topic/${weakestTopic.id}`}
            className="mt-2 inline-block rounded-full bg-amber-400 px-6 py-3 text-lg font-bold text-white shadow transition-transform active:scale-95"
          >
            {weakestTopic.emoji} {weakestTopic.name}
          </Link>
        </div>
      )}

      <Link
        to="/"
        className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
      >
        Continue to Word Explorer
      </Link>
    </div>
  );
}
