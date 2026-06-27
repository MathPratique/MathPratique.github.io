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
      </div>
    </section>
  );
}
