import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Practice from "./pages/Practice";
import Quiz from "./pages/Quiz";
import CustomQuiz from "./pages/CustomQuiz";
import Boutique from "./pages/Boutique";
import AchatConfirme from "./pages/AchatConfirme";
import Enseignants from "./pages/Enseignants";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/custom-quiz" element={<CustomQuiz />} />
        <Route path="/boutique" element={<Boutique />} />
        <Route path="/achat-confirme" element={<AchatConfirme />} />
        <Route path="/enseignants" element={<Enseignants />} />
      </Route>
    </Routes>
  );
}
