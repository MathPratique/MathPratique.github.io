// Probabilités et statistique — banque synchronisée
// (src/data/probabilites-statistique/).
//
// Réécrit le 2026-08-29 sur le patron de calcDiffPicker.ts. L'ancienne
// version puisait dans les 388 exercices figés de src/data/exercises.ts,
// copie manuelle sans lien avec la banque : le chapitre 2 y était resté à 97
// exercices alors que la banque en compte 160.
//
// Tirage sans remise par (lessonId, kind, difficulty), pool réinitialisé à
// chaque nouveau quiz. Les objets bruts (`Exercice`) ne suivent pas le format
// `Exercise` du site : on les traduit à la volée dans `traduire()`, et on
// pose `format: "latex"` pour que les cartes utilisent <Mathematiques>.
//
// ─── CE QUE LE POOL CONTIENT ──────────────────────────────────────────────
//
// Par défaut la vitrine bundlée — VIDE aujourd'hui, puisque tout est réservé
// tant que la sélection éditoriale n'a pas eu lieu. Un détenteur d'accès
// passe `banque.exercices` (via useExercicesComplets) et retrouve les 451.
// Le quiz d'un visiteur sans accès est donc sans question pour ce cours,
// ce qui est le comportement voulu : rien de réservé ne doit fuir par là.

import type { Difficulty, Exercise, MCQOption } from "../data/exercises";
import { CHAPITRES } from "../data/probabilites-statistique";
import type {
  Difficulte as DifficulteBanque,
  Etape,
  Exercice,
  TypeExercice,
} from "../data/banque-types";
import { shuffle } from "./rng";

export const PROB_STAT_LESSONS = ["PSD1", "PSD2", "PSD3", "PSD4"] as const;
export type ProbStatLessonId = (typeof PROB_STAT_LESSONS)[number];

export function isProbStatLesson(lessonId: string): lessonId is ProbStatLessonId {
  return (PROB_STAT_LESSONS as readonly string[]).includes(lessonId);
}

// Aucun exercice de prob-stat n'a de figure : vérifié sur les 451 au moment
// de l'export web. Il n'y a donc ni résolution de SVG ni liste d'exclusion,
// contrairement au calcul différentiel. Le jour où une figure apparaîtra
// dans cette banque, reprendre le mécanisme de calcDiffPicker.ts.

// Mêmes trois canaux que le reste du quiz : `exercise` = CALC, `mcq` = QCM,
// `tf` = V/F. Les deux formats de calcul du JSON (court/long) tombent dans
// le canal CALC.
type Kind = "exercise" | "mcq" | "tf";

function correspondAuKind(type: TypeExercice, kind: Kind): boolean {
  if (kind === "mcq") return type === "qcm";
  if (kind === "tf") return type === "vrai-faux";
  return type === "calcul-court" || type === "calcul-long";
}

const DIFF_VERS_SITE: Record<DifficulteBanque, Difficulty> = {
  facile: "Facile",
  moyen: "Moyen",
  difficile: "Difficile",
};
const DIFF_VERS_BANQUE: Record<Difficulty, DifficulteBanque> = {
  Facile: "facile",
  Moyen: "moyen",
  Difficile: "difficile",
};

function chapitreDe(lessonId: ProbStatLessonId): number {
  return parseInt(lessonId.slice(3), 10); // « PSD2 » → 2
}

/**
 * Pool par défaut : la vitrine bundlée, à plat. Elle est VIDE aujourd'hui
 * (tout est réservé), donc un visiteur sans accès n'obtient aucune question
 * de ce cours — voulu. Un détenteur passe `banque.exercices`.
 */
const BUNDLE_APLATI: Exercice[] = CHAPITRES.flatMap((c) => c.exercices);

/**
 * Pool utilisable pour un tirage : filtre par chapitre, par kind, par
 * difficulté, et écarte les exos avec figure manquante.
 *
 * @param pool  Liste à plat des exercices disponibles. Optionnel — sans lui,
 *              on retombe sur les 65 gratuits du bundle. Les détenteurs
 *              d'accès passent les 305 via useExercicesComplets.
 */
function poolFor(
  lessonId: ProbStatLessonId,
  kind: Kind,
  difficulty?: Difficulty,
  pool: Exercice[] = BUNDLE_APLATI,
): Exercice[] {
  const num = chapitreDe(lessonId);
  const filtreDiff = difficulty ? DIFF_VERS_BANQUE[difficulty] : null;
  return pool.filter(
    (ex) =>
      ex.chapitre === num &&
      correspondAuKind(ex.type, kind) &&
      (!filtreDiff || ex.difficulte === filtreDiff),
  );
}

/** Nombre d'exercices disponibles pour un (chapitre, canal, difficulté). */
export function countAvailable(
  lessonId: ProbStatLessonId,
  kind: Kind,
  difficulty?: Difficulty,
  pool?: Exercice[],
): number {
  return poolFor(lessonId, kind, difficulty, pool).length;
}

export function hasAny(
  lessonId: ProbStatLessonId,
  kind: Kind,
  difficulty?: Difficulty,
  pool?: Exercice[],
): boolean {
  return countAvailable(lessonId, kind, difficulty, pool) > 0;
}

