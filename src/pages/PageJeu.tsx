import { useEffect, useRef, useSyncExternalStore } from "react";
import { Link, useParams } from "react-router-dom";
import AnimatedSection from "../components/ui/AnimatedSection";
import { trouverJeu } from "../data/jeux";
import type { DonneesClassement } from "../jeux/classement";
import { formaterTemps, rangTexte } from "../jeux/regles";
import { usePontJeu } from "../jeux/usePontJeu";

// Un jeu dans sa propre page : l'en-tête et le pied de page du site, le jeu
// dans un iframe de même origine (voir src/data/jeux.ts), un bouton plein
// écran, et le classement en dessous.
//
// Sur téléphone ou tablette (pas de souris), le jeu n'est pas chargé du tout :
// un message le dit, et le classement reste consultable.

const ORDINATEUR = "(hover: hover) and (pointer: fine)";
const MESSAGE_ORDINATEUR = "Ce jeu se joue à l'ordinateur, avec un clavier et une souris.";

// null pendant le pré-rendu (aucun navigateur) : on ne sait pas encore
function useOrdinateur(): boolean | null {
  return useSyncExternalStore(
    (rappel) => {
      const mq = window.matchMedia(ORDINATEUR);
      mq.addEventListener("change", rappel);
      return () => mq.removeEventListener("change", rappel);
    },
    () => window.matchMedia(ORDINATEUR).matches,
    () => null,
  );
}

const dateCourte = (ms: number | null) =>
  ms ? new Date(ms).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" }) : "";

function TableauClassement({ donnees }: { donnees: DonneesClassement }) {
  const horsTop = donnees.moi && !donnees.top.some((l) => l.moi) ? donnees.moi : null;
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-ink-600">
              <th className="px-3 py-2">Rang</th>
              <th className="px-3 py-2">Pseudonyme</th>
              <th className="px-3 py-2 text-right">Temps</th>
              <th className="hidden px-3 py-2 sm:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {donnees.top.length === 0 ? (
              <tr>
                <td colSpan={4} className="border-t border-brand-100 px-3 py-3 italic text-ink-600">
                  Aucun temps pour l'instant. Le premier temps inscrit apparaîtra ici.
                </td>
              </tr>
            ) : (
              donnees.top.map((l, k) => (
                <tr key={k} className={l.moi ? "bg-brand-50 font-semibold" : undefined}>
                  <td className="border-t border-brand-100 px-3 py-2 text-brand-700">{k + 1}</td>
                  <td className="border-t border-brand-100 px-3 py-2 [overflow-wrap:anywhere]">{l.pseudo}</td>
                  <td className="border-t border-brand-100 px-3 py-2 text-right">{formaterTemps(l.temps)}</td>
                  <td className="hidden whitespace-nowrap border-t border-brand-100 px-3 py-2 text-ink-600 sm:table-cell">{dateCourte(l.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {horsTop && horsTop.rang && (
        <p className="mt-3 text-sm text-ink-600">
          Ton meilleur temps : {formaterTemps(horsTop.temps)}, sous le pseudonyme « {horsTop.pseudo} ». Tu es{" "}
          {rangTexte(horsTop.rang)} au classement.
        </p>
      )}
    </>
  );
}

export default function PageJeu() {
  const { slug } = useParams();
  const jeu = trouverJeu(slug);
  const iframe = useRef<HTMLIFrameElement | null>(null);
  const ordinateur = useOrdinateur();
  const { donnees, erreur, disponible, connecte, chargement } = usePontJeu(iframe, jeu?.slug ?? "", !!jeu?.classement);

  useEffect(() => {
    if (!jeu) return;
    document.title = jeu.titrePage;
    document.querySelector('meta[name="description"]')?.setAttribute("content", jeu.descriptionPage);
  }, [jeu]);

  if (!jeu) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-3xl font-bold">Ce jeu n'existe pas</h1>
        <p className="mt-4 text-ink-600">
          <Link to="/jeux" className="font-semibold text-brand-700 hover:underline">
            Voir tous les jeux
          </Link>
        </p>
      </div>
    );
  }

  const pleinEcran = () => {
    const el = iframe.current;
    if (!el || !el.requestFullscreen) return;
    el.requestFullscreen()
      .then(() => el.contentWindow?.focus())
      .catch(() => {
        // Plein écran refusé par le navigateur : le jeu reste jouable dans la page.
      });
  };

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          Jeu gratuit, sans compte
        </span>
        <h1 className="mt-4 text-balance text-3xl font-bold sm:text-5xl">{jeu.titre}</h1>
        <p className="mt-4 text-balance text-base text-ink-600 sm:text-lg">{jeu.resume}</p>
      </AnimatedSection>

      <div className="mx-auto mt-10 max-w-6xl">
        {ordinateur === false ? (
          <div className="rounded-3xl border border-brand-100 bg-brand-50/60 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-brand-900">{MESSAGE_ORDINATEUR}</p>
            <p className="mt-2 text-sm text-ink-600">Le classement reste consultable plus bas.</p>
          </div>
        ) : (
          <>
            <div
              className="overflow-hidden rounded-3xl border border-brand-100 bg-[#10241a] shadow-sm shadow-brand-900/5"
              style={{ height: "min(calc(100vh - 8rem), 760px)", minHeight: 480 }}
            >
              {ordinateur ? (
                <iframe
                  ref={iframe}
                  src={jeu.fichier}
                  title={jeu.titre}
                  className="block h-full w-full border-0"
                  allow="fullscreen; autoplay"
                />
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-white/80">Chargement du jeu…</p>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-600">
                Clique dans le jeu pour commencer. <span className="whitespace-nowrap">Échap : pause</span> (et sortie du plein écran).
              </p>
              <button
                type="button"
                onClick={pleinEcran}
                disabled={!ordinateur}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-700 disabled:cursor-default disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                </svg>
                Plein écran
              </button>
            </div>
          </>
        )}
      </div>

      {jeu.classement && (
        <section className="mx-auto mt-12 max-w-3xl rounded-3xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-900/5 sm:p-8" aria-labelledby="titre-classement">
          <h2 id="titre-classement" className="text-xl font-bold sm:text-2xl">
            Classement : les 10 meilleurs temps
          </h2>
          <p className="mt-1 text-sm text-ink-600">Temps total, pénalités comprises. Un seul temps par joueur : son meilleur.</p>
          <div className="mt-5">
            {donnees ? (
              <TableauClassement donnees={donnees} />
            ) : (
              <p className="text-sm text-ink-600">
                {erreur || (!chargement && !disponible) ? "Le classement n'est pas disponible pour le moment." : "Chargement du classement…"}
              </p>
            )}
          </div>
          {!chargement && disponible && !connecte && (
            <p className="mt-4 text-sm text-ink-600">
              Pour inscrire tes temps, <Link to="/connexion" state={{ retour: `/jeux/${jeu.slug}` }} className="font-semibold text-brand-700 hover:underline">connecte-toi avec ton compte MathPratique</Link>.
              Tu choisis un pseudonyme : pas besoin d'utiliser ton vrai nom.
            </p>
          )}
        </section>
      )}

      <p className="mx-auto mt-10 max-w-3xl text-center text-sm">
        <Link to="/jeux" className="font-semibold text-brand-700 hover:underline">
          ← Tous les jeux
        </Link>
      </p>
    </div>
  );
}
