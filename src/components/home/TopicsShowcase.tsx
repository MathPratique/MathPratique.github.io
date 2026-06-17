import { Link } from "react-router-dom";
import { topics } from "../../data/topics";
import { exercises } from "../../data/exercises";
import AnimatedSection from "../ui/AnimatedSection";

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

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic, i) => {
          const count = exercises.filter((e) => e.topicId === topic.id).length;
          return (
          <AnimatedSection key={topic.id} delay={i * 0.06}>
            <Link
              to={`/practice?topic=${topic.id}`}
              className="group flex h-full cursor-pointer flex-col rounded-2xl border border-brand-100 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-200 group-hover:bg-brand-600 group-hover:text-white">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d={topic.icon}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
                <span className="font-mono text-xs text-ink-600">
                  {count} exercice{count > 1 ? "s" : ""}
                </span>
              </div>

              <h3 className="mt-5 font-display text-xl font-semibold text-brand-900">
                {topic.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {topic.description}
              </p>

              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                Pratiquer {topic.name.toLowerCase()}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </span>
            </Link>
          </AnimatedSection>
          );
        })}
      </div>
    </section>
  );
}
