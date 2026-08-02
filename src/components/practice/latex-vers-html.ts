// ===========================================================================
//  Ce que la banque écrit pour LaTeX et qu'il faut traduire pour le web.
// ===========================================================================
//
// Les énoncés ont été rédigés pour produire des PDF. À côté des formules
// entre `$…$`, ils contiennent des environnements LaTeX qui n'ont aucun sens
// dans un navigateur : tableaux de variation en `tabular`, alignements en
// `align*`, listes en `itemize`, et des commandes de mise en forme comme
// `\textbf` ou `\qquad`.
//
// Sans traduction, dix des soixante-cinq exercices affichaient leur balisage
// en clair — `\begin{center}\renewcommand{\arraystretch}{1.3}…` au milieu
// d'une démarche. Ce n'est pas un détail cosmétique : le tableau de variation
// est le cœur du chapitre 6.
//
// Le travail se fait en deux temps, et l'ordre compte :
//
//   1. `preparer()` traite les ENVIRONNEMENTS sur la chaîne entière. Ils
//      vivent toujours hors des `$…$`, jamais dedans.
//   2. `inlineEnHtml()` traite les commandes restantes, mais UNIQUEMENT sur
//      les segments non mathématiques. Appliquée à une formule, elle
//      remplacerait un `\text{…}` légitime par du HTML et casserait KaTeX.

/** Commandes de présentation qui n'ont pas d'équivalent et ne portent rien. */
const A_SUPPRIMER = [
  /\\renewcommand\{[^}]*\}\{[^}]*\}/g,
  /\\(?:centering|arraybackslash|footnotesize|small|normalsize|arraystretch)\b/g,
  /\\(?:hline|toprule|midrule|bottomrule)\b/g,
];

/** `\begin{align*}…\end{align*}` → un bloc mathématique que KaTeX sait rendre. */
function alignements(s: string): string {
  return s.replace(
    /\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g,
    (_, corps) => `\\[\\begin{aligned}${corps}\\end{aligned}\\]`
  );
}

/** `\begin{itemize}\item a \item b\end{itemize}` → une liste HTML. */
function listes(s: string): string {
  return s.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, corps) => {
    const items = String(corps)
      .split(/\\item\b/)
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => `<li>${x}</li>`)
      .join("");
    return `<ul class="liste-latex">${items}</ul>`;
  });
}

/**
 * `\begin{tabular}{…}` → un vrai tableau HTML.
 *
 * On ignore délibérément la spécification de colonnes : les largeurs fixes
 * en centimètres, indispensables à l'impression, n'ont pas de sens dans une
 * page qui doit aussi tenir sur un téléphone. Le tableau se met à la largeur
 * de son contenu, et déborde dans un conteneur qui défile plutôt que de
 * pousser la page entière.
 */
function tableaux(s: string): string {
  return s.replace(
    /\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/g,
    (_, corps) => {
      const lignes = String(corps)
        .split(/\\\\/)
        .map((l) => l.replace(/\\(?:hline|toprule|midrule|bottomrule)\b/g, "").trim())
        .filter((l) => l.length > 0);
      const html = lignes
        .map((ligne, i) => {
          const cellules = ligne
            .split("&")
            .map((c) => c.trim())
            .map((c) => (i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`))
            .join("");
          return `<tr>${cellules}</tr>`;
        })
        .join("");
      // Le conteneur qui défile est indispensable : un tableau de variation
      // à sept colonnes ne tient pas dans 375 px, et sans lui c'est la page
      // entière qui se met à défiler latéralement.
      return `<div class="tableau-latex"><table>${html}</table></div>`;
    }
  );
}

/** Prépare une chaîne : environnements traduits, décor retiré. */
export function preparer(source: string): string {
  let s = source;
  s = alignements(s);
  s = tableaux(s);
  s = listes(s);
  // `center` n'a plus d'objet une fois le tableau converti : le conteneur
  // s'en charge.
  s = s.replace(/\\begin\{center\}|\\end\{center\}/g, "");
  for (const motif of A_SUPPRIMER) s = s.replace(motif, "");
  return s;
}

/**
 * Traduit les commandes en ligne d'un segment NON mathématique.
 *
 * À n'appliquer qu'aux segments de texte. Sur une formule, `\text{…}` et
 * `\quad` sont du LaTeX valide que KaTeX doit recevoir intact.
 */
export function inlineEnHtml(texte: string): string {
  let s = texte;
  s = s.replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>");
  s = s.replace(/\\(?:emph|textit)\{([^}]*)\}/g, "<em>$1</em>");
  // `\up` est l'exposant ordinal du français, fourni par babel : 1\up{re},
  // 3\up{e}. Il n'est défini nulle part dans le projet — il vient du package
  // de langue, et n'existe donc pas hors de LaTeX.
  s = s.replace(/\\up\{([^}]*)\}/g, "<sup>$1</sup>");
  // Espacements LaTeX : ils séparent deux réponses, « (a) … \qquad (b) … ».
  s = s.replace(/\\qquad\b/g, "  ");
  s = s.replace(/\\quad\b/g, " ");
  s = s.replace(/\\[,;:!]/g, " ");
  // Sauts de ligne, avec ou sans espacement vertical.
  s = s.replace(/\\\\\s*\[[^\]]*\]/g, "<br>");
  s = s.replace(/\\\\/g, "<br>");
  return s;
}

/**
 * Ce qui reste de LaTeX après traduction — sert au contrôle, pas au rendu.
 * Un résultat non vide signale un balisage que le web n'affiche pas
 * correctement.
 */
export function residusLatex(texte: string): string[] {
  return texte.match(/\\[a-zA-Z]+/g) ?? [];
}
