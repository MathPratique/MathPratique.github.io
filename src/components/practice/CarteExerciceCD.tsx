// Une carte d'exercice de la vitrine, avec son dévoilement en trois paliers.
//
// Chaque palier révèle UNIQUEMENT son contenu : voir l'indice ne montre pas
// la réponse, voir la réponse ne montre pas la démarche. C'est la même
// progression que dans les recueils imprimés, et elle a une raison d'être —
// un étudiant qui saute directement à la solution n'apprend rien.
//
// Les paliers sont des `<details>` natifs plutôt que des boutons pilotés par
// un état React. Trois raisons, dans l'ordre d'importance :
//
//   1. **Le contenu est dans le HTML, même replié.** C'est ce qui rend la
//      page indexable : un moteur de recherche voit les démarches détaillées,
//      qui sont précisément ce qui distingue ce matériel de ce qu'on trouve
//      partout ailleurs. Avec un `useState`, elles n'existeraient nulle part
//      avant un clic.
//   2. **Ça fonctionne sans JavaScript.** Le navigateur gère l'ouverture.
//   3. L'accessibilité est native : rôle, clavier et annonce vocale sont
//      corrects sans qu'on ait à câbler `aria-expanded` à la main.

import Mathematiques from "./Mathematiques";
import QcmInteractif from "./QcmInteractif";
import BoutonsProgression from "../../progression/BoutonsProgression";
import {
  etape,
  LIB_DIFFICULTE,
  LIB_TYPE,
  resoudreFigureUrl,
  type Exercice,
  type Palier,
} from "../../data/calcul-differentiel";

const COULEUR_DIFFICULTE: Record<string, string> = {
  facile: "bg-accent-500/15 text-accent-600",
  moyen: "bg-brand-100 text-brand-700",
  difficile: "bg-amber-500/15 text-amber-700",
};

const PALIERS: { palier: Palier; bouton: string }[] = [
  { palier: "indice", bouton: "Voir un indice" },
  { palier: "reponse", bouton: "Voir la réponse finale" },
  { palier: "demarche", bouton: "Voir la démarche complète" },
];

export default function CarteExerciceCD({
  exercice,
  numero,
}: {
  exercice: Exercice;
  numero: number;
}) {
  const enonce = etape(exercice, "enonce");

  return (
    <article
      id={exercice.id}
      className="scroll-mt-28 rounded-2xl border border-brand-100 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-display text-base font-bold text-brand-900">{numero}.</span>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
          {LIB_TYPE[exercice.type]}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 font-semibold ${
            COULEUR_DIFFICULTE[exercice.difficulte]
          }`}
        >
          {LIB_DIFFICULTE[exercice.difficulte]}
        </span>
        <span className="text-ink-600">§{exercice.section}</span>
        <span className="ml-auto">
          <BoutonsProgression id={exercice.id} />
        </span>
      </div>

      {exercice.sectionNotes && (
        <p className="mt-2 text-xs italic text-ink-600">{exercice.sectionNotes}</p>
      )}

      {enonce && "texte" in enonce && (
        <div className="mt-3 text-[15px] leading-relaxed text-ink-900">
          <Mathematiques source={enonce.texte} html />
        </div>
      )}

      {enonce && enonce.etape === "enonce" && enonce.figure && (() => {
        const url = resoudreFigureUrl(enonce.figure);
        // Silencieux si le SVG manque : l'énoncé mentionne peut-être une
        // figure sans qu'elle soit publiée (exo réservé au package).
        // Éviter d'afficher une image cassée est mieux qu'un placeholder.
        return url ? (
          <figure className="mt-4">
            <img
              src={url}
              alt={`Figure pour l'exercice ${exercice.id}`}
              className="mx-auto block max-w-full"
              loading="lazy"
            />
          </figure>
        ) : null;
      })()}

      {/* QCM interactif — les vrai/faux ont `choix: null` volontairement
          et ne sont donc pas concernés (voir la note dans les JSON). */}
      {exercice.type === "qcm" &&
        enonce &&
        enonce.etape === "enonce" &&
        enonce.choix &&
        enonce.choix.length > 0 && (
          <QcmInteractif
            choix={enonce.choix}
            analyseChoix={
              (() => {
                const d = etape(exercice, "demarche");
                return d && d.etape === "demarche" ? d.analyseChoix : undefined;
              })()
            }
          />
        )}

      <div className="mt-4 space-y-2">
        {PALIERS.map(({ palier, bouton }) => {
          const contenu = etape(exercice, palier);
          if (!contenu) return null;
          return (
            <details key={palier} className="group">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-brand-200 px-4 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 group-open:bg-brand-600 group-open:text-white [&::-webkit-details-marker]:hidden">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="transition-transform group-open:rotate-90"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
                {bouton}
              </summary>
              <div className="mt-2 rounded-xl bg-brand-50/60 p-4">
                <h4 className="font-display text-sm font-bold text-brand-900">
                  {contenu.titre}
                </h4>
                {"texte" in contenu ? (
                  <div className="mt-2 text-[15px] leading-relaxed text-ink-700">
                    <Mathematiques source={contenu.texte} html />
                  </div>
                ) : (
                  <>
                    <ol className="mt-2 space-y-3 text-[15px] leading-relaxed text-ink-700">
                      {contenu.lignes.map((ligne, i) => (
                        <li key={i}>
                          <Mathematiques source={ligne} html />
                        </li>
                      ))}
                    </ol>
                    {contenu.piegeCourant && (
                      <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        <span className="font-semibold">Piège fréquent — </span>
                        <Mathematiques source={contenu.piegeCourant} html />
                      </div>
                    )}
                  </>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </article>
  );
}
