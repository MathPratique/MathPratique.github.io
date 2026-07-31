import { Link, useSearchParams } from "react-router-dom";
import { getProductById } from "../data/products";
import AnimatedSection from "../components/ui/AnimatedSection";
import { EMAIL_CONTACT } from "../data/site";

// Doit rester cohérent avec la page produit.
const DUREE_ACCES_MOIS = 12;

// ⚠️ Cette page est un contenu d'attente. Le parcours d'achat n'existe pas
// encore : quand il sera en place, la date de fin d'accès réelle devra être
// lue depuis le compte de l'étudiant et affichée ici en clair, plutôt que
// d'énoncer la durée dans l'abstrait.

export default function AchatConfirme() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("produit");
  const product = productId ? getProductById(productId) : null;

  return (
    <div className="container-page py-16 sm:py-20">
      <AnimatedSection className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-600"
            aria-hidden="true"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-6 text-balance text-4xl font-bold sm:text-5xl">
          Merci pour ton achat !
        </h1>

        {product ? (
          <p className="mt-4 text-balance text-lg text-ink-600">
            Ton accès à <strong>{product.courseName}</strong> est ouvert pour{" "}
            {DUREE_ACCES_MOIS} mois : notes de cours, exercices, séries de
            révision et examens corrigés.
          </p>
        ) : (
          <p className="mt-4 text-balance text-lg text-ink-600">
            Ton achat est confirmé. Ton accès est ouvert pour{" "}
            {DUREE_ACCES_MOIS} mois.
          </p>
        )}

        <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50/40 p-6 text-left">
          <h2 className="font-display text-lg font-bold text-brand-900">
            Prochaines étapes
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-700">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                1
              </span>
              <span>
                Un reçu t'a été envoyé par courriel, avec la date de fin de ton
                accès. Vérifie le dossier « courriels indésirables » juste au cas.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                2
              </span>
              <span>
                Télécharge tes PDF pendant ta période d'accès. Les mises à jour
                publiées d'ici la fin sont incluses.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                3
              </span>
              <span>Commence à étudier — tu es prêt à réussir ton examen !</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/practice"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
          >
            Continuer à pratiquer
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
          <Link
            to="/boutique"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Retour à la boutique
          </Link>
        </div>

        <p className="mt-10 text-sm text-ink-600">
          Tu ne reçois rien ? Écris-nous à{" "}
          <a
            href={`mailto:${EMAIL_CONTACT}`}
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            {EMAIL_CONTACT}
          </a>
        </p>
      </AnimatedSection>
    </div>
  );
}
