import { topics } from "../data/vocabulary";
import TopicTile from "../components/TopicTile";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-slate-700">
        Word Explorer 🚀
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {topics.map((topic) => (
          <TopicTile key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}
