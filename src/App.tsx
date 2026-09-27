import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TopicScreen from "./pages/TopicScreen";
import Session from "./pages/Session";
import Summary from "./pages/Summary";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topic/:topicId" element={<TopicScreen />} />
      <Route path="/topic/:topicId/session" element={<Session />} />
      <Route path="/topic/:topicId/summary" element={<Summary />} />
    </Routes>
  );
}
