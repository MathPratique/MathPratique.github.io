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
} from "../data/calcul-differentiel";
import { compterCibles, filtrerPool, type Canal } from "./filtrage";
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

// Les trois canaux du quiz (`exercise` = CALC, `mcq` = QCM, `tf` = V/F) et
// le filtre lui-même vivent dans filtrage.ts, partagés avec prob-stat. Ce
// qui reste propre à ce cours — l'exclusion des figures manquantes — passe
// par le paramètre `utilisable`.
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
 * Le critère de tirage, dans le vocabulaire de la banque.
 *
 * @param sections  Sections visées à l'intérieur du chapitre (« 2.7 »).
 *                  Absentes : tout le chapitre, comportement d'origine.
 */
function critereDe(
  lessonId: CalcDiffLessonId,
  canal: Canal,
  difficulty?: Difficulty,
  sections?: readonly string[],
) {
  return {
    chapitre: chapitreDe(lessonId),
    canal,
    difficulte: difficulty ? DIFF_VERS_BANQUE[difficulty] : undefined,
    sections,
  };
}

/**
 * Nombre d'exercices disponibles pour ce critère — les cibles seulement,
 * jamais le complément du même chapitre.
 *
 * @param pool  Liste à plat des exercices disponibles. Optionnel — sans lui,
 *              on retombe sur les gratuits du bundle. Les détenteurs d'accès
 *              passent la banque complète via useExercicesComplets.
 */
export function countAvailable(
  lessonId: CalcDiffLessonId,
  canal: Canal,
  difficulty?: Difficulty,
  pool: Exercice[] = BUNDLE_APLATI,
  sections?: readonly string[],
): number {
  return compterCibles(pool, critereDe(lessonId, canal, difficulty, sections), estUtilisable);
}

export function hasAny(
  lessonId: CalcDiffLessonId,
  canal: Canal,
  difficulty?: Difficulty,
  pool?: Exercice[],
  sections?: readonly string[],
): boolean {
  return countAvailable(lessonId, canal, difficulty, pool, sections) > 0;
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
  // clé = `${lessonId}|${canal}|${difficulté}|${sections}` ; valeur = les deux
  // files mélangées, celle des sections visées et celle du reste du chapitre.
  private queues = new Map<string, { cibles: Exercice[]; complements: Exercice[] }>();
  /**
   * Combien d'exercices ont été pris hors des sections demandées, faute de
   * mieux. L'interface s'en sert pour le dire à l'étudiant.
   */
  public complementsUtilises = 0;
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
    canal: Canal,
    difficulty?: Difficulty,
    sections?: readonly string[],
  ): Exercise | null {
    const cle = `${lessonId}|${canal}|${difficulty ?? "any"}|${(sections ?? []).join(",")}`;
    let files = this.queues.get(cle);
    if (!files) {
      const { cibles, complements } = filtrerPool(
        this.pool,
        critereDe(lessonId, canal, difficulty, sections),
        estUtilisable,
      );
      files = { cibles: shuffle(cibles), complements: shuffle(complements) };
      this.queues.set(cle, files);
    }
    // Les sections demandées d'abord, toujours. Le reste du chapitre ne sert
    // que lorsqu'elles sont épuisées.
    let brut = files.cibles.shift();
    if (!brut) {
      brut = files.complements.shift();
      if (brut) this.complementsUtilises++;
    }
    if (!brut) return null;
    return traduire(brut, lessonId);
  }
}
