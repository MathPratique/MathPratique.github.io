import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { getLessonById } from "../data/lessons";
import AnimatedSection from "../components/ui/AnimatedSection";
import {
  CUSTOM_QUIZ_LESSONS,
  encodeCustomQuiz,
  getAvailableTypes,
  type CustomQuizSpec,
} from "../quiz/customGenerators";

type RowState = {
  exercise: number;
  mcq: number;
  tf: number;
};

const ZERO: RowState = { exercise: 0, mcq: 0, tf: 0 };

function NumInput({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <input
      type="number"
      min={0}
      max={99}
      value={value}
      disabled={disabled}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        onChange(isNaN(n) ? 0 : Math.max(0, Math.min(99, n)));
      }}
      aria-label={label}
      className={clsx(
        "w-16 rounded-lg border px-2 py-1.5 text-center font-mono text-sm font-semibold transition-colors duration-150",
        disabled
          ? "cursor-not-allowed border-brand-100 bg-brand-50/50 text-ink-600/40"
          : "border-brand-300 bg-white text-brand-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
      )}
    />
  );
}

export default function CustomQuiz() {
  const navigate = useNavigate();

  const lessonMeta = useMemo(() => {
    return CUSTOM_QUIZ_LESSONS.map((id) => {
      const lesson = getLessonById(id);
      const available = getAvailableTypes(id);
      return {
        id,
        number: lesson?.number ?? 0,
        name: lesson?.name ?? id,
        available,
      };
    });
  }, []);

  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const l of CUSTOM_QUIZ_LESSONS) init[l] = { ...ZERO };
    return init;
  });

  function update(id: string, key: keyof RowState, n: number) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [key]: n } }));
  }

  const specs: CustomQuizSpec[] = useMemo(
    () =>
      lessonMeta
        .map((m) => ({
          lessonId: m.id,
          exerciseCount: rows[m.id].exercise,
          mcqCount: rows[m.id].mcq,
          tfCount: rows[m.id].tf,
        }))
        .filter(
          (s) => s.exerciseCount + s.mcqCount + s.tfCount > 0
        ),
    [rows, lessonMeta]
  );

  const totalQuestions = specs.reduce(
    (s, x) => s + x.exerciseCount + x.mcqCount + x.tfCount,
    0
  );

  function startQuiz() {
    if (specs.length === 0) return;
    const code = encodeCustomQuiz(specs);
    navigate(`/quiz?custom=${code}`);
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="max-w-2xl">
        <h1 className="text-balance text-4xl font-bold sm:text-5xl">
          Quiz personnalisé
        </h1>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Construis ton propre quiz : choisis combien d'exercices, de QCM et de
          Vrai/Faux tu veux pour chaque leçon. Les questions sont{" "}
          <strong>générées aléatoirement</strong> à chaque tirage — pas de
          limite, c'est toi qui décide !
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-10">
        <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white">
          <div className="grid min-w-[640px] grid-cols-[1.4fr_auto_auto_auto] items-center gap-x-6 gap-y-1 border-b border-brand-100 bg-brand-50/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <span>Leçon</span>
            <span className="w-16 text-center">Calc</span>
            <span className="w-16 text-center">QCM</span>
            <span className="w-16 text-center">V/F</span>
          </div>

          <ul className="min-w-[640px]">
            {lessonMeta.map((m) => {
              const state = rows[m.id];
              const hasAny = m.available.exercise || m.available.mcq || m.available.tf;
              return (
                <li
                  key={m.id}
                  className={clsx(
                    "grid grid-cols-[1.4fr_auto_auto_auto] items-center gap-x-6 gap-y-1 border-b border-brand-100 px-5 py-4 last:border-b-0",
                    !hasAny && "opacity-50"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 font-mono text-xs font-semibold text-brand-700">
                        Leçon {m.number}
                      </span>
                      <span className="text-sm font-semibold text-brand-900">
                        {m.name}
                      </span>
                    </div>
                  </div>
                  <NumInput
                    value={state.exercise}
                    onChange={(n) => update(m.id, "exercise", n)}
                    disabled={!m.available.exercise}
                    label={`Calc pour leçon ${m.number}`}
                  />
                  <NumInput
                    value={state.mcq}
                    onChange={(n) => update(m.id, "mcq", n)}
                    disabled={!m.available.mcq}
                    label={`QCM pour leçon ${m.number}`}
                  />
                  <NumInput
                    value={state.tf}
                    onChange={(n) => update(m.id, "tf", n)}
                    disabled={!m.available.tf}
                    label={`V/F pour leçon ${m.number}`}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.15} className="sticky bottom-4 mt-8">
        <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-brand-100 bg-white/95 p-5 shadow-lg shadow-brand-900/5 backdrop-blur-md sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-ink-600">
              {totalQuestions === 0
                ? "Définis au moins une question pour démarrer."
                : `${specs.length} leçon${specs.length > 1 ? "s" : ""} sélectionnée${specs.length > 1 ? "s" : ""}`}
            </p>
            <p className="font-display text-2xl font-bold text-brand-900">
              {totalQuestions} question{totalQuestions > 1 ? "s" : ""} au total
            </p>
          </div>
          <button
            type="button"
            onClick={startQuiz}
            disabled={totalQuestions === 0}
            className={clsx(
              "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold shadow-sm transition-colors duration-200",
              totalQuestions === 0
                ? "cursor-not-allowed bg-brand-200 text-white/70"
                : "cursor-pointer bg-brand-600 text-white hover:bg-brand-700"
            )}
          >
            Démarrer le quiz
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </AnimatedSection>
    </div>
  );
}
