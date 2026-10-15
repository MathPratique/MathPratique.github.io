// ===========================================================================
//  L'appel au modèle — et sa doublure pour les émulateurs
// ===========================================================================
//
// À l'étape 3, `analyserAvecModele` n'appelle rien : seule la doublure
// répond. L'appel réel à Claude arrive à l'étape 4, une fois le catalogue
// approuvé — brancher les deux d'un coup aurait voulu dire déboguer le
// quota, les limites et le prompte en payant chaque essai.

import type { NotionComplete } from "./types.js";

/** Le modèle qui fera la détection. Haiku : la tâche est une classification. */
export const MODELE = "claude-haiku-5-5";

export type EntreeModele = {
  catalogue: NotionComplete[];
  texte?: string;
  fichier?: { mediaType: string; donnees: Buffer };
};

/**
 * La doublure n'est active QUE dans un émulateur, et seulement si on le
 * demande. Les deux conditions sont là exprès : avec la seule variable
 * d'environnement, un oubli de configuration en production donnerait un
 * service qui répond — faux, mais plausible — au lieu de tomber en panne.
 * Une analyse inventée qui se fait passer pour une vraie est le pire des
 * deux mondes.
 */
export function modeSimule(): boolean {
  return process.env.ANALYSE_NOTES_SIMULEE === "1" && process.env.FUNCTIONS_EMULATOR === "true";
}

/** Sans accents ni majuscules — pour comparer du texte d'étudiant. */
function aplatir(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("fr-FR");
}

/**
 * La doublure : une détection par simple correspondance de mots-clés.
 *
 * Volontairement bête — elle n'est là que pour faire tourner l'interface, le
 * quota et les messages d'erreur sans dépenser un sou. Elle ne comprend rien
 * à des notes manuscrites, d'où la réponse fixe pour un fichier.
 */
export function reponseSimulee(entree: EntreeModele): unknown {
  if (!entree.texte) {
    // Un fichier : la doublure ne sait pas lire une image. Elle renvoie les
    // deux premières notions du cours, pour que l'interface ait de quoi
    // s'afficher.
    return {
      notions: entree.catalogue.slice(0, 2).map((n) => ({ id: n.id, confiance: "moyenne" })),
      horsSujet: false,
    };
  }

  const texte = aplatir(entree.texte);
  const scores = entree.catalogue
    .map((n) => {
      const termes = [n.titre, ...n.motsCles];
      const touches = termes.filter((t) => texte.includes(aplatir(t))).length;
      return { id: n.id, touches };
    })
    .filter((s) => s.touches > 0)
    .sort((a, b) => b.touches - a.touches)
    .slice(0, 4);

  return {
    notions: scores.map((s) => ({ id: s.id, confiance: s.touches >= 2 ? "elevee" : "moyenne" })),
    horsSujet: scores.length === 0,
  };
}

/**
 * Renvoie la réponse BRUTE du modèle, telle quelle. La validation contre le
 * catalogue se fait chez l'appelant (`validerDetections`) : le module qui
 * parle au modèle ne doit pas être aussi celui qui décide si on le croit.
 */
export async function analyserAvecModele(entree: EntreeModele): Promise<unknown> {
  if (modeSimule()) return reponseSimulee(entree);
  throw new Error("appel-modele-non-branche");
}
