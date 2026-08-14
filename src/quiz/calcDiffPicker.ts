// Calcul différentiel — banque figée (src/data/calcul-differentiel/).
//
// Même contrat que probStatPicker.ts : tirage sans remise par
// (lessonId, kind, difficulty), pool réinitialisé à chaque nouveau quiz.
// La différence : les objets bruts (`Exercice`) ne suivent PAS le format
// `Exercise` du site. On les traduit à la volée dans `traduire()`, et on
// pose `format: "latex"` pour que les cartes utilisent <Mathematiques>
// plutôt que <RichContent>.
//
// Aucun chemin de code particulier n'est réservé à ce cours : les IDs
// CD1..CD7 passent par les mêmes fonctions que PSD1..PSD4 (dispatcher
// dans customGenerators.ts, filtre difficulté dans CustomQuiz.tsx).

import type { Difficulty, Exercise, MCQOption } from "../data/exercises";
import { CHAPITRES } from "../data/calcul-differentiel";
import type {
  Difficulte as DifficulteBanque,
  Etape,
  Exercice,
  TypeExercice,
} from "../data/calcul-differentiel";
import { shuffle } from "./rng";

export const CALC_DIFF_LESSONS = ["CD1", "CD2", "CD3", "CD4", "CD5", "CD6", "CD7"] as const;
export type CalcDiffLessonId = (typeof CALC_DIFF_LESSONS)[number];

export function isCalcDiffLesson(lessonId: string): lessonId is CalcDiffLessonId {
  return (CALC_DIFF_LESSONS as readonly string[]).includes(lessonId);
}

// ═══════════════════════════════════════════════════════════════════════
//  Résolution des figures — Vite hache les URL au build.
//
//  Le champ `figure` dans les JSON est un chemin relatif au dossier de la
//  banque (« figures/CD-C01-E003.svg »). import.meta.glob à travers Vite
//  transforme ces fichiers en assets servables, on garde la carte
//  chemin-JSON → URL-servable dans FIGURES.
// ═══════════════════════════════════════════════════════════════════════

const svgUrls = import.meta.glob("../data/calcul-differentiel/figures/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Table `nom-de-fichier → URL Vite`, dérivée du glob. */
const FIGURES: Map<string, string> = new Map(
  Object.entries(svgUrls).map(([chemin, url]) => {
    const nom = chemin.split("/").pop() ?? chemin;
    return [nom, url];
  }),
);

/** Résout un `figure` du JSON (« figures/XXX.svg ») en URL servable, ou null. */
function resoudreFigureUrl(cheminJson: string | undefined): string | null {
  if (!cheminJson) return null;
  const nom = cheminJson.split("/").pop() ?? cheminJson;
  return FIGURES.get(nom) ?? null;
}

// ═══════════════════════════════════════════════════════════════════════
//  Exclusion des exos dont la figure manque
//
//  Deux cas :
//    1. `figure` déclaré dans le JSON mais SVG absent du glob → exclu.
//    2. Énoncé mentionne un graphique/figure mais sans champ `figure` du
//       tout — défaut de la banque source. Liste noire explicite plutôt
//       qu'heuristique regex, pour éviter les faux positifs et documenter
//       les cas connus. À vider quand la banque sera corrigée.
// ═══════════════════════════════════════════════════════════════════════

const EXOS_A_EXCLURE: ReadonlySet<string> = new Set([
  // Énoncé parle d'un graphique mais aucune figure n'a été produite.
  "CD-C02-E039",
  "CD-C07-E011",
]);

function estUtilisable(ex: Exercice): boolean {
  if (EXOS_A_EXCLURE.has(ex.id)) return false;
  const enonce = ex.etapes.find((e) => e.etape === "enonce") as
    | { figure?: string }
    | undefined;
  if (enonce?.figure && !resoudreFigureUrl(enonce.figure)) return false;
  return true;
}

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

function chapitreDe(lessonId: CalcDiffLessonId): number {
  return parseInt(lessonId.slice(2), 10);
}

/**
 * Pool par défaut : les 65 gratuits, à plat. Utilisé quand aucun pool n'est
 * passé — cas d'un visiteur sans accès valide, où le hook progression
 * (useExercicesComplets) n'a rien de plus à offrir.
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
  lessonId: CalcDiffLessonId,
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
      (!filtreDiff || ex.difficulte === filtreDiff) &&
      estUtilisable(ex),
  );
}

export function hasAny(
  lessonId: CalcDiffLessonId,
  kind: Kind,
  difficulty?: Difficulty,
  pool?: Exercice[],
): boolean {
  return poolFor(lessonId, kind, difficulty, pool).length > 0;
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

function traduire(ex: Exercice, lessonId: CalcDiffLessonId): Exercise {
  const kindType: Exercise["type"] =
    ex.type === "qcm" ? "mcq" : ex.type === "vrai-faux" ? "tf" : undefined;

  const enonce = etape(ex, "enonce");
  const figureUrl = resoudreFigureUrl(enonce?.figure as string | undefined);

  const base: Exercise = {
    id: ex.id,
    topicId: "differential-calculus",
    lessonId,
    title: titreDe(ex),
    difficulty: DIFF_VERS_SITE[ex.difficulte],
    prompt: texteEnonce(ex),
    steps: lignesDemarche(ex),
    answer: texteReponse(ex),
    format: "latex",
    ...(figureUrl ? { figure: figureUrl } : {}),
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

export class CalcDiffPicker {
  // key = `${lessonId}|${kind}|${difficulty ?? "any"}`; value = queue mélangée
  private queues = new Map<string, Exercice[]>();
  /**
   * Le pool servant à chaque tirage. Fixé à la construction — un même
   * quiz doit puiser dans un ensemble cohérent, même si l'accès change
   * en cours de session (peu probable mais on ne veut pas mélanger).
   * Par défaut : les 65 gratuits du bundle. Passer `banque.exercices`
   * (via useExercicesComplets) pour un détenteur d'accès.
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
    lessonId: CalcDiffLessonId,
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
