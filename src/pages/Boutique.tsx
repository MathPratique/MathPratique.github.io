import { Link } from "react-router-dom";
import { getActiveProducts } from "../data/products";
import AnimatedSection from "../components/ui/AnimatedSection";
import ProductCard from "../components/shop/ProductCard";

export default function Boutique() {
  const activeProducts = getActiveProducts();
  const hasProducts = activeProducts.length > 0;

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          Boutique
        </span>
        <h1 className="mt-4 text-balance text-4xl font-bold sm:text-5xl">
          Prépare tes examens sans stress
        </h1>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Notes de cours complètes, intras et finaux corrigés — préparés par un
          enseignant du cégep. Aucun abonnement, un seul paiement, accès à vie.
        </p>
      </AnimatedSection>

      {hasProducts ? (
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {activeProducts.map((product, i) => (
            <AnimatedSection key={product.id} delay={i * 0.06}>
              <ProductCard product={product} />
            </AnimatedSection>
          ))}
        </div>
      ) : (
        <AnimatedSection delay={0.1} className="mt-14">
          <div className="mx-auto max-w-2xl rounded-3xl border border-brand-100 bg-brand-50/40 p-10 text-center sm:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
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
                <path d="M12 8v4l3 3M12 22a10 10 0 100-20 10 10 0 000 20z" />
              </svg>
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              La boutique arrive bientôt
            </h2>
            <p className="mt-3 text-balance text-base text-ink-600">
              Les premiers packages (notes de cours + intras et finaux corrigés)
              seront disponibles très bientôt. En attendant, tu peux commencer à
              t'entraîner gratuitement avec les exercices.
            </p>
            <Link
              to="/practice"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
            >
              Voir les exercices
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
            </Link>
          </div>
        </AnimatedSection>
      )}

      {hasProducts && (
        <AnimatedSection delay={0.3} className="mt-16 rounded-3xl border border-brand-100 bg-brand-50/40 p-8 sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
              Comment ça fonctionne ?
            </h2>
            <div className="mt-8 grid gap-6 text-left sm:grid-cols-3">
              <Step
                number="1"
                title="Achète en ligne"
                text="Paiement sécurisé par carte via Stripe. Aucune inscription requise."
              />
              <Step
                number="2"
                title="Reçois par email"
                text="Les PDF (notes + intras + finaux corrigés) arrivent dans ta boîte email tout de suite après le paiement."
              />
              <Step
                number="3"
                title="Accès à vie"
                text="Télécharge autant de fois que tu veux et profite des mises à jour gratuites."
              />
            </div>
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection delay={0.35} className="mt-10 text-center text-sm text-ink-600">
        <p>
          Une question ? Écris-moi à{" "}
          <a
            href="mailto:simonboileauenseignement@gmail.com"
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            simonboileauenseignement@gmail.com
          </a>
        </p>
      </AnimatedSection>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-display text-lg font-bold text-white">
        {number}
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-brand-900">{title}</h3>
      <p className="mt-1 text-sm text-ink-600">{text}</p>
    </div>
  );
}
