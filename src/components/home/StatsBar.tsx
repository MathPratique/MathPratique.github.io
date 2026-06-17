import { stats } from "../../data/stats";
import AnimatedSection from "../ui/AnimatedSection";

export default function StatsBar() {
  return (
    <section className="border-y border-brand-100 bg-brand-50/40">
      <div className="container-page py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <AnimatedSection key={stat.id} delay={i * 0.08} className="text-center sm:text-left">
              <p className="font-display text-3xl font-bold text-brand-700 sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-ink-600">{stat.label}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
