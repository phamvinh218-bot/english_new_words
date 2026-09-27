import { Link } from "react-router-dom";
import { getTopicById, topics } from "../data/vocabulary";
import TopicTile from "../components/TopicTile";
import { getPlacementResult } from "../lib/placementStorage";
import { findWeakestTopicId } from "../lib/placementTest";

export default function Home() {
  const placementResult = getPlacementResult();
  const weakestTopicId = placementResult
    ? findWeakestTopicId(placementResult.topicStats)
    : undefined;
  const weakestTopic = weakestTopicId ? getTopicById(weakestTopicId) : undefined;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-slate-700">
        Word Explorer 🚀
      </h1>

      {placementResult && weakestTopic ? (
        <div className="mb-6 flex flex-col items-center gap-2 rounded-3xl bg-amber-100 p-4 text-center sm:flex-row sm:justify-between">
          <p className="text-lg font-bold text-amber-700">
            ⭐ Try this next:{" "}
            <Link
              to={`/topic/${weakestTopic.id}`}
              aria-label={`Go to ${weakestTopic.name}`}
              className="underline"
            >
              {weakestTopic.name}
            </Link>
          </p>
          <Link to="/placement-test" className="text-sm font-bold text-amber-600 underline">
            Retake Placement Test
          </Link>
        </div>
      ) : (
        <div className="mb-6 flex justify-center">
          <Link
            to="/placement-test"
            className="rounded-full bg-purple-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
          >
            Take the Placement Test 📝
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {topics.map((topic) => (
          <TopicTile key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}
