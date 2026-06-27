import { Link } from "react-router-dom";
import { topics } from "../../data/topics";
import { exercises } from "../../data/exercises";
import AnimatedSection from "../ui/AnimatedSection";

type TopicStyle = {
  bg: string;
  hoverBg: string;
  ring: string;
  iconBg: string;
};

const TOPIC_STYLES: Record<string, TopicStyle> = {
  "differential-calculus": {
    bg: "bg-indigo-500",
    hoverBg: "hover:bg-indigo-600",
    ring: "ring-indigo-200",
    iconBg: "bg-indigo-400/40",
  },
  "integral-calculus": {
    bg: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-600",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-400/40",
  },
  "linear-algebra": {
    bg: "bg-fuchsia-500",
    hoverBg: "hover:bg-fuchsia-600",
    ring: "ring-fuchsia-200",
    iconBg: "bg-fuchsia-400/40",
  },
  probability: {
    bg: "bg-amber-500",
    hoverBg: "hover:bg-amber-600",
    ring: "ring-amber-200",
    iconBg: "bg-amber-400/40",
  },
};

export default function TopicsShowcase() {
  return (
    <section id="topics" className="container-page scroll-mt-28 py-20 sm:py-24">
      <AnimatedSection className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold sm:text-4xl">
          Choisissez une matière et avancez à votre rythme
        </h2>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Quatre matières clés du parcours universitaire, chaque problème
          accompagné de sa solution complète prête à être consultée.
        </p>
      </AnimatedSection>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {topics.map((topic, i) => {
          const count = exercises.filter((e) => e.topicId === topic.id).length;
          const style = TOPIC_STYLES[topic.id];
          return (
            <AnimatedSection key={topic.id} delay={i * 0.08}>
              <Link
                to={`/practice?topic=${topic.id}`}
                className={`group relative flex h-full w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-3xl p-7 text-white shadow-lg shadow-black/5 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-4 sm:p-8 ${style.bg} ${style.hoverBg} ${style.ring}`}
                aria-label={`Pratiquer la matière ${topic.name}`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.iconBg}`}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={topic.icon} />
                  </svg>
                </div>

                <div className="flex-1">
                  <h3 className="font-display text-2xl font-bold leading-tight !text-white sm:text-3xl">
                    {topic.name}
                  </h3>
                  <p className="mt-3 text-base text-white/90">
                    {topic.description}
                  </p>
                </div>

                <div className="mt-2 flex w-full items-center justify-between">
                  <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    {count} exercice{count > 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-1">
                    Commencer
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            </AnimatedSection>
          );
        })}
      </div>
    </section>
  );
}
