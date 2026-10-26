import { useEffect, type ReactNode } from "react";
import { COPYRIGHT } from "../../data/site";

// Gabarit des pages légales en BROUILLON (2026-10-26).
//
// Tant qu'un texte n'est pas révisé :
//   - un bandeau bien visible dit qu'il n'est pas en vigueur ;
//   - la page porte `noindex` (posé au montage, retiré au démontage pour ne
//     pas contaminer les autres pages de l'application) ;
//   - elle n'est ni pré-rendue ni dans le plan du site (scripts/prerendre.mjs),
//     et aucun lien du pied de page n'y mène encore.
//
// Les points à faire réviser sont notés en commentaires dans chaque page,
// jamais dans le texte affiché.
//
// À la validation d'une page : retirer le bandeau et le `noindex` (prop
// `brouillon={false}`), l'ajouter au pré-rendu, puis au pied de page.

const DATE_BROUILLON = "26 octobre 2026";

export default function PageBrouillon({
  titre,
  description,
  brouillon = true,
  children,
}: {
  titre: string;
  description: string;
  brouillon?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    // Titre et description sont rendus en quittant la page : l'accueil et la
    // boutique ne fixent pas les leurs, et garderaient sinon « (brouillon) »
    // dans l'onglet après une navigation interne.
    const meta = document.querySelector('meta[name="description"]');
    const titreAvant = document.title;
    const descriptionAvant = meta?.getAttribute("content") ?? null;
    document.title = `${titre}${brouillon ? " (brouillon)" : ""} | MathPratique`;
    meta?.setAttribute("content", description);

    let robots: HTMLMetaElement | null = null;
    let cree = false;
    let robotsAvant: string | null = null;
    if (brouillon) {
      robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      cree = robots === null;
      robotsAvant = robots?.getAttribute("content") ?? null;
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
    }

    return () => {
      document.title = titreAvant;
      if (descriptionAvant !== null) meta?.setAttribute("content", descriptionAvant);
      if (cree) robots?.remove();
      else if (robotsAvant !== null) robots?.setAttribute("content", robotsAvant);
    };
  }, [titre, description, brouillon]);

  return (
    <div className="container-page py-12 sm:py-16">
      <article className="mx-auto max-w-3xl">
        {brouillon && (
          <div role="note" className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-amber-900">
            <p className="font-display text-base font-bold uppercase tracking-wide">
              Brouillon — en attente de révision
            </p>
            <p className="mt-1 text-sm">
              Ce texte n'est pas encore en vigueur : il doit être révisé avant sa
              publication officielle. Version du {DATE_BROUILLON}.
            </p>
          </div>
        )}
        <h1 className="mt-8 text-balance text-3xl font-bold sm:text-4xl">{titre}</h1>
        <div className="mt-8 space-y-8 text-ink-700">{children}</div>
        <p className="mt-12 border-t border-brand-100 pt-6 text-xs text-ink-600">{COPYRIGHT}</p>
      </article>
    </div>
  );
}

/** Une section titrée d'une page légale. */
export function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold sm:text-2xl">{titre}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed sm:text-base">{children}</div>
    </section>
  );
}

/** Liste à puces d'une page légale. */
export function Liste({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}
