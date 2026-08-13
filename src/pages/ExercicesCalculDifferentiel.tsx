// La vitrine gratuite de Calcul différentiel.
//
// 65 exercices sur 305, groupés par chapitre, avec leurs indices, leurs
// réponses et leurs démarches détaillées. Ce qui reste est compté à partir
// des fiches signalétiques — jamais à partir du contenu, qui n'est pas dans
// les fichiers servis.

import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AnimatedSection from "../components/ui/AnimatedSection";
import CarteExerciceCD from "../components/practice/CarteExerciceCD";
import FiltreProgressionBarre from "../progression/FiltreProgression";
import { useProgression } from "../progression/ProgressionContext";
import {
  compteAvecPrefixe,
  filtrerIds,
  type FiltreProgression,
} from "../progression/regles";
import {
  CHAPITRES,
  LIB_DIFFICULTE,
  LIB_TYPE,
  TOTAL_BANQUE,
  TOTAL_GRATUITS,
  type Difficulte,
  type TypeExercice,
} from "../data/calcul-differentiel";

const TITRE_PAGE = "Exercices de calcul différentiel corrigés — MathPratique";
const DESCRIPTION_PAGE =
  `${TOTAL_GRATUITS} exercices de calcul différentiel corrigés et gratuits : limites, ` +
  "formes indéterminées, dérivation en chaîne, taux liés, optimisation. " +
  "Chaque exercice avec son indice, sa réponse finale et sa démarche détaillée.";

const TYPES: TypeExercice[] = ["qcm", "vrai-faux", "calcul-court", "calcul-long"];
const DIFFICULTES: Difficulte[] = ["facile", "moyen", "difficile"];

export default function ExercicesCalculDifferentiel() {
  const [params, setParams] = useSearchParams();
  const chapitreActif = params.get("chapitre");
  const typeActif = params.get("type") as TypeExercice | null;
  const difficulteActive = params.get("difficulte") as Difficulte | null;

  // Filtre de progression : local, non persisté dans l'URL. Les URLs
  // partageables restent stables et ne portent pas un état personnel.
  const [filtreProg, setFiltreProg] = useState<FiltreProgression>("tous");
  const { progression } = useProgression();

  useEffect(() => {
    document.title = TITRE_PAGE;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", DESCRIPTION_PAGE);
  }, []);

  const groupes = useMemo(
    () =>
      CHAPITRES.filter((c) => !chapitreActif || String(c.numero) === chapitreActif).map((c) => {
        // On filtre en deux temps : d'abord type + difficulté (critères
        // publics), puis progression (critère personnel). L'ordre importe
        // peu sauf pour le compteur : celui-ci porte sur les exercices
        // AVEC les filtres publics, mais SANS le filtre progression, pour
        // afficher « X / Y complétés » où Y = ce que voit ce visiteur.
        const filtresPublics = c.exercices.filter(
          (e) =>
            (!typeActif || e.type === typeActif) &&
            (!difficulteActive || e.difficulte === difficulteActive),
        );
        const idsAffichables = new Set(
          filtrerIds(progression, filtresPublics.map((e) => e.id), filtreProg),
        );
        return {
          ...c,
          filtresPublics,
          visibles: filtresPublics.filter((e) => idsAffichables.has(e.id)),
        };
      }),
    [chapitreActif, typeActif, difficulteActive, filtreProg, progression],
  );

  const nbVisibles = groupes.reduce((n, g) => n + g.visibles.length, 0);
  const filtre = (cle: string, valeur: string | null) => {
    const p = new URLSearchParams(params);
    if (valeur === null) p.delete(cle);
    else p.set(cle, valeur);
    setParams(p, { replace: true });
  };

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          Exercices
        </span>
        <h1 className="mt-4 text-balance text-4xl font-bold sm:text-5xl">
          Calcul différentiel
        </h1>
        <p className="mt-4 text-balance text-lg text-ink-600">
          {TOTAL_GRATUITS} exercices corrigés, gratuits et sans inscription. Chacun
          avec son indice, sa réponse finale et sa démarche détaillée — cherche
          d'abord, dévoile ensuite.
        </p>
      </AnimatedSection>

      {/* ---------- Filtres ---------- */}
      <AnimatedSection delay={0.1} className="mt-10">
        <div className="mx-auto max-w-4xl space-y-3">
          <Filtre
            libelle="Chapitre"
            valeurs={CHAPITRES.map((c) => ({ cle: String(c.numero), libelle: `${c.numero}. ${c.titre}` }))}
            actif={chapitreActif}
            surChoix={(v) => filtre("chapitre", v)}
          />
          <Filtre
            libelle="Type"
            valeurs={TYPES.map((t) => ({ cle: t, libelle: LIB_TYPE[t] }))}
            actif={typeActif}
            surChoix={(v) => filtre("type", v)}
          />
          <Filtre
            libelle="Difficulté"
            valeurs={DIFFICULTES.map((d) => ({ cle: d, libelle: LIB_DIFFICULTE[d] }))}
            actif={difficulteActive}
            surChoix={(v) => filtre("difficulte", v)}
          />
          {/* Filtre progression — n'apparaît que pour les détenteurs d'un
              accès valide. Rendu conditionnel géré dans le composant. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-full text-xs font-semibold uppercase tracking-wide text-ink-600 sm:w-20">
              Progression
            </span>
            <FiltreProgressionBarre valeur={filtreProg} onChange={setFiltreProg} />
          </div>
        </div>
        {nbVisibles === 0 && (
          <p className="mt-8 text-center text-sm text-ink-600">
            Aucun exercice gratuit ne correspond à cette combinaison. Élargis un
            filtre pour en voir d'autres.
          </p>
        )}
      </AnimatedSection>

      {/* ---------- Les chapitres ---------- */}
      {groupes.map((g, i) =>
        g.visibles.length === 0 ? null : (
          <AnimatedSection key={g.numero} delay={0.05 * Math.min(i, 4)} className="mt-14">
            <header className="mx-auto max-w-4xl">
              <h2
                id={`chapitre-${g.numero}`}
                className="scroll-mt-28 font-display text-2xl font-bold text-brand-900 sm:text-3xl"
              >
                {g.numero}. {g.intitule}
              </h2>
              <p className="mt-1 text-sm text-ink-600">
                {g.visibles.length} exercice{g.visibles.length > 1 ? "s" : ""} ici
                {g.visibles.length !== g.exercices.length &&
                  ` sur ${g.exercices.length} gratuits dans ce chapitre`}
                .
              </p>
              <CompteurChapitre chapitre={g.numero} nbTotal={g.filtresPublics.length} />
            </header>

            <div className="mx-auto mt-5 max-w-4xl space-y-4">
              {g.visibles.map((e, n) => (
                <CarteExerciceCD key={e.id} exercice={e} numero={n + 1} />
              ))}
            </div>

            {/* Une seule mention du package par chapitre, discrète et sans
                bouton : les chiffres viennent des fiches signalétiques, jamais
                du contenu des exercices payants. */}
            {g.autres > 0 && (
              <p className="mx-auto mt-4 max-w-4xl text-sm text-ink-600">
                {g.exercices.length} exercices disponibles —{" "}
                <Link to="/boutique" className="font-semibold text-brand-700 hover:text-brand-800">
                  {g.autres} autres avec le package
                </Link>
                .
              </p>
            )}
          </AnimatedSection>
        )
      )}

      {/* ---------- Bas de page ---------- */}
      <AnimatedSection delay={0.2} className="mx-auto mt-16 max-w-4xl border-t border-brand-100 pt-8 text-center text-sm text-ink-600">
        <p>
          La banque complète compte {TOTAL_BANQUE} exercices, avec les notes de
          cours et six examens corrigés.{" "}
          <Link to="/boutique" className="font-semibold text-brand-700 hover:text-brand-800">
            Voir ce que contient le package
          </Link>
          .
        </p>
        {/* vouvoiement-assume — s'adresse à un enseignant, pas à l'étudiant. */}
        <p className="mt-4">
          Vous êtes enseignant?{" "}
          <Link to="/enseignants" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
            Voici comment utiliser ce matériel avec votre groupe.
          </Link>
        </p>
      </AnimatedSection>
    </div>
  );
}

