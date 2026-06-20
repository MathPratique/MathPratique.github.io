import AnimatedSection from "../ui/AnimatedSection";

const features = [
  {
    title: "Raisonnement étape par étape",
    description:
      "Chaque solution se déroule une étape logique à la fois, pour que vous puissiez vous arrêter exactement où votre compréhension bloque.",
    icon: "M9 5l7 7-7 7",
  },
  {
    title: "Aucun compte, aucune friction",
    description:
      "Ouvrez un problème et commencez à travailler. Rien à créer, rien à configurer — juste vous et les maths.",
    icon: "M5 13l4 4L19 7",
  },
  {
    title: "Niveau collégial et universitaire",
    description:
      "Les problèmes sont rédigés pour les étudiants qui ont dépassé les bases et veulent du contenu à la hauteur de leur niveau.",
    icon: "M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4",
  },
  {
    title: "Conçu pour tous les appareils",
    description:
      "Du portable entre deux cours au téléphone dans le métro — la mise en page et les animations s'adaptent sans perdre en clarté.",
    icon: "M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2",
  },
];

export default function Features() {
  return (
    <section className="container-page py-20 sm:py-24">
      <AnimatedSection className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold sm:text-4xl">
          Conçu autour de la manière dont les étudiants apprennent vraiment
        </h2>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Moins de devinettes, plus de raisonnement. MathPratique est pensé pour
          que chaque session ressemble à un échange avec un tuteur patient.
        </p>
      </AnimatedSection>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, i) => (
          <AnimatedSection
            key={feature.title}
            delay={i * 0.1}
            className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-sm shadow-brand-900/5 transition-shadow duration-200 hover:shadow-md hover:shadow-brand-900/10"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-200 group-hover:bg-brand-100">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d={feature.icon}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-brand-900">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {feature.description}
            </p>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
