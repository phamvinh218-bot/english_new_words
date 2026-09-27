import { Link } from "react-router-dom";
import type { Topic } from "../types";

interface TopicTileProps {
  topic: Topic;
}

export default function TopicTile({ topic }: TopicTileProps) {
  return (
    <Link
      to={`/topic/${topic.id}`}
      className={`flex flex-col items-center justify-center gap-2 rounded-3xl p-6 text-white shadow-md transition-transform hover:scale-105 active:scale-95 ${topic.colorClass}`}
    >
      <span className="text-5xl" aria-hidden="true">
        {topic.emoji}
      </span>
      <span className="text-xl font-bold">{topic.name}</span>
    </Link>
  );
}
