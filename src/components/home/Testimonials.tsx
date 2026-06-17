import { testimonials } from "../../data/testimonials";
import AnimatedSection from "../ui/AnimatedSection";

export default function Testimonials() {
  return (
    <section className="bg-brand-50/40 py-20 sm:py-24">
      <div className="container-page">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold sm:text-4xl">
            Approuvé par les étudiants qui préfèrent comprendre plutôt qu'apprendre par cœur
          </h2>
        </AnimatedSection>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {testimonials.map((testimonial, i) => (
            <AnimatedSection
              key={testimonial.id}
              delay={i * 0.08}
              className="flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-6 shadow-sm shadow-brand-900/5"
            >
              <svg
                width="28"
                height="22"
                viewBox="0 0 28 22"
                fill="none"
                aria-hidden="true"
                className="text-brand-200"
              >
                <path
                  d="M0 22V13.2C0 5.6 4.6 0.8 11.6 0L13.2 3.4C8.8 4.6 6.4 7.6 6.2 11.4H11.6V22H0ZM16.4 22V13.2C16.4 5.6 21 0.8 28 0L29.6 3.4C25.2 4.6 22.8 7.6 22.6 11.4H28V22H16.4Z"
                  fill="currentColor"
                />
              </svg>
              <p className="mt-4 flex-1 text-balance text-base leading-relaxed text-ink-700">
                {testimonial.quote}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-900">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-ink-600">{testimonial.role}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
