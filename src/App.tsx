import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TopicScreen from "./pages/TopicScreen";
import Session from "./pages/Session";
import Summary from "./pages/Summary";
import PlacementIntro from "./pages/PlacementIntro";
import PlacementQuiz from "./pages/PlacementQuiz";
import PlacementResults from "./pages/PlacementResults";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topic/:topicId" element={<TopicScreen />} />
      <Route path="/topic/:topicId/session" element={<Session />} />
      <Route path="/topic/:topicId/summary" element={<Summary />} />
      <Route path="/placement-test" element={<PlacementIntro />} />
      <Route path="/placement-test/quiz" element={<PlacementQuiz />} />
      <Route path="/placement-test/results" element={<PlacementResults />} />
    </Routes>
  );
}
