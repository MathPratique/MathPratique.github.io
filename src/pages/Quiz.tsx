import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { getLessonById } from "../data/lessons";
import { topics } from "../data/topics";
import { generateQuiz, hasQuizGenerator } from "../quiz/registry";
import ExerciseCard from "../components/practice/ExerciseCard";
import AnimatedSection from "../components/ui/AnimatedSection";

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get("topic") ?? "";
  const lessonId = searchParams.get("lesson") ?? "";
  const lesson = lessonId ? getLessonById(lessonId) : null;
  const topic = topics.find((t) => t.id === topicId);

  const [seed, setSeed] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const exercises = useMemo(() => {
    if (!lessonId) return [];
    return generateQuiz(lessonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, seed]);

  const generatorAvailable = lessonId ? hasQuizGenerator(lessonId) : false;
  const total = exercises.length;

  function newQuiz() {
    setSeed((s) => s + 1);
    setCurrentIndex(0);
  }

  function goPrev() {
    setCurrentIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goNext() {
    setCurrentIndex((i) => Math.min(total - 1, i + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!lessonId || !lesson) {
    return (
      <div className="container-page py-16">
        <AnimatedSection className="max-w-2xl">
          <h1 className="text-balance text-3xl font-bold sm:text-4xl">Quiz</h1>
          <p className="mt-4 text-balance text-lg text-ink-600">
            Choisis une leçon pour lancer un quiz aléatoire de 5 exercices
            (1 facile, 2 intermédiaires, 2 avancés).
          </p>
          <Link
            to="/practice"
            className="mt-8 inline-flex cursor-pointer rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
          >
            Parcourir les leçons
          </Link>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="max-w-3xl">
        <Link
          to={`/practice?topic=${topicId}&lesson=${lessonId}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors duration-200 hover:bg-brand-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Retour à la leçon
        </Link>

        <div className="mt-6 flex flex-wrap items-baseline gap-3">
          <span className="rounded-full bg-accent-500/15 px-3 py-1 font-mono text-xs font-semibold text-accent-600">
            Quiz · Leçon {lesson.number}
          </span>
          <h1 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">
            {lesson.name}
          </h1>
        </div>
        <p className="mt-3 text-balance text-base text-ink-600">
          5 exercices aléatoires : <strong>1 facile, 2 intermédiaires, 2 avancés</strong>.
          {topic ? ` Matière : ${topic.name}.` : ""}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={newQuiz}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            Nouveau quiz
          </button>
        </div>
      </AnimatedSection>

      {!generatorAvailable ? (
        <AnimatedSection className="mt-16 max-w-xl rounded-2xl border border-brand-100 bg-white p-8 text-center">
          <h2 className="font-display text-xl font-semibold text-brand-900">
            Quiz pas encore disponible pour cette leçon
          </h2>
          <p className="mt-3 text-ink-600">
            Le générateur de quiz est en cours de construction pour cette leçon.
            En attendant, tu peux revenir à la leçon et travailler les exercices
            du cahier.
          </p>
          <Link
            to={`/practice?topic=${topicId}&lesson=${lessonId}`}
            className="mt-6 inline-flex cursor-pointer rounded-full border border-brand-200 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors duration-200 hover:bg-brand-50"
          >
            Retour à la leçon
          </Link>
        </AnimatedSection>
      ) : (
        <div className="mt-10">
          {/* Progress strip */}
          <AnimatedSection delay={0.1}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold text-brand-900">
                  Question {currentIndex + 1} / {total}
                </span>
              </div>
              <div className="flex gap-1.5" role="tablist" aria-label="Navigation par question">
                {exercises.map((ex, i) => (
                  <button
                    key={ex.id}
                    type="button"
                    role="tab"
                    aria-selected={i === currentIndex}
                    aria-label={`Aller à la question ${i + 1}`}
                    onClick={() => setCurrentIndex(i)}
                    className={clsx(
                      "h-2 w-8 cursor-pointer rounded-full transition-colors duration-200",
                      i === currentIndex
                        ? "bg-brand-600"
                        : i < currentIndex
                        ? "bg-brand-300"
                        : "bg-brand-100 hover:bg-brand-200"
                    )}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* All cards mounted — only the current one is visible.
              Keeps the "Voir la solution" toggle state intact when you navigate. */}
          <div className="mt-6">
            {exercises.map((ex, i) => (
              <div
                key={ex.id}
                style={{ display: i === currentIndex ? "block" : "none" }}
              >
                <ExerciseCard exercise={ex} />
              </div>
            ))}
          </div>

          {/* Navigation bottom */}
          <AnimatedSection delay={0.2} className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-200",
                currentIndex === 0
                  ? "cursor-not-allowed border-brand-100 bg-brand-50 text-ink-600/50"
                  : "cursor-pointer border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
              )}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              Question précédente
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex === total - 1}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors duration-200",
                currentIndex === total - 1
                  ? "cursor-not-allowed bg-brand-200 text-white/70"
                  : "cursor-pointer bg-brand-600 text-white hover:bg-brand-700"
              )}
            >
              Question suivante
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </button>
          </AnimatedSection>
        </div>
      )}
    </div>
  );
}
