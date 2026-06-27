import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import type { Exercise, MCQOption } from "../../data/exercises";
import { topics } from "../../data/topics";
import { getLessonById } from "../../data/lessons";
import RichContent from "../ui/RichContent";

const difficultyStyles: Record<Exercise["difficulty"], string> = {
  Fondamental: "bg-accent-500/10 text-accent-600",
  Intermédiaire: "bg-brand-100 text-brand-700",
  Avancé: "bg-amber-100 text-amber-700",
};

// Deterministic shuffle so the same exercise always shows options in the same
// order across renders, but different exercises get different orderings.
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    hash = (hash * 9301 + 49297) % 233280;
    const j = Math.abs(hash) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const OPTION_LETTERS = ["a", "b", "c", "d", "e", "f"];

type MCQCardProps = { exercise: Exercise };

export default function MCQCard({ exercise }: MCQCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const topic = topics.find((t) => t.id === exercise.topicId);
  const lesson = exercise.lessonId ? getLessonById(exercise.lessonId) : null;
  const contextLabel = lesson ? `Leçon ${lesson.number}` : topic?.name;

  const options: MCQOption[] = useMemo(() => {
    const original = exercise.options ?? [];
    const shuffled = seededShuffle(original, exercise.id);
    return shuffled.map((opt, i) => ({ ...opt, id: OPTION_LETTERS[i] ?? opt.id }));
  }, [exercise.id, exercise.options]);
  const answered = selected !== null;
  const selectedOption = options.find((o) => o.id === selected);
  const isCorrect = selectedOption?.correct ?? false;

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm shadow-brand-900/5 transition-shadow duration-200 hover:shadow-md hover:shadow-brand-900/10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {contextLabel}
        </span>
        <span
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-semibold",
            difficultyStyles[exercise.difficulty]
          )}
        >
          {exercise.difficulty}
        </span>
        <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
          QCM
        </span>
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-brand-900">
        {exercise.title}
      </h3>
      <div className="mt-2 font-mono text-sm leading-relaxed text-ink-700">
        <RichContent content={exercise.prompt} />
      </div>

      <div className="mt-5 space-y-2.5">
        {options.map((opt) => {
          const isThisSelected = selected === opt.id;
          const showCorrect = answered && opt.correct;
          const showWrong = answered && isThisSelected && !opt.correct;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !answered && setSelected(opt.id)}
              disabled={answered}
              className={clsx(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-200",
                !answered &&
                  "cursor-pointer border-brand-200 bg-white text-ink-700 hover:border-brand-400 hover:bg-brand-50",
                showCorrect && "border-emerald-400 bg-emerald-50 text-emerald-900",
                showWrong && "border-rose-400 bg-rose-50 text-rose-900",
                answered && !showCorrect && !showWrong && "border-brand-100 bg-brand-50/40 text-ink-600/70"
              )}
            >
              <span
                className={clsx(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold",
                  showCorrect && "bg-emerald-500 text-white",
                  showWrong && "bg-rose-500 text-white",
                  !showCorrect && !showWrong && "bg-brand-100 text-brand-700"
                )}
              >
                {opt.id}
              </span>
              <span className="flex-1 leading-relaxed">
                <RichContent content={opt.content} />
              </span>
              {showCorrect && (
                <span aria-hidden className="ml-2 text-emerald-600">
                  ✓
                </span>
              )}
              {showWrong && (
                <span aria-hidden className="ml-2 text-rose-600">
                  ✗
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {answered && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={clsx(
              "mt-4 rounded-xl px-4 py-3 text-sm",
              isCorrect
                ? "bg-emerald-50 text-emerald-900"
                : "bg-rose-50 text-rose-900"
            )}
          >
            <p className="font-semibold">
              {isCorrect ? "Bonne réponse !" : "Mauvaise réponse."}
            </p>
            {exercise.explanation && (
              <div className="mt-1.5 leading-relaxed">
                <RichContent content={exercise.explanation} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-current/30 px-3 py-1 text-xs font-semibold transition-colors duration-200 hover:bg-current/5"
            >
              Réessayer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
