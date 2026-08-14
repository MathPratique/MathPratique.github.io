import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import RichContent from "../ui/RichContent";

// Exemple animé de la page d'accueil. Contenu, pas donnée d'exercice — il
// vit ici directement plutôt que d'occuper une entrée dans `exercises.ts`.
// Vestige récupéré tel quel de l'ancien `id: "calc-chain-rule"` ; si tu
// changes cet exemple, garde le badge « Calcul différentiel · Moyen »
// aligné avec la matière et la difficulté du nouvel exo.
const EXEMPLE_ANIME = {
  title: "Dériver avec la règle de la chaîne",
  prompt: "Trouver f′(x) pour f(x) = (3x² + 1)⁵",
  steps: [
    "Reconnaître la composition : fonction extérieure u⁵, fonction intérieure u = 3x² + 1.",
    "Dériver la fonction extérieure par rapport à u : d/du [u⁵] = 5u⁴.",
    "Dériver la fonction intérieure par rapport à x : du/dx = 6x.",
    "Appliquer la règle de la chaîne : f′(x) = 5u⁴ · (du/dx) = 5(3x² + 1)⁴ · 6x.",
    "Simplifier en combinant les constantes : f′(x) = 30x(3x² + 1)⁴.",
  ],
  answer: "f′(x) = 30x(3x² + 1)⁴",
};

const symbols = [
  { glyph: "∫", className: "left-[6%] top-[18%] text-4xl text-brand-200 animate-float-slow" },
  { glyph: "π", className: "right-[10%] top-[12%] text-5xl text-accent-300 animate-float", style: { animationDelay: "0.8s" } },
  { glyph: "Σ", className: "left-[14%] bottom-[16%] text-5xl text-brand-200 animate-float", style: { animationDelay: "1.4s" } },
  { glyph: "√", className: "right-[18%] bottom-[10%] text-4xl text-accent-300 animate-float-slow", style: { animationDelay: "0.4s" } },
  { glyph: "∞", className: "left-[42%] top-[6%] text-3xl text-brand-200 animate-float", style: { animationDelay: "1.1s" } },
];

function LiveWorkedExample() {
  const exercise = EXEMPLE_ANIME;
  const shouldReduceMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % (exercise.steps.length + 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [shouldReduceMotion, exercise.steps.length]);

  const visibleSteps = shouldReduceMotion
    ? exercise.steps
    : exercise.steps.slice(0, stepIndex);

  return (
    <div className="relative rounded-2xl border border-brand-100 bg-white p-6 shadow-xl shadow-brand-900/10 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Calcul différentiel · Moyen
        </span>
        <span className="font-mono text-xs text-ink-600">mathpratique.exemple</span>
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-brand-900">
        {exercise.title}
      </h3>
      <p className="mt-1 font-mono text-sm text-ink-700">
        <RichContent content={exercise.prompt} />
      </p>

      <div className="mt-5 space-y-2.5 border-t border-brand-100 pt-4">
        <AnimatePresence initial={false}>
          {visibleSteps.map((step, i) => (
            <motion.div
              key={i}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex gap-3 text-sm text-ink-600"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
                {i + 1}
              </span>
              <span>
                <RichContent content={step} />
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!shouldReduceMotion && visibleSteps.length === 0 && (
          <p className="text-sm italic text-ink-600/70">Regarde les étapes se dévoiler…</p>
        )}
      </div>

      <AnimatePresence>
        {visibleSteps.length === exercise.steps.length && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-4 rounded-xl bg-accent-500/10 px-4 py-3 text-sm font-semibold text-accent-600"
          >
            Réponse : <RichContent content={exercise.answer} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-page relative py-16 sm:py-24 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 hidden select-none lg:block"
          aria-hidden="true"
        >
          {symbols.map((s) => (
            <span
              key={s.glyph}
              className={`absolute font-display font-semibold ${s.className}`}
              style={{ ...s.style, ["--float-rotate" as string]: "-6deg" }}
            >
              {s.glyph}
            </span>
          ))}
        </div>

        <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            {/* Pastille chiffrée retirée : le total agrégé additionnait
                des cours sans portion payante avec un cours qui en a une,
                et le mot « gratuits » devenait ambigu dès qu'un package
                existe. Les cartes de matière (TopicsShowcase plus bas)
                portent maintenant le détail par cours. Le titre commence
                donc directement — vérifier au visuel que l'espace au-dessus
                (`container-page py-16 sm:py-24 lg:py-28`) reste correct. */}
            <h1 className="text-balance text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
              Des maths qui construisent une{" "}
              <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                vraie compréhension
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-balance text-lg text-ink-600">
              Chaque problème de MathPratique est accompagné d'un raisonnement
              complet — pas seulement la réponse, mais le pourquoi de
              chaque étape. Conçu pour les étudiants qui veulent vraiment
              comprendre les maths, pas seulement survivre à l'examen.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/practice"
                className="cursor-pointer rounded-full bg-brand-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-colors duration-200 hover:bg-brand-700"
              >
                Choisir une matière
              </Link>
            </div>
          </div>

          <div className="relative">
            <LiveWorkedExample />
          </div>
        </div>
      </div>
    </section>
  );
}
