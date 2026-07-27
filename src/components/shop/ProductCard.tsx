import type { CourseTopicId, Product } from "../../data/products";

// Une couleur par cours pour la carte — même palette que les topics.
const TOPIC_STYLES: Record<CourseTopicId, { bg: string; iconBg: string; ring: string }> = {
  "differential-calculus": {
    bg: "bg-indigo-500",
    iconBg: "bg-indigo-400/40",
    ring: "ring-indigo-200",
  },
  "integral-calculus": {
    bg: "bg-emerald-500",
    iconBg: "bg-emerald-400/40",
    ring: "ring-emerald-200",
  },
  "linear-algebra": {
    bg: "bg-fuchsia-500",
    iconBg: "bg-fuchsia-400/40",
    ring: "ring-fuchsia-200",
  },
  probability: {
    bg: "bg-amber-500",
    iconBg: "bg-amber-400/40",
    ring: "ring-amber-200",
  },
};

// Contenu identique pour tous les packages (voir products.ts).
const PACKAGE_CONTENT: string[] = [
  "Notes de cours complètes (PDF)",
  "Accès à vie au contenu du site + mises à jour gratuites",
  "3 intras corrigés (PDF)",
  "3 examens finaux corrigés (PDF)",
];

export default function ProductCard({ product }: { product: Product }) {
  const style = TOPIC_STYLES[product.topicId];
  const canBuy = product.active && product.stripeUrl !== "";

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl p-7 text-white shadow-lg shadow-black/5 ring-1 ring-white/10 transition-all duration-300 ${style.bg}`}
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.iconBg}`}>
        {/* Icône livre ouvert */}
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
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
      </div>

      <div className="mt-5 flex-1">
        <span className="inline-block rounded-full bg-black/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          Package complet
        </span>
        <h3 className="mt-3 font-display text-2xl font-bold leading-tight !text-white">
          {product.courseName}
        </h3>
        <p className="mt-2 text-sm font-medium text-white/90">{product.tagline}</p>
        <p className="mt-4 text-sm text-white/80">{product.description}</p>

        <ul className="mt-5 space-y-2">
          {PACKAGE_CONTENT.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-white/95">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="mt-0.5 flex-shrink-0"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-white/20 pt-5">
        <div className="mb-4 flex items-baseline gap-3">
          <span className="font-display text-4xl font-bold !text-white">
            {product.price} $
          </span>
          <span className="text-sm text-white/70">{product.currency}</span>
        </div>

        {canBuy ? (
          <a
            href={product.stripeUrl}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-900 shadow-sm transition-transform duration-200 hover:scale-[1.02] ${style.ring}`}
          >
            Acheter maintenant
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
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-white/20 px-6 py-3 text-sm font-semibold text-white/80"
          >
            Bientôt disponible
          </button>
        )}
      </div>
    </div>
  );
}
