// ===========================================================================
//  Le modèle de progression personnelle, et les opérations pures qui l'utilisent.
// ===========================================================================
//
// Deux flags indépendants par exercice :
//   - « complété » : coché quand l'étudiant a fini l'exercice
//   - « marqué »   : drapeau pour signaler « à revoir » / « important »
//
// Stockés à plat dans deux dictionnaires {idExo: timestamp}, pour trois
// raisons :
//   1. Compteurs par chapitre triviaux (filtre par préfixe d'id).
//   2. Aucun chemin nested à composer pour un `updateDoc` en dot-notation.
//   3. Le timestamp sert d'ordre — utile pour lister « les derniers marqués ».
//
// Ce fichier ne connaît ni Firebase, ni React, ni le réseau. Comme
// `acces/regles.ts`, il est réutilisable côté serveur et couvre le domaine.

/** Un timestamp Firestore vu par le client, ou un nombre ms si on le sérialise. */
export type Instant = { toMillis(): number } | number;

export type Progression = {
  /** {idExo: instant du dernier marquage complet}. Absent = pas complété. */
  completes: Record<string, Instant>;
  /** {idExo: instant du dernier drapeau}. Absent = pas marqué. */
  marques: Record<string, Instant>;
  /** Dernière écriture serveur — sert au débogage, pas à la logique. */
  dateMaj?: Instant;
  /** Format du document. Aujourd'hui 1. À faire évoluer sur migration. */
  version: number;
};

export const PROGRESSION_VIDE: Progression = {
  completes: {},
  marques: {},
  version: 1,
};

export const VERSION_PROGRESSION = 1;

/** Vrai si l'exercice `id` est complété. Insensible à la présence de dateMaj. */
export function estComplete(p: Progression | null | undefined, id: string): boolean {
  return !!p && id in p.completes;
}

/** Vrai si l'exercice `id` est marqué comme important / à revoir. */
export function estMarque(p: Progression | null | undefined, id: string): boolean {
  return !!p && id in p.marques;
}

/**
 * Compte les exercices complétés dont l'id commence par un préfixe donné.
 * On passe le préfixe plutôt que le numéro de chapitre pour rester
 * indépendant du schéma d'IDs — le jour où un autre cours n'utilise pas
 * `CD-CXX-EYYY`, la fonction fonctionne quand même.
 *
 *   compteAvecPrefixe(p, 'completes', 'CD-C01-') → nb d'exos ch01 cochés
 */
export function compteAvecPrefixe(
  p: Progression | null | undefined,
  champ: "completes" | "marques",
  prefixe: string,
): number {
  if (!p) return 0;
  let n = 0;
  for (const id in p[champ]) if (id.startsWith(prefixe)) n++;
  return n;
}

/**
 * Filtres possibles pour la page Exercices. Une liste fermée pour que
 * l'ajout d'une option demande une modification consciente à cet endroit.
 */
export type FiltreProgression = "tous" | "completes" | "non-completes" | "marques";

/**
 * Applique un filtre à une liste d'IDs. Renvoie ceux à afficher.
 *
 * « completes » et « marques » sont deux dictionnaires INDÉPENDANTS : un
 * exercice à la fois coché ET marqué apparaît dans les deux filtres,
 * jamais dans « non-completes ». Ce n'est pas une hiérarchie à trois
 * états — chaque filtre regarde son propre dictionnaire.
 */
export function filtrerIds(
  p: Progression | null | undefined,
  ids: string[],
  filtre: FiltreProgression,
): string[] {
  if (filtre === "tous" || !p) return ids;
  if (filtre === "completes") return ids.filter((id) => estComplete(p, id));
  if (filtre === "non-completes") return ids.filter((id) => !estComplete(p, id));
  if (filtre === "marques") return ids.filter((id) => estMarque(p, id));
  return ids;
}