// ═══════════════════════════════════════════════════════════════════════
//  Traduction Exercice (banque) → Exercise (site)
// ═══════════════════════════════════════════════════════════════════════
//
// Le type `Etape` exposé par la banque ne déclare pas `choix` (énoncés de
// QCM et V/F) ni `analyseChoix` (bonne réponse des QCM) — pourtant présents
// dans les fichiers JSON. Plutôt que d'étendre les types partagés (ça
// affecterait la vitrine dédiée qui les consomme aussi), on lit ces champs
// via un accès prudent typé localement.

type ChoixEnonce = { cle: string; texte: string };
type AnalyseChoix = { cle: string; correct: boolean };

function etape(ex: Exercice, palier: Etape["etape"]): Record<string, unknown> | undefined {
  const e = ex.etapes.find((s) => s.etape === palier);
  return e as unknown as Record<string, unknown> | undefined;
}

/** Titre lisible tiré des mots-clés de l'exercice, sinon l'ID brut. */
function titreDe(ex: Exercice): string {
  const cle = ex.motsCles?.[0];
  if (cle && cle.length > 0) {
    return cle.charAt(0).toLocaleUpperCase("fr-FR") + cle.slice(1);
  }
  return ex.id;
}

function texteReponse(ex: Exercice): string {
  const r = etape(ex, "reponse");
  return typeof r?.texte === "string" ? r.texte : "";
}

function lignesDemarche(ex: Exercice): string[] {
  const d = etape(ex, "demarche");
  return Array.isArray(d?.lignes) ? (d.lignes as string[]) : [];
}

function texteEnonce(ex: Exercice): string {
  const e = etape(ex, "enonce");
  return typeof e?.texte === "string" ? e.texte : "";
}

/** Choix + bonne réponse d'un QCM, croisés avec l'analyseChoix du corrigé. */
function optionsQcm(ex: Exercice): MCQOption[] {
  const e = etape(ex, "enonce");
  const d = etape(ex, "demarche");
  const choix = Array.isArray(e?.choix) ? (e.choix as ChoixEnonce[]) : [];
  const analyses = Array.isArray(d?.analyseChoix) ? (d.analyseChoix as AnalyseChoix[]) : [];
  return choix.map((c) => {
    const analyse = analyses.find((a) => a.cle === c.cle);
    return {
      id: c.cle,
      content: c.texte,
      correct: analyse?.correct === true,
    };
  });
}

function explicationDemarche(ex: Exercice): string {
  const lignes = lignesDemarche(ex);
  if (lignes.length === 0) return "";
  return lignes.join("\n\n");
}

function traduire(ex: Exercice, lessonId: ProbStatLessonId): Exercise {
  const kindType: Exercise["type"] =
    ex.type === "qcm" ? "mcq" : ex.type === "vrai-faux" ? "tf" : undefined;

  const base: Exercise = {
    id: ex.id,
    topicId: "probability",
    lessonId,
    title: titreDe(ex),
    difficulty: DIFF_VERS_SITE[ex.difficulte],
    prompt: texteEnonce(ex),
    steps: lignesDemarche(ex),
    answer: texteReponse(ex),
    format: "latex",
  };

  if (kindType === "mcq") {
    return { ...base, type: "mcq", options: optionsQcm(ex), explanation: explicationDemarche(ex) };
  }
  if (kindType === "tf") {
    // La banque met la bonne réponse en clair dans etape("reponse").texte.
    const rep = texteReponse(ex).trim().toLowerCase();
    const isTrue = rep === "vrai" || rep.startsWith("vrai");
    return { ...base, type: "tf", isTrue, explanation: explicationDemarche(ex) };
  }
  return base;
}

// ═══════════════════════════════════════════════════════════════════════
//  Picker stateful — un par buildCustomQuiz() pour dédup au sein d'un quiz
// ═══════════════════════════════════════════════════════════════════════

export class ProbStatPicker {
  // key = `${lessonId}|${kind}|${difficulty ?? "any"}`; value = queue mélangée
  private queues = new Map<string, Exercice[]>();
  /**
   * Le pool servant à chaque tirage. Fixé à la construction — un même
   * quiz doit puiser dans un ensemble cohérent, même si l'accès change
   * en cours de session (peu probable mais on ne veut pas mélanger).
   * Par défaut : la vitrine bundlée (vide aujourd'hui). Passer
   * `banque.exercices` (via useExercicesComplets) pour un détenteur d'accès.
   *
   * Champ déclaré explicitement plutôt que par `parameter property` :
   * l'option `erasableSyntaxOnly` du projet interdit le sucre TS qui
   * génère du code, pour permettre de tourner le TS directement sous
   * Node sans transpilation.
   */
  private readonly pool: Exercice[];
  constructor(pool: Exercice[] = BUNDLE_APLATI) {
    this.pool = pool;
  }

  draw(
    lessonId: ProbStatLessonId,
    kind: Kind,
    difficulty?: Difficulty,
  ): Exercise | null {
    const key = `${lessonId}|${kind}|${difficulty ?? "any"}`;
    let queue = this.queues.get(key);
    if (!queue) {
      queue = shuffle(poolFor(lessonId, kind, difficulty, this.pool));
      this.queues.set(key, queue);
    }
    const brut = queue.shift();
    if (!brut) return null;
    return traduire(brut, lessonId);
  }
}
