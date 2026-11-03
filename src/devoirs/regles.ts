// ===========================================================================
//  Les devoirs d'un cours : le modèle et ses règles, sans Firebase ni React.
// ===========================================================================
//
// Une liste d'exercices à faire, par semaine, que l'administrateur modifie
// dans le navigateur (/devoirs/<cours>/edition) et que les étudiants du
// cours lisent (/devoirs/<cours>). Elle vit dans Firestore, à
// `devoirs/{coursId}`, pas dans le dépôt : la modifier ne demande ni commit
// ni déploiement.
//
// Les exercices y sont désignés par leur ID dans la banque, JAMAIS par leur
// numéro. Le numéro du cahier (position dans le chapitre) se recalcule à
// l'affichage à partir du catalogue courant : si la numérotation change, la
// liste reste juste.
//
// Ce module est pur et testé (tests/devoirs.test.mjs). La couche Firestore
// est dans store.ts ; la vraie barrière est dans firestore.rules.

import { verifierAcces, type Acces } from "../acces/regles.js";
import { niveauDe } from "../acces/telechargement.js";
import type { Repere } from "../data/banque-types.js";

/**
 * uid du compte administrateur du site — le seul qui peut modifier les
 * devoirs. MÊME valeur que dans firestore.rules (`estAdministrateurSite`),
 * vérifiée par test.
 *
 * Ici, elle ne sert qu'à l'affichage : montrer ou cacher l'édition. Un
 * navigateur qui la modifierait verrait la page d'édition, mais chaque
 * enregistrement serait refusé par les règles.
 */
export const UID_ADMINISTRATEUR = "hZWPVvkJcWTmRbpox6jr0X6Mz3P2";

/** Les cours qui ont une page Devoirs. Les règles n'acceptent que ceux-ci. */
export const COURS_DEVOIRS: readonly string[] = ["calcul-differentiel"];

/** Même limite que les règles (`semaines.size() <= 60`). */
export const MAX_SEMAINES = 60;

export type Semaine = {
  /** Identifiant stable : clé React et réordonnancement. */
  id: string;
  /** Libre : « Semaine 3 », « Cours du lundi 24 août »… */
  titre: string;
  /** AAAA-MM-JJ, facultative. */
  date: string | null;
  /** Facultative, texte simple. */
  note: string;
  /** IDs de la banque, dans l'ordre voulu. */
  exercices: string[];
};

export type Devoirs = { semaines: Semaine[]; version: number };

/** Le document n'existe pas encore : aucune semaine, version 0. */
export const DEVOIRS_VIDES: Devoirs = { semaines: [], version: 0 };

// ---------------------------------------------------------------------------
//  Lecture défensive du document Firestore
// ---------------------------------------------------------------------------

function versSemaine(brut: unknown, i: number): Semaine | null {
  if (!brut || typeof brut !== "object") return null;
  const s = brut as Record<string, unknown>;
  const date = typeof s.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? s.date : null;
  return {
    id: typeof s.id === "string" && s.id ? s.id : `semaine-${i + 1}`,
    titre: typeof s.titre === "string" ? s.titre : "",
    date,
    note: typeof s.note === "string" ? s.note : "",
    exercices: Array.isArray(s.exercices)
      ? s.exercices.filter((x): x is string => typeof x === "string")
      : [],
  };
}

/** Le document tel que lu dans Firestore, ramené au type. Tolère tout. */
export function versDevoirs(data: unknown): Devoirs {
  if (!data || typeof data !== "object") return DEVOIRS_VIDES;
  const d = data as Record<string, unknown>;
  const semaines = Array.isArray(d.semaines)
    ? d.semaines.map(versSemaine).filter((s): s is Semaine => s !== null)
    : [];
  const version = typeof d.version === "number" && Number.isInteger(d.version) ? d.version : 0;
  return { semaines, version };
}

// ---------------------------------------------------------------------------
//  Qui peut lire
// ---------------------------------------------------------------------------

/**
 * Miroir de la règle `allow read` : l'administrateur, ou un compte dont
 * l'accès au cours est actif et de niveau restreint (absent ou inconnu
 * compte comme restreint, comme partout sur le site).
 *
 * Confort d'affichage seulement — choisir le bon message sans essuyer un
 * refus. Les règles décident.
 */
export function peutLireDevoirs(
  uid: string | null,
  acces: Acces | null,
  maintenant: number = Date.now(),
): boolean {
  if (!uid) return false;
  if (uid === UID_ADMINISTRATEUR) return true;
  return accesOuvreDevoirs(acces, maintenant);
}

/** L'accès d'un étudiant du groupe : actif et de niveau restreint. */
export function accesOuvreDevoirs(acces: Acces | null, maintenant: number = Date.now()): boolean {
  if (!acces) return false;
  return verifierAcces(acces, maintenant).actif && niveauDe(acces) === "restreint";
}

// ---------------------------------------------------------------------------
//  Numéros du cahier
// ---------------------------------------------------------------------------

export type LigneExercice = { id: string; numero: number; section: string };

/**
 * Les exercices d'une semaine, groupés par chapitre. Les chapitres
 * apparaissent dans l'ordre de leur premier exercice ; dans un chapitre,
 * l'ordre choisi par l'enseignant est gardé. Un ID absent du catalogue
 * (exercice retiré de la banque) est omis — voir `idsInconnus`.
 */
