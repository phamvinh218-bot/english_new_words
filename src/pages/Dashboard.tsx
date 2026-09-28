import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import ScoreTrendChart from "../components/ScoreTrendChart";
import { getOverallStats, getScoreTrend, getTopicBreakdown } from "../lib/dashboardStats";

export default function Dashboard() {
  const { knownCount, totalWords } = getOverallStats();
  const topicBreakdown = getTopicBreakdown();
  const scoreTrend = getScoreTrend();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-slate-700">
        Progress Report 📊
      </h1>

      <div className="mb-6 rounded-3xl bg-white p-8 text-center shadow-lg">
        <p className="text-5xl font-bold text-emerald-600">
          {knownCount} / {totalWords}
        </p>
        <p className="mt-2 text-lg text-slate-500">words learned</p>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-slate-700">By Topic</h2>
        <div className="flex flex-col gap-3">
          {topicBreakdown.map((topic) => (
            <div key={topic.topicId} className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {topic.topicEmoji}
              </span>
              <span className="w-24 shrink-0 font-bold text-slate-600">{topic.topicName}</span>
              <ProgressBar current={topic.knownCount} total={topic.totalCount} />
              <span className="w-14 shrink-0 text-right text-sm text-slate-500">
                {topic.knownCount}/{topic.totalCount}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-slate-700">Daily Check-up Progress</h2>
        {scoreTrend.length > 0 ? (
          <ScoreTrendChart data={scoreTrend} />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-lg text-slate-500">
              Take the Daily Check-up to start tracking your progress!
            </p>
            <Link
              to="/daily-test"
              className="rounded-full bg-teal-500 px-6 py-3 text-lg font-bold text-white shadow transition-transform active:scale-95"
            >
              Go to Daily Check-up
            </Link>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Link
          to="/"
          className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Back to Word Explorer
        </Link>
      </div>
    </div>
  );
}
