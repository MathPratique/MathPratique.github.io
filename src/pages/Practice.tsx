import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import type { Exercise } from "../data/exercises";
import { exercises } from "../data/exercises";
import { getChaptersForTopic, getLessonById } from "../data/lessons";
import { Link } from "react-router-dom";
import TopicFilter from "../components/practice/TopicFilter";
import LessonNav from "../components/practice/LessonNav";
import ExerciseCard from "../components/practice/ExerciseCard";
import AnimatedSection from "../components/ui/AnimatedSection";
import { hasQuizGenerator } from "../quiz/registry";

type ExerciseKind = "exercise" | "mcq" | "tf";

const KIND_LABELS: Record<ExerciseKind, string> = {
  exercise: "Exercices",
  mcq: "Questions à choix multiples",
  tf: "Vrai ou Faux",
};

function getExerciseKind(ex: Exercise): ExerciseKind {
  if (ex.type === "mcq") return "mcq";
  if (ex.type === "tf") return "tf";
  return "exercise";
}

export default function Practice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTopic = searchParams.get("topic") ?? "all";
  const activeLesson = searchParams.get("lesson");
  const activeKind = (searchParams.get("kind") as ExerciseKind | null) ?? "exercise";

  const hasChapters = useMemo(
    () => getChaptersForTopic(activeTopic).length > 0,
    [activeTopic]
  );

  const lesson = activeLesson ? getLessonById(activeLesson) : null;

  // All exercises in the current lesson (or topic), pre-kind filter
  const lessonAll = useMemo(() => {
    if (activeLesson) {
      return exercises.filter((e) => e.lessonId === activeLesson);
    }
    if (activeTopic === "all") {
      // Skip lesson-based exercises in the "all" view — they live inside their lessons.
      return exercises.filter((e) => !e.lessonId);
    }
    if (hasChapters) {
      // The topic has chapters; we render LessonNav instead of an exercise grid.
      return [];
    }
    return exercises.filter((e) => e.topicId === activeTopic);
  }, [activeTopic, activeLesson, hasChapters]);

  // Counts per kind for the lesson view (used in the tab labels)
  const kindCounts = useMemo(() => {
    return lessonAll.reduce(
      (acc, ex) => {
        acc[getExerciseKind(ex)]++;
        return acc;
      },
      { exercise: 0, mcq: 0, tf: 0 } as Record<ExerciseKind, number>
    );
  }, [lessonAll]);

  // Kind-filtered list shown in the grid
  const filtered = useMemo(() => {
    if (!activeLesson) return lessonAll;
    return lessonAll.filter((ex) => getExerciseKind(ex) === activeKind);
  }, [lessonAll, activeLesson, activeKind]);

  function handleTopicChange(topicId: string) {
    if (topicId === "all") {
      searchParams.delete("topic");
    } else {
      searchParams.set("topic", topicId);
    }
    searchParams.delete("lesson");
    searchParams.delete("kind");
    setSearchParams(searchParams, { replace: true });
  }

  function openLesson(lessonId: string) {
    searchParams.set("lesson", lessonId);
    searchParams.delete("kind");
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToLessons() {
    searchParams.delete("lesson");
    searchParams.delete("kind");
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setKind(kind: ExerciseKind) {
    if (kind === "exercise") {
      searchParams.delete("kind");
    } else {
      searchParams.set("kind", kind);
    }
    setSearchParams(searchParams, { replace: true });
  }

  const showLessonNav = hasChapters && !activeLesson;
  const showLessonHeader = hasChapters && !!activeLesson && lesson;

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="max-w-2xl">
        <h1 className="text-balance text-4xl font-bold sm:text-5xl">Exercices</h1>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Choisissez une matière et avancez à votre rythme. Chaque carte
          s'ouvre sur une solution complète étape par étape quand vous êtes
          prêt à vérifier votre raisonnement.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-8">
        <TopicFilter active={activeTopic} onChange={handleTopicChange} />
      </AnimatedSection>

      {showLessonHeader && lesson && (
        <AnimatedSection delay={0.15} className="mt-8">
          <button
            type="button"
            onClick={backToLessons}
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
            Retour aux leçons
          </button>
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="rounded-full bg-brand-100 px-3 py-1 font-mono text-xs font-semibold text-brand-700">
              Leçon {lesson.number}
            </span>
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              {lesson.name}
            </h2>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <p className="text-sm text-ink-600">
              {lessonAll.length} exercice{lessonAll.length > 1 ? "s" : ""} dans cette leçon
            </p>
            {activeLesson && hasQuizGenerator(activeLesson) && (
              <Link
                to={`/quiz?topic=${activeTopic}&lesson=${activeLesson}`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-accent-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                Démarrer un quiz (5 exercices)
              </Link>
            )}
          </div>
        </AnimatedSection>
      )}

      {showLessonNav ? (
        <div className="mt-12">
          <LessonNav topicId={activeTopic} onLessonClick={openLesson} />
        </div>
      ) : (
        <>
          {activeLesson && (
            <AnimatedSection delay={0.2} className="mt-8">
              <div
                role="tablist"
                aria-label="Filtrer par type d'exercice"
                className="flex flex-wrap gap-2"
              >
                {(["exercise", "mcq", "tf"] as const).map((k) => {
                  const isActive = activeKind === k;
                  const count = kindCounts[k];
                  const disabled = count === 0;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      disabled={disabled}
                      onClick={() => setKind(k)}
                      className={clsx(
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                          : disabled
                          ? "cursor-not-allowed border-brand-100 bg-brand-50/50 text-ink-600/40"
                          : "cursor-pointer border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                      )}
                    >
                      {KIND_LABELS[k]}
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          isActive
                            ? "bg-white/20 text-white"
                            : disabled
                            ? "bg-brand-100 text-ink-600/40"
                            : "bg-brand-100 text-brand-700"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </AnimatedSection>
          )}

          {filtered.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((exercise, i) => (
                <AnimatedSection key={exercise.id} delay={Math.min(i * 0.04, 0.25)}>
                  <ExerciseCard exercise={exercise} />
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <AnimatedSection className="mt-16 text-center text-ink-600">
              <p>
                {activeLesson
                  ? `Aucune question de ce type dans la leçon « ${lesson?.name} » pour l'instant.`
                  : "Aucun exercice dans cette matière pour l'instant — revenez bientôt."}
              </p>
            </AnimatedSection>
          )}
        </>
      )}
    </div>
  );
}
