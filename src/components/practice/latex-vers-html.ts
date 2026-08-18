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

import katex from "katex";

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
 *
 * La spec de colonnes contient elle-même des `{}` — `{>{\centering\arraybackslash}p{2.6cm}|…}`
 * pour un tableau de variation typique. Une regex `\{[^}]*\}` s'arrête au
 * premier `}` et rate le tabular entier ; on doit compter les accolades.
 */
function tableaux(s: string): string {
  let out = "";
  let i = 0;
  const debut = "\\begin{tabular}";
  const fin = "\\end{tabular}";
  while (i < s.length) {
    const idxDebut = s.indexOf(debut, i);
    if (idxDebut === -1) {
      out += s.slice(i);
      break;
    }
    out += s.slice(i, idxDebut);
    // La spec de colonnes suit immédiatement `\begin{tabular}`. On saute
    // l'espace éventuel, on vérifie qu'on est bien sur `{`, puis on avance
    // en comptant les accolades pour trouver la fermeture.
    let j = idxDebut + debut.length;
    while (j < s.length && /\s/.test(s[j] ?? "")) j++;
    if (s[j] !== "{") {
      // Malformé — on laisse le texte tel quel plutôt que de crasher.
      out += s.slice(idxDebut, j + 1);
      i = j + 1;
      continue;
    }
    let profondeur = 1;
    j++;
    while (j < s.length && profondeur > 0) {
      const c = s[j];
      if (c === "{") profondeur++;
      else if (c === "}") profondeur--;
      j++;
    }
    if (profondeur !== 0) {
      // `\begin{tabular}` sans spec fermée — abandon, on avance d'un cran.
      out += s.slice(idxDebut, idxDebut + debut.length);
      i = idxDebut + debut.length;
      continue;
    }
    // `j` pointe juste après le `}` fermant de la spec de colonnes.
    const debutCorps = j;
    const idxFin = s.indexOf(fin, debutCorps);
    if (idxFin === -1) {
      // Pas de `\end{tabular}` — on renonce à traduire ce bloc.
      out += s.slice(idxDebut);
      break;
    }
    const corps = s.slice(debutCorps, idxFin);
    out += rendreTabular(corps);
    i = idxFin + fin.length;
  }
  return out;
}

/**
 * Convertit le CORPS d'un tabular (sans `\begin{tabular}{…}` ni `\end{tabular}`)
 * en `<table>`. Les cellules vides (« $x$ & & $-$ & $0$ ») sont préservées :
 * dans un tableau de variation, une case vide EST une information (elle dit
 * « rien à cet endroit précis de la colonne »).
 *
 * IMPORTANT — le contenu de chaque cellule (`$x$`, `\textbf{indéf.}`, `$-$`)
 * est pré-rendu ici en HTML final. C'est indispensable : `decouper()` opère
 * sur la chaîne entière et ne connaît rien du HTML. S'il voyait `<td>$x$</td>`,
 * il découperait la chaîne en `<td>` (non-math), `x` (math), `</td>` (non-math),
 * et le composant `Mathematiques` rendrait chaque segment dans un `<span>`
 * séparé — la structure `<table>` se retrouverait trouée par des `<span>`,
 * le navigateur rejetterait les `<td>` orphelins hors de `<tr>`, et le
 * tableau apparaîtrait vide. Le pré-rendu ici garantit qu'aucun `$…$` ne
 * survit à l'intérieur du `<table>`.
 */
function rendreTabular(corps: string): string {
  const lignes = corps
    .split(/\\\\/)
    .map((l) => l.replace(/\\(?:hline|toprule|midrule|bottomrule)\b/g, "").trim())
    // Un `\\` en fin de tabular produit un dernier segment vide — on le
    // jette. Une ligne vide au milieu (rare) l'est aussi. Les cellules
    // vides d'une ligne non vide, elles, sont conservées plus bas.
    .filter((l) => l.length > 0);
  const html = lignes
    .map((ligne, i) => {
      const cellules = ligne
        .split("&")
        .map((c) => rendreCellule(c.trim()))
        // Pas de `.filter(c => c.length > 0)` ici : garder les cellules
        // vides est essentiel pour l'alignement colonne d'un tableau de
        // signes (chaque case vide occupe une position).
        .map((c) => (i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`))
        .join("");
      return `<tr>${cellules}</tr>`;
    })
    .join("");
  // Le conteneur qui défile est indispensable : un tableau de variation à
  // dix colonnes (chapitre 6) ne tient pas dans 375 px, et sans lui c'est
  // la page entière qui se met à défiler latéralement.
  return `<div class="tableau-latex"><table>${html}</table></div>`;
}

/**
 * Options KaTeX partagées avec `Mathematiques.tsx` — on rend le contenu
 * inline d'une cellule ici (pré-rendu, cf. commentaire de `rendreTabular`)
 * et le composant rend le reste. Les deux appels DOIVENT utiliser les mêmes
 * macros et le même `trust` pour que la même formule ait le même rendu où
 * qu'elle apparaisse. `trust: false` interdit `\htmlClass`, `\url` etc. —
 * indispensable puisqu'on émet le résultat via `dangerouslySetInnerHTML`.
 */
const OPTIONS_KATEX_INLINE = {
  displayMode: false,
  throwOnError: false,
  errorColor: "#b91c1c",
  trust: false,
  strict: false,
  macros: { "\\R": "\\mathbb{R}" },
};

/**
 * Rend le contenu d'une cellule de tableau : les portions `$…$` deviennent
 * du HTML KaTeX, le reste passe par `inlineEnHtml` (pour `\textbf`, `~`, etc).
 * Utilisée UNIQUEMENT par `rendreTabular` — hors tableau, le pipeline
 * `decouper` + `Mathematiques` s'en charge.
 */
function rendreCellule(texte: string): string {
  if (texte.length === 0) return "";
  // Remplacer chaque `$…$` par le HTML KaTeX rendu.
  const avecMath = texte.replace(/\$([^$]+?)\$/g, (_, latex) => {
    try {
      return katex.renderToString(latex, OPTIONS_KATEX_INLINE);
    } catch {
      return latex;
    }
  });
  // Puis traduire les commandes inline non mathématiques sur ce qui reste.
  return inlineEnHtml(avecMath);
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
  // `~` — espace insécable LaTeX, entre un nombre et son unité : « $2$~kg »,
  // « $t = 4$~s ». Ces `~` vivent dans le texte (entre deux `$…$`), donc
  // KaTeX ne les voit jamais et sans traduction ils s'affichaient tels quels
  // comme une petite vague à l'écran. On les convertit en vraie espace
  // insécable Unicode (U+00A0) pour que « 2 kg » ne puisse pas se couper
  // en fin de ligne. Dans un segment mathématique, KaTeX gère déjà `~`
  // comme espace insécable — la banque n'en a aucun dans ce cas, mais le
  // contrat reste symétrique avec LaTeX. Un `\~{}` (accent tilde) n'apparaît
  // nulle part dans la banque, donc pas de faux positif à craindre.
  s = s.replace(/~/g, " ");
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
