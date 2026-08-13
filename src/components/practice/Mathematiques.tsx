// ===========================================================================
//  Rendu du LaTeX de la banque d'exercices.
// ===========================================================================
//
// Les énoncés de la banque sont du LaTeX brut, avec deux formes mêlées au
// texte français :
//
//     inline   $h(t) = -4{,}9\,t^{2} + 30t$
//     bloc     \[ v(t) = \dfrac{dh}{dt} \]
//
// Le composant maison `RichContent` ne sait pas les lire — il attend un arbre
// d'objets. Affichés tels quels, ces énoncés montreraient leurs antislashs :
// pas seulement laid, illisible.
//
// KaTeX rend le LaTeX en HTML, sans passer par des images. Le texte reste
// sélectionnable, la mise à l'échelle suit celle du navigateur, et — ce qui
// compte pour le référencement — le contenu se trouve dans le DOM.
//
// ⚠️ `dangerouslySetInnerHTML` est utilisé ici en connaissance de cause. Le
// LaTeX vient de la banque du projet, pas d'une saisie d'utilisateur ; et
// KaTeX est appelé avec `trust: false`, qui interdit \htmlClass, \url et les
// autres commandes capables d'injecter du HTML arbitraire. Le jour où ce
// composant afficherait du contenu soumis par un visiteur, il faudrait
// reprendre cette décision.

import { useMemo } from "react";
import katex from "katex";
import { decouper } from "./decouper-latex";
import { preparer, inlineEnHtml } from "./latex-vers-html";
import "katex/dist/katex.min.css";

function rendre(latex: string, bloc: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode: bloc,
      throwOnError: false,
      // Une formule mal formée s'affiche en rouge plutôt que de faire tomber
      // la page. On préfère un exercice abîmé à une page blanche.
      errorColor: "#b91c1c",
      trust: false,
      strict: false,
      macros: {
        // La banque écrit les décimales à la québécoise — $4{,}9$ — ce que
        // KaTeX rend sans espace parasite. Rien à déclarer pour ça.
        // Les rares raccourcis maison vont ici.
        "\\R": "\\mathbb{R}",
      },
    });
  } catch {
    return latex;
  }
}

/**
 * Affiche une chaîne mêlant français et LaTeX.
 *
 * `html` (activé par défaut) traite les balises simples de la banque —
 * `<strong>`, `<em>`, `<br>` — et les commandes de mise en forme LaTeX
 * hors mode math (`\qquad`, `\textbf`, `\up`, `\begin{tabular}`…). Sans
 * lui, tous les segments non mathématiques s'affichent verbatim et le
 * HTML produit par `preparer()` (tableaux, listes, alignements) est
 * échappé à l'écran. Elles viennent du même endroit que le LaTeX, et
 * sont soumises à la même remarque de confiance ci-dessus.
 */
export default function Mathematiques({
  source,
  html = true,
  className,
}: {
  source: string;
  html?: boolean;
  className?: string;
}) {
  // On traduit d'abord les environnements LaTeX — tableaux, alignements,
  // listes — puis on découpe. L'inverse laisserait un `egin{tabular}`
  // découpé en morceaux par les délimiteurs qu'il contient.
  const segments = useMemo(() => decouper(preparer(source)), [source]);

  return (
    <span className={className}>
      {segments.map((s, i) =>
        s.math ? (
          <span
            key={i}
            // KaTeX produit un balisage complexe (MathML + HTML) qu'il faut
            // insérer tel quel : le reconstruire en JSX n'aurait aucun sens.
            dangerouslySetInnerHTML={{ __html: rendre(s.texte, s.bloc) }}
          />
        ) : html ? (
          // `inlineEnHtml` n'est appliqué qu'ici, jamais aux formules : sur
          // une formule, `	ext{…}` et `\quad` sont du LaTeX valide.
          <span key={i} dangerouslySetInnerHTML={{ __html: inlineEnHtml(s.texte) }} />
        ) : (
          <span key={i}>{s.texte}</span>
        )
      )}
    </span>
  );
}
