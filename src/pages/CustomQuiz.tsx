import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { getLessonById, getChapterById } from "../data/lessons";
import { topics } from "../data/topics";
import type { Difficulty } from "../data/exercises";
import AnimatedSection from "../components/ui/AnimatedSection";
import TopicPicker from "../components/practice/TopicPicker";
import {
  CUSTOM_QUIZ_LESSONS,
  encodeCustomQuiz,
  getAvailableTypes,
  type CustomQuizSpec,
} from "../quiz/customGenerators";
import { isProbStatLesson } from "../quiz/probStatPicker";
import { isCalcDiffLesson } from "../quiz/calcDiffPicker";
import { useExercicesComplets } from "../banque/useExercicesComplets";

// Une leçon « de banque figée » (Prob-Stat ou Calcul différentiel) accepte
// le filtre de difficulté et s'affiche avec un badge « Chapitre » plutôt
// que « Leçon ». Les leçons procédurales d'algèbre linéaire (L*) restent
// hors périmètre — leur difficulté est câblée dans les générateurs.
function isBankLesson(lessonId: string): boolean {
  return isProbStatLesson(lessonId) || isCalcDiffLesson(lessonId);
}

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

// Look up which topic each eligible lesson belongs to by chasing
// lesson.chapterId → chapter.topicId.
function getLessonTopic(lessonId: string): string | null {
  const lesson = getLessonById(lessonId);
  if (!lesson) return null;
  const chapter = getChapterById(lesson.chapterId);
  return chapter?.topicId ?? null;
}

