// Découpage d'une chaîne mêlant français et LaTeX en segments.
//
// Isolé du composant de rendu pour être testable sans KaTeX ni navigateur.
// C'est la partie où les erreurs se cachent : un délimiteur mal reconnu et
// c'est tout le reste de l'énoncé qui bascule en mode mathématique.

export type Segment =
  | { math: false; texte: string }
  | { math: true; texte: string; bloc: boolean };

/**
 * Reconnaît `\[…\]`, `$$…$$` et `$…$`.
 *
 * L'ordre des alternatives compte : `$$` doit être tenté avant `$`, sinon il
 * serait lu comme deux délimiteurs vides et tout ce qui suit basculerait.
 * Le `$…$` interdit le `$` à l'intérieur (`[^$]+?`), ce qui évite qu'une
 * paire de formules voisines soit fusionnée en une seule.
 */
const DELIMITEURS = /\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\$([^$]+?)\$/g;

export function decouper(source: string): Segment[] {
  const segments: Segment[] = [];
  let curseur = 0;
  for (const m of source.matchAll(DELIMITEURS)) {
    if (m.index > curseur) {
      segments.push({ math: false, texte: source.slice(curseur, m.index) });
    }
    const bloc = m[1] !== undefined || m[2] !== undefined;
    segments.push({ math: true, texte: (m[1] ?? m[2] ?? m[3] ?? "").trim(), bloc });
    curseur = m.index + m[0].length;
  }
  if (curseur < source.length) {
    segments.push({ math: false, texte: source.slice(curseur) });
  }
  return segments;
}

/** Le texte seul, sans les mathématiques — pour les méta-descriptions. */
export function texteSeul(source: string): string {
  return decouper(source)
    .filter((s): s is { math: false; texte: string } => !s.math)
    .map((s) => s.texte)
    .join(" ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
