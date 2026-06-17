import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import type { Exercise } from "../../data/exercises";
import { topics } from "../../data/topics";
import { getLessonById } from "../../data/lessons";
import RichContent from "../ui/RichContent";

const difficultyStyles: Record<Exercise["difficulty"], string> = {
  Fondamental: "bg-accent-500/10 text-accent-600",
  Intermédiaire: "bg-brand-100 text-brand-700",
  Avancé: "bg-amber-100 text-amber-700",
};

type TFCardProps = { exercise: Exercise };

export default function TFCard({ exercise }: TFCardProps) {
  const [picked, setPicked] = useState<boolean | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const topic = topics.find((t) => t.id === exercise.topicId);
  const lesson = exercise.lessonId ? getLessonById(exercise.lessonId) : null;
  const contextLabel = lesson ? `Leçon ${lesson.number}` : topic?.name;

  const correctAnswer = exercise.isTrue ?? false;
  const answered = picked !== null;
  const isCorrect = answered && picked === correctAnswer;

  const buttonStyle = (value: boolean) => {
    if (!answered) {
      return "cursor-pointer border-brand-200 bg-white text-ink-700 hover:border-brand-400 hover:bg-brand-50";
    }
    if (value === correctAnswer) {
      return "border-emerald-400 bg-emerald-50 text-emerald-900";
    }
    if (picked === value) {
      return "border-rose-400 bg-rose-50 text-rose-900";
    }
    return "border-brand-100 bg-brand-50/40 text-ink-600/70";
  };

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
        <span className="rounded-full bg-accent-500 px-3 py-1 text-xs font-semibold text-white">
          Vrai/Faux
        </span>
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-brand-900">
        {exercise.title}
      </h3>
      <div className="mt-2 font-mono text-sm leading-relaxed text-ink-700">
        <RichContent content={exercise.prompt} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => !answered && setPicked(true)}
          disabled={answered}
          className={clsx(
            "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors duration-200",
            buttonStyle(true)
          )}
        >
          Vrai
          {answered && correctAnswer === true && (
            <span aria-hidden className="text-emerald-600">✓</span>
          )}
          {answered && picked === true && correctAnswer === false && (
            <span aria-hidden className="text-rose-600">✗</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => !answered && setPicked(false)}
          disabled={answered}
          className={clsx(
            "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors duration-200",
            buttonStyle(false)
          )}
        >
          Faux
          {answered && correctAnswer === false && (
            <span aria-hidden className="text-emerald-600">✓</span>
          )}
          {answered && picked === false && correctAnswer === true && (
            <span aria-hidden className="text-rose-600">✗</span>
          )}
        </button>
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
              {isCorrect ? "Bonne réponse !" : `Mauvaise réponse — la bonne réponse est ${correctAnswer ? "Vrai" : "Faux"}.`}
            </p>
            {exercise.explanation && (
              <div className="mt-1.5 leading-relaxed">
                <RichContent content={exercise.explanation} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setPicked(null)}
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
