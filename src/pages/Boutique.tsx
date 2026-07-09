import { products } from "../data/products";
import AnimatedSection from "../components/ui/AnimatedSection";
import ProductCard from "../components/shop/ProductCard";

export default function Boutique() {
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
          Formulaires officiels, problèmes types corrigés et vidéos de solutions —
          tout ce dont tu as besoin pour réussir tes intras et finaux, préparé par
          un enseignant du cégep.
        </p>
      </AnimatedSection>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {products.map((product, i) => (
          <AnimatedSection key={product.id} delay={i * 0.06}>
            <ProductCard product={product} />
          </AnimatedSection>
        ))}
      </div>

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
              text="Le lien de téléchargement arrive dans ta boîte email immédiatement après le paiement."
            />
            <Step
              number="3"
              title="Accès à vie"
              text="Télécharge autant de fois que tu veux et profite des mises à jour gratuites."
            />
          </div>
        </div>
      </AnimatedSection>

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