export function grouperParChapitre(
  ids: string[],
  index: Map<string, Repere>,
): { chapitre: number; exercices: LigneExercice[] }[] {
  const groupes = new Map<number, LigneExercice[]>();
  for (const id of ids) {
    const r = index.get(id);
    if (!r) continue;
    if (!groupes.has(r.chapitre)) groupes.set(r.chapitre, []);
    groupes.get(r.chapitre)!.push({ id, numero: r.numero, section: r.section });
  }
  return [...groupes].map(([chapitre, exercices]) => ({ chapitre, exercices }));
}

/** Les IDs qui ne sont plus au catalogue. */
export function idsInconnus(ids: string[], index: Map<string, Repere>): string[] {
  return ids.filter((id) => !index.has(id));
}

/** Tri par chapitre puis numéro ; les IDs inconnus restent à la fin. */
export function trierParNumero(ids: string[], index: Map<string, Repere>): string[] {
  const connus = ids.filter((id) => index.has(id));
  connus.sort((a, b) => {
    const ra = index.get(a)!;
    const rb = index.get(b)!;
    return ra.chapitre - rb.chapitre || ra.numero - rb.numero;
  });
  return [...connus, ...idsInconnus(ids, index)];
}

// ---------------------------------------------------------------------------
//  « Coller une liste »
// ---------------------------------------------------------------------------

export type ResultatListe = {
  /** Ce qui précède le premier « : », s'il contient des lettres. */
  titre: string | null;
  /** IDs trouvés, dans l'ordre, sans doublon. */
  ids: string[];
  /** Numéros sans exercice dans ce chapitre. */
  horsChapitre: number[];
  /** Morceaux qui ne sont ni un numéro ni une plage. */
  illisibles: string[];
};

/**
 * Convertit une liste écrite à la main — « 26, 29, 50 à 54 et 57 » — en
 * IDs, avec le catalogue du jour. Accepte « à », « - » ou « – » pour les
 * plages, et des virgules, points-virgules, « et » ou retours à la ligne
 * entre les morceaux. Une ligne « Cours du lundi 24 août : 26, 29 » donne
 * aussi un titre.
 */
export function analyserListe(
  texte: string,
  chapitre: number,
  index: Map<string, Repere>,
): ResultatListe {
  const parNumero = new Map<number, string>();
  for (const [id, r] of index) if (r.chapitre === chapitre) parNumero.set(r.numero, id);

  let titre: string | null = null;
  let corps = texte;
  const deuxPoints = texte.indexOf(":");
  if (deuxPoints >= 0) {
    const avant = texte.slice(0, deuxPoints).replace(/\s+/g, " ").trim();
    if (/\p{L}/u.test(avant)) {
      titre = avant;
      corps = texte.slice(deuxPoints + 1);
    }
  }

  const ids: string[] = [];
  const horsChapitre: number[] = [];
  const illisibles: string[] = [];
  const morceaux = corps.replace(/\s+et\s+/gi, ",").split(/[,;\n]/);
  for (const brut of morceaux) {
    const m = brut.trim();
    if (!m) continue;
    const plage = /^(\d+)\s*(?:(?:à|a|-|–|—)\s*(\d+))?\.?$/i.exec(m);
    if (!plage) {
      illisibles.push(m);
      continue;
    }
    const debut = Number(plage[1]);
    const fin = plage[2] === undefined ? debut : Number(plage[2]);
    if (fin < debut || fin - debut > 200) {
      illisibles.push(m);
      continue;
    }
    for (let n = debut; n <= fin; n++) {
      const id = parNumero.get(n);
      if (!id) horsChapitre.push(n);
      else if (!ids.includes(id)) ids.push(id);
    }
  }
  return { titre, ids, horsChapitre, illisibles };
}

// ---------------------------------------------------------------------------
//  Affichage et validation
// ---------------------------------------------------------------------------

/** « 2026-08-24 » → « lundi 24 août ». Chaîne vide si la date est invalide. */
export function formaterDateDevoir(date: string | null): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const [a, m, j] = date.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  if (d.getUTCMonth() !== m - 1 || d.getUTCDate() !== j) return "";
  return d.toLocaleDateString("fr-CA", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Ce qui empêche d'enregistrer (`bloquants`) et ce qui mérite un coup d'œil
 * (`avertissements`). Un ID inconnu n'empêche rien : il est caché aux
 * étudiants, et le retirer reste un choix de l'enseignant.
 */
export function verifierSemaines(
  semaines: Semaine[],
  index: Map<string, Repere>,
): { bloquants: string[]; avertissements: string[] } {
  const bloquants: string[] = [];
  const avertissements: string[] = [];
  if (semaines.length > MAX_SEMAINES) {
    bloquants.push(`Il y a ${semaines.length} semaines ; le maximum est ${MAX_SEMAINES}.`);
  }
  semaines.forEach((s, i) => {
    const nom = s.titre.trim() || `La semaine ${i + 1}`;
    if (!s.titre.trim()) bloquants.push(`La semaine ${i + 1} n'a pas de titre.`);
    const inconnus = idsInconnus(s.exercices, index);
    if (inconnus.length > 0) {
      avertissements.push(
        `${nom} : ${inconnus.length} exercice${inconnus.length > 1 ? "s" : ""} retiré${
          inconnus.length > 1 ? "s" : ""
        } de la banque (${inconnus.join(", ")}), caché${inconnus.length > 1 ? "s" : ""} aux étudiants.`,
      );
    }
  });
  return { bloquants, avertissements };
}
