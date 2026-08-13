// Wrapper de rendu qui choisit le bon moteur selon `format` :
//
//   - "latex" (banque Calcul différentiel) → <Mathematiques> + KaTeX
//   - undefined (tout le reste : Prob-Stat, Algèbre linéaire) → <RichContent>
//
// Ce dispatch est le seul point du code qui distingue les deux formats.
// Les cartes (ExerciseCard, MCQCard, TFCard) l'appellent uniformément —
// pas de `startsWith("CD")` disséminé, pas de chemin de code particulier.

import type { RichContent as RichContentValue } from "../../data/exercises";
import RichContent from "../ui/RichContent";
import Mathematiques from "./Mathematiques";

export type ContenuExerciceProps = {
  content: RichContentValue;
  format?: "latex";
  /**
   * Traite les balises simples (`<strong>`, `<em>`, `<br>`) et les commandes
   * de mise en forme LaTeX hors mode math (`\qquad`, `\textbf`, `\up`…).
   * Activé par défaut — indispensable pour la banque calc-diff où
   * énoncés, options et démarches en contiennent partout. Ignoré en dehors
   * du format LaTeX (RichContent fait son propre rendu).
   *
   * On le laisse en prop pour permettre à un futur cas de le désactiver,
   * mais aucun appel actuel ne devrait le mettre à `false` sur du contenu
   * de la banque.
   */
  html?: boolean;
};

export default function ContenuExercice({ content, format, html = true }: ContenuExerciceProps) {
  if (format === "latex" && typeof content === "string") {
    return <Mathematiques source={content} html={html} />;
  }
  return <RichContent content={content} />;
}
