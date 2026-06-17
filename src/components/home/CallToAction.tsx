import { Link } from "react-router-dom";
import AnimatedSection from "../ui/AnimatedSection";

export default function CallToAction() {
  return (
    <section className="container-page py-20 sm:py-24">
      <AnimatedSection
        as="section"
        className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-16 text-center sm:px-12 sm:py-20"
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <h2 className="text-balance text-3xl font-bold text-white sm:text-4xl">
            Votre prochaine série d'exercices est à un clic
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-brand-100">
            Pas d'inscription, pas de paywall — ouvrez une matière et
            avancez sur les problèmes avec le raisonnement complet à chaque étape.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/practice"
              className="cursor-pointer rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-700 shadow-lg shadow-black/10 transition-colors duration-200 hover:bg-brand-50"
            >
              Aller aux exercices
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
