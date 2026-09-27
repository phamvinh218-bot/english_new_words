import { useNavigate } from "react-router-dom";
import { generatePlacementTest } from "../lib/placementTest";

export default function PlacementIntro() {
  const navigate = useNavigate();

  function handleStart() {
    const questions = generatePlacementTest();
    navigate("/placement-test/quiz", { state: { questions } });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Placement Test 📝</h1>
      <p className="text-xl text-slate-500">
        Listen to each word, then pick the picture that matches. 30 questions!
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
