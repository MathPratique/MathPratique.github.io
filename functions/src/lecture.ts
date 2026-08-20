// Conversion d'un document Firestore côté serveur vers le type `Acces`.
//
// Le pendant client vit dans src/firebase/acces.ts. Les deux sont volontairement
// distincts : le SDK Admin et le SDK client ont des types Timestamp différents,
// et faire cohabiter les deux dans un même module obligerait à importer l'un
// des deux SDK là où il n'a rien à faire. La RÈGLE, elle, reste partagée — ce
// n'est ici qu'une traduction de format.

import type { Acces, SourceAcces } from "../../src/acces/regles.js";
import type { NiveauAcces } from "../../src/acces/documents.js";

function versMs(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (
    typeof v === "object" &&
    v !== null &&
    "toMillis" in v &&
    typeof (v as { toMillis: unknown }).toMillis === "function"
  ) {
    const ms = (v as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

/**
 * Un document illisible vaut une absence d'accès, jamais un accès valide.
 * En cas de doute, on refuse — c'est la seule direction sûre.
 */
export function versAccesDepuisDonnees(
  coursId: string,
  donnees: FirebaseFirestore.DocumentData | undefined
): Acces | null {
  if (!donnees) return null;

  const dateDebut = versMs(donnees.dateDebut);
  const dateFin = versMs(donnees.dateFin);
  if (dateDebut === null || dateFin === null || dateFin <= dateDebut) return null;

  const source: SourceAcces = donnees.source === "code-classe" ? "code-classe" : "achat";

  // Niveau : on ne garde que les trois valeurs connues. Une chaîne inconnue
  // (typo dans un vieux doc, champ renommé) est laissée tomber — `niveauDe`
  // dans telechargement.ts normalisera vers « restreint » au moment
  // d'appliquer la règle. Défaut le plus restrictif, cohérent partout.
  const niveauLu = donnees.niveau;
  const niveauValide: NiveauAcces | undefined =
    niveauLu === "restreint" || niveauLu === "acheteur" || niveauLu === "enseignant"
      ? niveauLu
      : undefined;

  return {
    coursId,
    source,
    ...(niveauValide ? { niveau: niveauValide } : {}),
    dateDebut,
    dateFin,
    aTelecharge: donnees.aTelecharge === true,
    ...(typeof donnees.reference === "string" ? { reference: donnees.reference } : {}),
  };
}
