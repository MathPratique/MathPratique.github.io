import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Practice from "./pages/Practice";
import Quiz from "./pages/Quiz";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/quiz" element={<Quiz />} />
      </Route>
    </Routes>
  );
}
