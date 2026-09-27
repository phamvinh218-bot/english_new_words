import { Link, Navigate, useParams } from "react-router-dom";
import { getTopicById, getWordsForTopic } from "../data/vocabulary";

export default function TopicScreen() {
  const { topicId } = useParams<{ topicId: string }>();
  const topic = topicId ? getTopicById(topicId) : undefined;

  if (!topic) {
    return <Navigate to="/" replace />;
  }

  const wordCount = getWordsForTopic(topic.id).length;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <span className="text-7xl" aria-hidden="true">
        {topic.emoji}
      </span>
      <h1 className="text-4xl font-extrabold text-slate-700">{topic.name}</h1>
      <p className="text-xl text-slate-500">{wordCount} words to learn</p>
      <Link
        to={`/topic/${topic.id}/session`}
        className="rounded-full bg-emerald-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
      >
        Start Learning
      </Link>
    </div>
  );
}
