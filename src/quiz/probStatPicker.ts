// Prob-Stat exercise picker for the custom quiz.
//
// Contrary to the linear-algebra lessons (which generate questions procedurally
// at each call via customGenerators.ts), the Prob-Stat chapters ship as a fixed
// bank of 388 hand-authored exercises stored in src/data/exercises.ts. This
// module wires that bank into buildCustomQuiz() with:
//   - random draw without replacement per (lessonId, type) pool,
//   - optional difficulty filter (Facile / Moyen / Difficile) — a bonus that
//     the linear-algebra quiz doesn't currently expose,
//   - graceful cap when the requested count exceeds the pool.
//
// A picker instance is created per buildCustomQuiz() call so successive draws
// within the same quiz never repeat a question.

import type { Difficulty, Exercise } from "../data/exercises";
import { exercises as allExercises } from "../data/exercises";
import { shuffle } from "./rng";

export const PROB_STAT_LESSONS = ["PSD1", "PSD2", "PSD3", "PSD4"] as const;
export type ProbStatLessonId = (typeof PROB_STAT_LESSONS)[number];

export function isProbStatLesson(lessonId: string): lessonId is ProbStatLessonId {
  return (PROB_STAT_LESSONS as readonly string[]).includes(lessonId);
}

// The "kind" corresponds to how the UI classifies questions:
//   - "exercise" = CALC = a plain step-by-step question (no `type` field on Exercise)
//   - "mcq"      = multiple choice (Exercise.type === "mcq")
//   - "tf"       = true/false (Exercise.type === "tf")
type Kind = "exercise" | "mcq" | "tf";

function matchesKind(ex: Exercise, kind: Kind): boolean {
  if (kind === "mcq") return ex.type === "mcq";
  if (kind === "tf") return ex.type === "tf";
  return ex.type === undefined;
}

function poolFor(
  lessonId: ProbStatLessonId,
  kind: Kind,
  difficulty?: Difficulty,
): Exercise[] {
  return allExercises.filter(
    (ex) =>
      ex.lessonId === lessonId &&
      matchesKind(ex, kind) &&
      (difficulty === undefined || ex.difficulty === difficulty),
  );
}

// Cached counts for the UI (available types + counters per pool).
// Small and cheap to compute — used by getAvailableTypes and by callers that
// want to display something like "23 CALC disponibles".
export function countAvailable(
  lessonId: ProbStatLessonId,
  kind: Kind,
  difficulty?: Difficulty,
): number {
  return poolFor(lessonId, kind, difficulty).length;
}

export function hasAny(
  lessonId: ProbStatLessonId,
  kind: Kind,
  difficulty?: Difficulty,
): boolean {
  return countAvailable(lessonId, kind, difficulty) > 0;
}

// Stateful picker: one instance per buildCustomQuiz() call so draws are
// unique WITHIN a quiz but the pool resets for the next one.
export class ProbStatPicker {
  // key = `${lessonId}|${kind}|${difficulty ?? "any"}`; value = shuffled queue
  private queues = new Map<string, Exercise[]>();

  draw(
    lessonId: ProbStatLessonId,
    kind: Kind,
    difficulty?: Difficulty,
  ): Exercise | null {
    const key = `${lessonId}|${kind}|${difficulty ?? "any"}`;
    let queue = this.queues.get(key);
    if (!queue) {
      queue = shuffle(poolFor(lessonId, kind, difficulty));
      this.queues.set(key, queue);
    }
    return queue.shift() ?? null;
  }
}
