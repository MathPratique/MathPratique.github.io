import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Practice from "./pages/Practice";
import Quiz from "./pages/Quiz";
import CustomQuiz from "./pages/CustomQuiz";
import Boutique from "./pages/Boutique";
import BoutiqueCalculDifferentiel from "./pages/BoutiqueCalculDifferentiel";
import AchatConfirme from "./pages/AchatConfirme";
import Enseignants from "./pages/Enseignants";
import Connexion from "./pages/Connexion";
import MonCompte from "./pages/MonCompte";
import { ProgressionProvider } from "./progression/ProgressionContext";
// Chargée à la demande : cette page tire KaTeX et les 65 exercices avec
// leurs démarches, soit environ 430 ko. Les inclure dans le bundle principal
// les imposait à chaque visiteur de l'accueil, qui n'en a aucun usage.
const ExercicesCalculDifferentiel = lazy(
  () => import("./pages/ExercicesCalculDifferentiel")
);
const ExercicesProbabilitesStatistique = lazy(
  () => import("./pages/ExercicesProbabilitesStatistique")
);

export default function App() {
  // Un provider PAR COURS, posé sur la route du cours et non à la racine.
  //
  // La progression vit dans `utilisateurs/{uid}/progression/{coursId}` : un
  // provider unique à la racine ferait écrire la progression de prob-stat
  // dans le document du calcul différentiel. Seules les deux pages de cours
  // consomment la progression, donc la porter par route suffit — et le
  // provider reste inerte tant que l'utilisateur n'a pas d'accès valide.
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        {/* Adresse propre et indexable, distincte du sélecteur générique. */}
        <Route
          path="/exercices/calcul-differentiel"
          element={
            <ProgressionProvider coursId="calcul-differentiel">
              <Suspense
                fallback={
                  <div className="container-page py-16 text-center text-sm text-ink-600">
                    Chargement des exercices…
                  </div>
                }
              >
                <ExercicesCalculDifferentiel />
              </Suspense>
            </ProgressionProvider>
          }
        />
        <Route
          path="/exercices/probabilites-statistique"
          element={
            <ProgressionProvider coursId="probabilites-statistique">
              <Suspense
                fallback={
                  <div className="container-page py-16 text-center text-sm text-ink-600">
                    Chargement des exercices…
                  </div>
                }
              >
                <ExercicesProbabilitesStatistique />
              </Suspense>
            </ProgressionProvider>
          }
        />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/custom-quiz" element={<CustomQuiz />} />
        <Route path="/boutique" element={<Boutique />} />
        <Route path="/boutique/calcul-differentiel" element={<BoutiqueCalculDifferentiel />} />
        <Route path="/achat-confirme" element={<AchatConfirme />} />
        <Route path="/enseignants" element={<Enseignants />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/mon-compte" element={<MonCompte />} />
      </Route>
    </Routes>
  );
}
