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
 * Compte, parmi une liste d'exercices donnée, ceux qui sont cochés (ou
 * marqués). L'appelant fournit les IDs exacts qu'il affiche.
 *
 *   compteParmi(p, 'completes', ids du chapitre 1) → nb cochés dans ce chapitre
 *
 * Remplace un `compteAvecPrefixe(p, champ, 'CD-C01-')` qui déduisait
 * l'appartenance à un chapitre de la FORME de l'id. Sa documentation
 * affirmait rester « indépendant du schéma d'IDs », mais le préfixe était
 * écrit en dur dans chaque page : la page de probabilités, copiée depuis
 * celle du calcul différentiel, cherchait des `CD-C01-` parmi des
 * `ch01-fac-001` et affichait donc « 0 / 97 » en permanence, quel que soit
 * le nombre de cases cochées.
 *
 * Compter par appartenance à une liste supprime la question : rien ici ne
 * sait comment un cours nomme ses exercices, et un troisième cours ne peut
 * pas retomber dans le même piège.
 *
 * Effet de bord voulu : le numérateur suit désormais les filtres de type et
 * de difficulté, comme le dénominateur. Avec le préfixe, filtrer sur
 * « Facile » pouvait afficher « 12 / 9 complétés » — le numérateur comptait
 * tout le chapitre pendant que le dénominateur ne comptait que les cartes
 * visibles.
 */
export function compteParmi(
  p: Progression | null | undefined,
  champ: "completes" | "marques",
  ids: readonly string[],
): number {
  if (!p) return 0;
  let n = 0;
  for (const id of ids) if (id in p[champ]) n++;
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
