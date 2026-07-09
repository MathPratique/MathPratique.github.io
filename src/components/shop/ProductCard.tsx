import type { Product } from "../../data/products";

type ProductStyle = {
  bg: string;
  hoverBg: string;
  ring: string;
  iconBg: string;
};

const TOPIC_STYLES: Record<Product["topicId"], ProductStyle> = {
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
  bundle: {
    bg: "bg-brand-600",
    hoverBg: "hover:bg-brand-700",
    ring: "ring-brand-200",
    iconBg: "bg-brand-500/40",
  },
};

const FILE_ICONS: Record<Product["fileType"], string> = {
  pdf: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M9 15h6M9 11h6M9 19h4",
  video: "M23 7l-7 5 7 5V7zM1 5h15v14H1z",
  bundle: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
};

const FILE_LABELS: Record<Product["fileType"], string> = {
  pdf: "PDF",
  video: "Vidéo",
  bundle: "PDF + Vidéos",
};

export default function ProductCard({ product }: { product: Product }) {
  const style = TOPIC_STYLES[product.topicId];
  const iconPath = FILE_ICONS[product.fileType];
  const isAvailable = product.stripeUrl !== "";
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl p-7 text-white shadow-lg shadow-black/5 ring-1 ring-white/10 transition-all duration-300 ${style.bg}`}
    >
      {product.badge && (
        <span className="absolute right-5 top-5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-brand-900 shadow-sm">
          {product.badge}
        </span>
      )}

      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.iconBg}`}>
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
          <path d={iconPath} />
        </svg>
      </div>

      <div className="mt-5 flex-1">
        <span className="inline-block rounded-full bg-black/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          {FILE_LABELS[product.fileType]}
        </span>
        <h3 className="mt-3 font-display text-2xl font-bold leading-tight !text-white">
          {product.name}
        </h3>
        <p className="mt-2 text-sm font-medium text-white/90">{product.tagline}</p>
        <p className="mt-4 text-sm text-white/80">{product.description}</p>

        <ul className="mt-5 space-y-2">
          {product.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/90">
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
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-white/20 pt-5">
        <div className="mb-4 flex items-baseline gap-3">
          <span className="font-display text-4xl font-bold !text-white">
            {product.price} $
          </span>
          {hasDiscount && (
            <span className="text-lg font-medium text-white/60 line-through">
              {product.originalPrice} $
            </span>
          )}
          <span className="text-sm text-white/70">CAD</span>
        </div>

        {isAvailable ? (
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
