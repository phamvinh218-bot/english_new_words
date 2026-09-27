import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import type { SessionResult } from "../types";

interface SummaryLocationState {
  results?: SessionResult[];
}

export default function Summary() {
  const { topicId } = useParams<{ topicId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as SummaryLocationState | null;
  const results = state?.results;

  if (!topicId || !results) {
    return <Navigate to={topicId ? `/topic/${topicId}` : "/"} replace />;
  }

  const knownCount = results.filter((r) => r.status === "known").length;
  const learningWordIds = results.filter((r) => r.status === "learning").map((r) => r.wordId);

  function handleReviewAgain() {
    navigate(`/topic/${topicId}/session`, { state: { wordIds: learningWordIds } });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Great job! 🎉</h1>
      <p className="text-2xl text-emerald-600">{knownCount} words you know! ✅</p>
      <p className="text-2xl text-amber-600">{learningWordIds.length} words still learning 🌱</p>
      <div className="flex flex-col gap-3">
        {learningWordIds.length > 0 && (
          <button
            type="button"
            onClick={handleReviewAgain}
            className="rounded-full bg-amber-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
          >
            Review again 🌱
          </button>
        )}
        <Link
          to="/"
          className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Back to Topics
        </Link>
      </div>
    </div>
  );
}