/**
 * « X / Y complétés » sous l'entête d'un chapitre. Discret, une seule
 * ligne, visible uniquement pour les détenteurs d'un accès valide. On
 * ne l'affiche pas en état de chargement pour éviter le passage de
 * « 0 / 30 » à « 12 / 30 » à la volée qui donnerait une impression
 * (fausse) de perte de données.
 */
function CompteurChapitre({ chapitre, nbTotal }: { chapitre: number; nbTotal: number }) {
  const { statut, progression } = useProgression();
  if (statut !== "actif") return null;
  const prefixe = `CD-C${String(chapitre).padStart(2, "0")}-`;
  const completes = compteAvecPrefixe(progression, "completes", prefixe);
  const marques = compteAvecPrefixe(progression, "marques", prefixe);
  return (
    <p className="mt-1 text-sm text-ink-600">
      <span className="font-semibold text-emerald-700">{completes} / {nbTotal}</span>{" "}
      complétés
      {marques > 0 && (
        <>
          {" "}·{" "}
          <span className="font-semibold text-amber-700">{marques}</span> à revoir
        </>
      )}
    </p>
  );
}

function Filtre({
  libelle,
  valeurs,
  actif,
  surChoix,
}: {
  libelle: string;
  valeurs: { cle: string; libelle: string }[];
  actif: string | null;
  surChoix: (valeur: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-xs font-semibold uppercase tracking-wide text-ink-600 sm:w-20">
        {libelle}
      </span>
      <button
        type="button"
        onClick={() => surChoix(null)}
        aria-pressed={actif === null}
        className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
          actif === null
            ? "bg-brand-600 font-semibold text-white"
            : "border border-brand-200 text-ink-700 hover:bg-brand-50"
        }`}
      >
        Tous
      </button>
      {valeurs.map((v) => (
        <button
          key={v.cle}
          type="button"
          onClick={() => surChoix(actif === v.cle ? null : v.cle)}
          aria-pressed={actif === v.cle}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            actif === v.cle
              ? "bg-brand-600 font-semibold text-white"
              : "border border-brand-200 text-ink-700 hover:bg-brand-50"
          }`}
        >
          {v.libelle}
        </button>
      ))}
    </div>
  );
}
