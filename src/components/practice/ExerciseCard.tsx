import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import type { Exercise, RichContent as RichContentValue } from "../../data/exercises";
import { topics } from "../../data/topics";
import { getLessonById } from "../../data/lessons";
import Matrix from "../ui/Matrix";
import RichContent from "../ui/RichContent";
import MCQCard from "./MCQCard";
import TFCard from "./TFCard";

const difficultyStyles: Record<Exercise["difficulty"], string> = {
  Fondamental: "bg-accent-500/10 text-accent-600",
  Intermédiaire: "bg-brand-100 text-brand-700",
  Avancé: "bg-amber-100 text-amber-700",
};

const stepListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const stepItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

type ExerciseCardProps = {
  exercise: Exercise;
};

const SUBPART_PREFIX = /^([a-h])\)\s*/;

function detectSubpart(
  step: RichContentValue
): { letter: string; rest: RichContentValue } | null {
  if (typeof step === "string") {
    const m = step.match(SUBPART_PREFIX);
    if (!m) return null;
    return { letter: m[1], rest: step.slice(m[0].length) };
  }
  if (step.length === 0 || step[0].type !== "text") return null;
  const m = step[0].content.match(SUBPART_PREFIX);
  if (!m) return null;
  const newFirst = { type: "text" as const, content: step[0].content.slice(m[0].length) };
  return { letter: m[1], rest: [newFirst, ...step.slice(1)] };
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  // Interactive question types — render specialised cards
  if (exercise.type === "mcq") return <MCQCard exercise={exercise} />;
  if (exercise.type === "tf") return <TFCard exercise={exercise} />;

  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const topic = topics.find((t) => t.id === exercise.topicId);
  const lesson = exercise.lessonId ? getLessonById(exercise.lessonId) : null;
  const contextLabel = lesson ? `Leçon ${lesson.number}` : topic?.name;

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
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-brand-900">
        {exercise.title}
      </h3>
      <div className="mt-2 font-mono text-sm leading-relaxed text-ink-700">
        <RichContent content={exercise.prompt} />
      </div>

      {exercise.matrix && (
        <Matrix data={exercise.matrix.data} label={exercise.matrix.label} />
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors duration-200 hover:bg-brand-50"
      >
        {open ? "Masquer la solution" : "Voir la solution"}
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="solution"
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <motion.ol
              variants={stepListVariants}
              initial="hidden"
              animate="visible"
              className="mt-5 space-y-3 border-t border-brand-100 pt-4"
            >
              {exercise.steps.map((step, i) => {
                const sub = detectSubpart(step);
                return (
                  <motion.li
                    key={i}
                    variants={stepItemVariants}
                    className="flex gap-3 text-sm text-ink-600"
                  >
                    <span
                      className={clsx(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                        sub
                          ? "bg-accent-500/15 text-accent-600"
                          : "bg-brand-100 text-brand-700"
                      )}
                    >
                      {sub ? sub.letter : i + 1}
                    </span>
                    <span className="leading-relaxed">
                      <RichContent content={sub ? sub.rest : step} />
                    </span>
                  </motion.li>
                );
              })}
            </motion.ol>

            <motion.div
              variants={stepItemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: exercise.steps.length * 0.12 }}
              className="mt-4 rounded-xl bg-accent-500/10 px-4 py-3 text-sm font-semibold text-accent-600"
            >
              Réponse : <RichContent content={exercise.answer} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