export default function CustomQuiz() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTopic = searchParams.get("topic");

  // Group eligible lessons by topic.
  const lessonsByTopic = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const id of CUSTOM_QUIZ_LESSONS) {
      const topicId = getLessonTopic(id);
      if (!topicId) continue;
      if (!map[topicId]) map[topicId] = [];
      map[topicId].push(id);
    }
    return map;
  }, []);

  const currentTopic = useMemo(
    () => topics.find((t) => t.id === activeTopic) ?? null,
    [activeTopic]
  );

  // Filtre de difficulté — significatif pour les leçons de banque figée
  // (Prob-Stat, Calcul différentiel). Les générateurs procéduraux (L*)
  // ont leur difficulté câblée et l'ignorent.
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(undefined);
  const isBankTopic = activeTopic === "probability" || activeTopic === "differential-calculus";

  // Banque calc-diff : 65 gratuits pour un visiteur, 305 pour un détenteur.
  // Passée au générateur pour que les disponibilités par leçon reflètent
  // vraiment ce que le quiz pourra piocher.
  const banqueCd = useExercicesComplets("calcul-differentiel");

  const lessonMeta = useMemo(() => {
    if (!activeTopic) return [];
    const ids = lessonsByTopic[activeTopic] ?? [];
    return ids.map((id) => {
      const lesson = getLessonById(id);
      const bank = isBankLesson(id);
      const available = getAvailableTypes(
        id,
        bank ? difficulty : undefined,
        banqueCd.exercices,
      );
      return {
        id,
        number: lesson?.number ?? 0,
        name: lesson?.name ?? id,
        available,
        isBank: bank,
      };
    });
  }, [activeTopic, lessonsByTopic, difficulty, banqueCd.exercices]);

  // Protection : si la carte du topic annonce des exercices mais qu'aucune
  // leçon exploitable n'existe côté quiz, on avertit dans la console plutôt
  // que d'afficher silencieusement un écran vide. Détecte les décalages
  // futurs entre topics.ts et CUSTOM_QUIZ_LESSONS.
  useEffect(() => {
    if (!activeTopic || !currentTopic) return;
    const annonce = currentTopic.nbExercicesPublies ?? 0;
    if (annonce > 0 && lessonMeta.length === 0) {
      console.warn(
        `[quiz personnalisé] La matière « ${currentTopic.name} » annonce ${annonce} exercices ` +
          "mais aucune leçon n'est branchée dans CUSTOM_QUIZ_LESSONS. " +
          "Vérifie src/data/lessons.ts et src/quiz/customGenerators.ts.",
      );
    }
  }, [activeTopic, currentTopic, lessonMeta.length]);

  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    for (const l of CUSTOM_QUIZ_LESSONS) init[l] = { ...ZERO };
    return init;
  });

  function update(id: string, key: keyof RowState, n: number) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [key]: n } }));
  }

  function handleTopicSelect(topicId: string) {
    searchParams.set("topic", topicId);
    setSearchParams(searchParams, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearTopic() {
    searchParams.delete("topic");
    setSearchParams(searchParams, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const specs: CustomQuizSpec[] = useMemo(
    () =>
      lessonMeta
        .map((m) => {
          const spec: CustomQuizSpec = {
            lessonId: m.id,
            exerciseCount: rows[m.id].exercise,
            mcqCount: rows[m.id].mcq,
            tfCount: rows[m.id].tf,
          };
          if (m.isBank && difficulty) spec.difficulty = difficulty;
          return spec;
        })
        .filter(
          (s) => s.exerciseCount + s.mcqCount + s.tfCount > 0
        ),
    [rows, lessonMeta, difficulty]
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

  // Garde technique : une URL /custom-quiz?topic=<enPreparation> construite
  // à la main ne doit PAS afficher la liste des leçons (qui serait vide) ni
  // permettre de composer un quiz. On retombe sur la vue picker avec un
  // bandeau d'info. Le nom du cours vient de `topics.ts`, jamais d'un
  // id en dur.
  const topicDemandeInactif =
    activeTopic !== null &&
    currentTopic !== null &&
    currentTopic.enPreparation === true;

  // Topic picker view — sans topic sélectionné, OU topic enPreparation
  // demandé via URL directe (garde ci-dessus).
  if (!activeTopic || topicDemandeInactif) {
    return (
      <div className="container-page py-12 sm:py-16">
        <AnimatedSection className="max-w-2xl">
          <h1 className="text-balance text-4xl font-bold sm:text-5xl">
            Quiz personnalisé
          </h1>
          <p className="mt-4 text-balance text-lg text-ink-600">
            Choisis d'abord une matière, puis combien d'exercices calculatoires
            (CALC), de questions à choix multiples (QCM) et de Vrai ou Faux
            (V/F) tu veux pour chaque leçon. Les questions sont{" "}
            <strong>générées aléatoirement</strong> à chaque tirage !
          </p>
        </AnimatedSection>

        {topicDemandeInactif && currentTopic && (
          <AnimatedSection delay={0.05} className="mt-6 max-w-2xl">
            <div
              role="status"
              className="rounded-2xl border border-brand-200 bg-brand-50/60 px-5 py-4 text-sm text-brand-900"
            >
              <strong>{currentTopic.name}</strong> arrive bientôt — pas encore
              de banque d'exercices sur laquelle composer un quiz. Choisis une
              autre matière ci-dessous en attendant.
            </div>
          </AnimatedSection>
        )}

        <AnimatedSection delay={0.1} className="mt-10">
          <TopicPicker onTopicSelect={handleTopicSelect} resterSurPlace />
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection>
        <button
          type="button"
          onClick={clearTopic}
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
          Changer de matière
        </button>
      </AnimatedSection>

      <AnimatedSection delay={0.05} className="mt-6 max-w-2xl">
        <h1 className="text-balance text-4xl font-bold sm:text-5xl">
          Quiz personnalisé — {currentTopic?.name ?? activeTopic}
        </h1>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Définis combien d'exercices calculatoires (CALC), de questions à choix
          multiples (QCM) et de Vrai ou Faux (V/F) tu veux pour chaque leçon.
          Pas de limite — les questions sont{" "}
          <strong>générées aléatoirement</strong> à chaque tirage !
        </p>
      </AnimatedSection>

      {lessonMeta.length === 0 ? (
        <AnimatedSection delay={0.1} className="mt-10 rounded-2xl border border-brand-100 bg-white p-8 text-center text-ink-600">
          <p>
            Aucune leçon n'est encore disponible dans cette matière pour le quiz
            personnalisé.
          </p>
        </AnimatedSection>
      ) : (
        <>
          {isBankTopic && (
            <AnimatedSection delay={0.08} className="mt-8">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-100 bg-white p-4">
                <span className="text-sm font-semibold text-brand-900">
                  Difficulté :
                </span>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filtre de difficulté">
                  {(
                    [
                      { key: undefined, label: "Toutes" },
                      { key: "Facile" as const, label: "Facile" },
                      { key: "Moyen" as const, label: "Moyen" },
                      { key: "Difficile" as const, label: "Difficile" },
                    ]
                  ).map((opt) => {
                    const selected = difficulty === opt.key;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setDifficulty(opt.key)}
                        className={clsx(
                          "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-150",
                          selected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>
          )}

          <AnimatedSection delay={0.1} className="mt-6">
            <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white">
              <div className="grid min-w-[640px] grid-cols-[1.4fr_auto_auto_auto] items-center gap-x-6 gap-y-1 border-b border-brand-100 bg-brand-50/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-brand-700">
                <span>{isBankTopic ? "Chapitre" : "Leçon"}</span>
                <span className="w-16 text-center">Calc</span>
                <span className="w-16 text-center">QCM</span>
                <span className="w-16 text-center">V/F</span>
              </div>

              <ul className="min-w-[640px]">
                {lessonMeta.map((m) => {
                  const state = rows[m.id];
                  const hasAny =
                    m.available.exercise || m.available.mcq || m.available.tf;
                  const badgeLabel = m.isBank ? "Chapitre" : "Leçon";
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
                            {badgeLabel} {m.number}
                          </span>
                          <span className="text-sm font-semibold text-brand-900">
                            {m.isBank ? m.name.replace(/^Chapitre \d+ — /, "") : m.name}
                          </span>
                        </div>
                      </div>
                      <NumInput
                        value={state.exercise}
                        onChange={(n) => update(m.id, "exercise", n)}
                        disabled={!m.available.exercise}
                        label={`Calc pour ${badgeLabel.toLowerCase()} ${m.number}`}
                      />
                      <NumInput
                        value={state.mcq}
                        onChange={(n) => update(m.id, "mcq", n)}
                        disabled={!m.available.mcq}
                        label={`QCM pour ${badgeLabel.toLowerCase()} ${m.number}`}
                      />
                      <NumInput
                        value={state.tf}
                        onChange={(n) => update(m.id, "tf", n)}
                        disabled={!m.available.tf}
                        label={`V/F pour ${badgeLabel.toLowerCase()} ${m.number}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          </AnimatedSection>
        </>
      )}

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
