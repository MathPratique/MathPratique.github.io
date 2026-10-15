// ===========================================================================
//  Le catalogue de notions — assemblage et contrôles
// ===========================================================================
//
// Deux moitiés, tenues séparées exprès :
//
//   notions-<cours>.generated.ts   la structure, dérivée de la banque par
//                                  scripts/generer-catalogue-notions.mjs
//   motsCles-<cours>.ts            le vocabulaire, écrit et relu à la main
//
// Les marier ici plutôt que dans un seul fichier permet de régénérer la
// structure quand la banque bouge — un chapitre qui gagne une section, par
// exemple — sans jamais écraser le travail de rédaction.
//
// Ajouter un cours : déposer ses deux fichiers, ajouter une entrée dans
// SOURCES. Rien d'autre.
//
// ─── Pourquoi la vérification est paresseuse ──────────────────────────────
//
// index.ts des fonctions importe TOUT ce module au démarrage. Si le mariage
// échouait à l'import, un catalogue mal formé emporterait aussi le webhook
// Stripe et les téléchargements — une faute de frappe dans un mot-clé
// casserait les paiements. Le contrôle se fait donc au premier appel, par
// cours, et ne peut faire échouer que l'analyse de notes.
//
// `verifierCatalogues()` force le contrôle sur tous les cours d'un coup :
// c'est ce qu'appelle le script de vérification, avant de déployer.

import type { Notion, NotionComplete } from "./types.js";
import { NOTIONS_CALCUL_DIFFERENTIEL } from "./notions-calcul-differentiel.generated.js";
import { NOTIONS_PROBABILITES_STATISTIQUE } from "./notions-probabilites-statistique.generated.js";
import { MOTS_CLES_CALCUL_DIFFERENTIEL } from "./motsCles-calcul-differentiel.js";
import { MOTS_CLES_PROBABILITES_STATISTIQUE } from "./motsCles-probabilites-statistique.js";

/**
 * Sous ce seuil, une notion est trop pauvrement décrite pour être détectée
 * autrement que par son titre — autant le savoir avant de déployer.
 */
const MOTS_CLES_MINIMUM = 3;

const SOURCES: Record<string, { notions: Notion[]; motsCles: Record<string, string[]> }> = {
  "calcul-differentiel": {
    notions: NOTIONS_CALCUL_DIFFERENTIEL,
    motsCles: MOTS_CLES_CALCUL_DIFFERENTIEL,
  },
  "probabilites-statistique": {
    notions: NOTIONS_PROBABILITES_STATISTIQUE,
    motsCles: MOTS_CLES_PROBABILITES_STATISTIQUE,
  },
};

function marier(coursId: string, source: (typeof SOURCES)[string]): NotionComplete[] {
  const problemes: string[] = [];
  const vus = new Set<string>();
  const complet: NotionComplete[] = [];

  for (const n of source.notions) {
    if (vus.has(n.id)) problemes.push(`${n.id} : identifiant en double`);
    vus.add(n.id);
    const mots = source.motsCles[n.id];
    if (!mots) {
      problemes.push(`${n.id} (${n.titre}) : aucun mot-clé`);
      continue;
    }
    if (mots.length < MOTS_CLES_MINIMUM) {
      problemes.push(`${n.id} : ${mots.length} mot(s)-clé(s), minimum ${MOTS_CLES_MINIMUM}`);
    }
    const vides = mots.filter((m) => typeof m !== "string" || m.trim().length === 0);
    if (vides.length) problemes.push(`${n.id} : ${vides.length} mot-clé vide`);
    const doublons = mots.filter((m, i) => mots.indexOf(m) !== i);
    if (doublons.length) problemes.push(`${n.id} : mot-clé répété — ${doublons.join(", ")}`);
    complet.push({ ...n, motsCles: mots });
  }

  // L'inverse compte autant : un bloc de mots-clés orphelin veut dire qu'une
  // section a changé de numéro dans la banque et que la rédaction pointe
  // maintenant dans le vide. Silencieux, ce cas ferait perdre une notion à
  // la détection sans que rien ne le signale.
  for (const id of Object.keys(source.motsCles)) {
    if (!vus.has(id)) problemes.push(`${id} : mots-clés sans notion correspondante`);
  }

  if (problemes.length) {
    throw new Error(
      `Catalogue de notions « ${coursId} » incohérent (${problemes.length}) :\n` +
        problemes.map((p) => `  ${p}`).join("\n"),
    );
  }
  return complet;
}

const cache = new Map<string, NotionComplete[]>();

/**
 * Le catalogue d'un cours, ou null si ce cours n'en a pas — un cours sans
 * catalogue n'est pas une erreur, c'est un cours où l'analyse de notes n'est
 * pas encore offerte.
 */
export function catalogueDe(coursId: string): NotionComplete[] | null {
  const source = SOURCES[coursId];
  if (!source) return null;
  let deja = cache.get(coursId);
  if (!deja) {
    deja = marier(coursId, source);
    cache.set(coursId, deja);
  }
  return deja;
}

/** Les identifiants acceptables dans la réponse du modèle, pour ce cours. */
export function idsDuCatalogue(coursId: string): Set<string> {
  return new Set((catalogueDe(coursId) ?? []).map((n) => n.id));
}

/** Les cours où l'analyse de notes est offerte. */
export const COURS_AVEC_CATALOGUE = Object.keys(SOURCES);

/** Force le contrôle des deux catalogues. Lève à la première incohérence. */
export function verifierCatalogues(): Record<string, number> {
  const comptes: Record<string, number> = {};
  for (const coursId of COURS_AVEC_CATALOGUE) {
    comptes[coursId] = (catalogueDe(coursId) ?? []).length;
  }
  return comptes;
}

export type { Notion, NotionComplete } from "./types.js";
