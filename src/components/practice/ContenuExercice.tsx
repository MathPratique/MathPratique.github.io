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
   * Autorise les balises simples (`<strong>`, `<em>`, `<br>`) dans le rendu
   * LaTeX — utile pour les démarches détaillées de la banque calc-diff.
   * Ignoré en dehors du format LaTeX.
   */
  html?: boolean;
};

export default function ContenuExercice({ content, format, html = false }: ContenuExerciceProps) {
  if (format === "latex" && typeof content === "string") {
    return <Mathematiques source={content} html={html} />;
  }
  return <RichContent content={content} />;
}
