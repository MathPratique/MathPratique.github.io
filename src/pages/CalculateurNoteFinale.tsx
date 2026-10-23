import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import AnimatedSection from "../components/ui/AnimatedSection";
import {
  TOLERANCE_TOTAL,
  analyser,
  analyserSeuil,
  arrondi,
  arrondiBas,
  arrondiHaut,
  lireChamp,
  moyenneExamensFaits,
  ponderationTotale,
  pourcentage,
  totauxEgaux,
  type Analyse,
  type AnalyseSeuil,
  type Champ,
  type EvaluationFaite,
  type EvaluationRestante,
} from "../outils/note-finale";

// ═════════════════════════════════════════════════════════════════════════
//  Outil gratuit : « Quelle note me faut-il à l'examen final? »
//
//  L'étudiant entre ses évaluations DÉJÀ FAITES ; tout le reste du cours,
//  examen final compris, forme « ce qui reste ». Le calculateur donne la
//  moyenne à obtenir sur ce reste. Le détail de ce qui reste est facultatif :
//  il ne sert qu'au seuil de moyenne d'examens.
//
//  Tout se passe dans le navigateur : aucun appel à Firebase, aucun compte,
//  rien n'est envoyé. La saisie est gardée dans localStorage pour la visite
//  suivante — chaque accès est protégé, car le stockage peut être refusé
//  (navigation privée, données de site bloquées) et la page doit marcher
//  quand même.
//
//  Le calcul vit dans `src/outils/note-finale.ts`, testé par `npm test`.
// ═════════════════════════════════════════════════════════════════════════

// Recopiés dans scripts/prerendre.mjs, qui les injecte dans le HTML pré-rendu
// (les effets ne s'exécutent pas hors navigateur). Un test vérifie qu'ils
// restent identiques.
const TITRE = "Quelle note me faut-il au final? | MathPratique";
const DESCRIPTION =
  "Calcule la moyenne qu'il te faut sur tes évaluations restantes, dont l'examen final, pour réussir ton cours au cégep. Gratuit, sans compte, résultat immédiat.";

// v2 : la saisie ne porte plus la pondération du final, mais le détail
// facultatif de ce qui reste.
const CLE_STOCKAGE = "mathpratique:note-finale:v2";
const SEUIL_EXAMENS = 60;

type Faite = { id: number; nom: string; note: string; ponderation: string; examen: boolean };
type Restante = { id: number; nom: string; ponderation: string; examen: boolean };
type ChoixCible = "60" | "70" | "80" | "90" | "autre";
type Saisie = {
  faites: Faite[];
  restantes: Restante[];
  detailOuvert: boolean;
  cible: ChoixCible;
  ciblePerso: string;
  optionExamens: boolean;
};

const CIBLES: { valeur: ChoixCible; libelle: string }[] = [
  { valeur: "60", libelle: "60\u00a0% (réussite)" },
  { valeur: "70", libelle: "70\u00a0%" },
  { valeur: "80", libelle: "80\u00a0%" },
  { valeur: "90", libelle: "90\u00a0%" },
  { valeur: "autre", libelle: "Autre" },
];

const faiteVide = (id: number): Faite => ({ id, nom: "", note: "", ponderation: "", examen: false });
const restanteVide = (id: number): Restante => ({ id, nom: "", ponderation: "", examen: false });
const prochainId = (lignes: { id: number }[]) => Math.max(0, ...lignes.map((l) => l.id)) + 1;

function saisieVide(): Saisie {
  return {
    faites: [faiteVide(1), faiteVide(2)],
    restantes: [restanteVide(1)],
    detailOuvert: false,
    cible: "60",
    ciblePerso: "",
    optionExamens: false,
  };
}

/**
 * Relit une saisie gardée, ou null si elle est absente, illisible ou d'une
 * autre forme. Appelée à l'initialisation de l'état : `createRoot` remplace
 * le HTML pré-rendu sans l'hydrater, donc aucun décalage d'affichage. Au
 * pré-rendu, `window` n'existe pas et la fonction rend null sans y toucher.
 */
function lireSaisieGardee(): Saisie | null {
  if (typeof window === "undefined") return null;
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return null;
    const s = JSON.parse(brut);
    const texte = (v: unknown) => typeof v === "string";
    const ligneValide = (l: Partial<Faite>, avecNote: boolean) =>
      !!l &&
      typeof l.id === "number" &&
      texte(l.nom) &&
      texte(l.ponderation) &&
      typeof l.examen === "boolean" &&
      (!avecNote || texte(l.note));
    if (
      !s ||
      !Array.isArray(s.faites) ||
      !s.faites.every((l: Faite) => ligneValide(l, true)) ||
      !Array.isArray(s.restantes) ||
      !s.restantes.every((l: Restante) => ligneValide(l, false)) ||
      typeof s.detailOuvert !== "boolean" ||
      !CIBLES.some((c) => c.valeur === s.cible) ||
      !texte(s.ciblePerso) ||
      typeof s.optionExamens !== "boolean"
    ) {
      return null;
    }
    return s as Saisie;
  } catch {
    return null;
  }
}

const MESSAGES: Record<NonNullable<Champ["erreur"]>, string> = {
  vide: "À remplir pour compter cette évaluation.",
  invalide: "Entre un nombre, par exemple 72,5.",
  "hors-bornes": "Entre une valeur de 0 à 100.",
};

// ═════════════════════════════════════════════════════════════════════════

export default function CalculateurNoteFinale() {
  useEffect(() => {
    document.title = TITRE;
    document.querySelector('meta[name="description"]')?.setAttribute("content", DESCRIPTION);
  }, []);

  const [saisie, setSaisie] = useState<Saisie>(() => lireSaisieGardee() ?? saisieVide());

  useEffect(() => {
    try {
      window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify(saisie));
    } catch {
      // Stockage refusé : la page fonctionne, elle ne se souviendra simplement pas.
    }
  }, [saisie]);

  const maj = (partiel: Partial<Saisie>) => setSaisie((s) => ({ ...s, ...partiel }));
  const majFaite = (id: number, partiel: Partial<Faite>) =>
    setSaisie((s) => ({ ...s, faites: s.faites.map((l) => (l.id === id ? { ...l, ...partiel } : l)) }));
  const majRestante = (id: number, partiel: Partial<Restante>) =>
    setSaisie((s) => ({
      ...s,
      restantes: s.restantes.map((l) => (l.id === id ? { ...l, ...partiel } : l)),
    }));
  const reinitialiser = () => {
    try {
      window.localStorage.removeItem(CLE_STOCKAGE);
    } catch {
      // Rien à effacer si le stockage est refusé.
    }
    setSaisie(saisieVide());
  };
  const ouvrirDetail = () => {
    maj({ detailOuvert: true });
    requestAnimationFrame(() =>
      document.getElementById("detail-reste")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  // ---- Lecture des champs ------------------------------------------------
  const faitesLues = saisie.faites.map((l) => {
    const note = lireChamp(l.note);
    const ponderation = lireChamp(l.ponderation);
    const vide = l.nom.trim() === "" && l.note.trim() === "" && l.ponderation.trim() === "";
    return { ligne: l, note, ponderation, vide, valide: note.erreur === null && ponderation.erreur === null };
  });
  const faites: EvaluationFaite[] = faitesLues
    .filter((l) => l.valide)
    .map((l) => ({
      note: l.note.valeur as number,
      ponderation: l.ponderation.valeur as number,
      examen: l.ligne.examen,
    }));
  const faitesIncompletes = faitesLues.filter((l) => !l.valide && !l.vide).length;

  const restantesLues = saisie.restantes.map((l) => {
    const ponderation = lireChamp(l.ponderation);
    const vide = l.nom.trim() === "" && l.ponderation.trim() === "";
    return { ligne: l, ponderation, vide, valide: ponderation.erreur === null };
  });
  const restantes: EvaluationRestante[] = restantesLues
    .filter((l) => l.valide)
    .map((l) => ({ ponderation: l.ponderation.valeur as number, examen: l.ligne.examen }));
  const restantesIncompletes = restantesLues.filter((l) => !l.valide && !l.vide).length;

  const ponderationFaite = ponderationTotale(faites);
  const etatReste =
    ponderationFaite > 100 + TOLERANCE_TOTAL
      ? "trop"
      : ponderationFaite >= 100 - TOLERANCE_TOTAL
        ? "termine"
        : "en-cours";
  const ponderationRestante = Math.max(0, 100 - ponderationFaite);
  const totalDetaille = ponderationTotale(restantes);
  const detailIncoherent =
    etatReste === "en-cours" && restantes.length > 0 && !totauxEgaux(totalDetaille, ponderationRestante);

  const cible = saisie.cible === "autre" ? lireChamp(saisie.ciblePerso) : lireChamp(saisie.cible);
  const analyse = cible.valeur !== null ? analyser(faites, cible.valeur) : null;
  const seuil = saisie.optionExamens ? analyserSeuil(faites, restantes, SEUIL_EXAMENS) : null;

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          Outil gratuit
        </span>
        <h1 className="mt-4 text-balance text-3xl font-bold sm:text-5xl">
          {/* « faut-il » insécable : sur téléphone, le titre se coupait au trait d'union. */}
          Quelle note me <span className="whitespace-nowrap">faut-il</span> à l'examen final?
        </h1>
        <p className="mt-4 text-balance text-base text-ink-600 sm:text-lg">
          Entre tes évaluations déjà faites : le calculateur te dit quelle moyenne viser
          sur ce qui reste du cours, examen final compris, pour réussir ou pour atteindre
          la note que tu vises.
        </p>
      </AnimatedSection>

      <div className="mx-auto mt-10 max-w-3xl space-y-6">
        {/* ---- 1. Évaluations déjà faites ---------------------------------- */}
        <section className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-900/5 sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">1. Tes évaluations déjà faites</h2>
          <p className="mt-1 text-sm text-ink-600">
            Seulement celles dont tu connais la note, avec leur pondération, telles qu'elles
            figurent à ton plan de cours.
          </p>
          {saisie.optionExamens && (
            <p className="mt-2 text-sm text-brand-700">
              Coche « C'est un examen » pour chaque examen déjà fait.
            </p>
          )}

          <ul className="mt-5 space-y-3">
            {faitesLues.map(({ ligne, note, ponderation, vide }, i) => (
              <li key={ligne.id} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_8rem]">
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor={`nom-${ligne.id}`} className={etiquette}>
                      Évaluation
                    </label>
                    <input
                      id={`nom-${ligne.id}`}
                      type="text"
                      autoComplete="off"
                      placeholder={`Ex. : ${i === 0 ? "Mini-test 1" : `Examen ${i}`}`}
                      value={ligne.nom}
                      onChange={(e) => majFaite(ligne.id, { nom: e.target.value })}
                      className={champ(false)}
                    />
                  </div>
                  <ChampPourcentage
                    id={`note-${ligne.id}`}
                    libelle="Note obtenue (%)"
                    valeur={ligne.note}
                    lu={note}
                    afficherErreur={!vide}
                    onChange={(v) => majFaite(ligne.id, { note: v })}
                  />
                  <ChampPourcentage
                    id={`pond-${ligne.id}`}
                    libelle="Pondération (%)"
                    valeur={ligne.ponderation}
                    lu={ponderation}
                    afficherErreur={!vide}
                    onChange={(v) => majFaite(ligne.id, { ponderation: v })}
                  />
                </div>
                <PiedDeLigne
                  examen={saisie.optionExamens ? ligne.examen : null}
                  onExamen={(v) => majFaite(ligne.id, { examen: v })}
                  onRetirer={() =>
                    setSaisie((s) => ({ ...s, faites: s.faites.filter((l) => l.id !== ligne.id) }))
                  }
                  nom={ligne.nom.trim() || `l'évaluation ${i + 1}`}
                />
              </li>
            ))}
          </ul>

          <BoutonAjouter
            libelle="Ajouter une évaluation"
            onClick={() => setSaisie((s) => ({ ...s, faites: [...s.faites, faiteVide(prochainId(s.faites))] }))}
          />
        </section>

        {/* ---- Ce qui reste : encadré automatique -------------------------- */}
        <div
          className={clsx(
            "rounded-3xl p-5 text-center sm:p-6",
            etatReste === "trop" ? "border border-amber-300 bg-amber-50 text-amber-900" : "bg-brand-50 text-ink-700",
          )}
        >
          {etatReste === "en-cours" && (
            <>
              <p className="font-display text-lg font-semibold text-brand-900 sm:text-xl">
                Il te reste {pourcentage(arrondi(ponderationRestante))} du cours à évaluer.
              </p>
              <p className="mt-1 text-sm text-ink-600">
                C'est « ce qui reste » : toutes les évaluations à venir, examen final compris.
              </p>
            </>
          )}
          {etatReste === "termine" && (
            <p className="font-display text-lg font-semibold text-brand-900 sm:text-xl">
              Tes évaluations couvrent tout le cours : il ne reste rien à évaluer.
            </p>
          )}
          {etatReste === "trop" && (
            <p className="text-sm sm:text-base">
              Tes évaluations faites totalisent <strong>{pourcentage(arrondi(ponderationFaite))}</strong>,
              soit plus que 100&nbsp;%. Vérifie leurs pondérations : aucun calcul n'est possible ainsi.
            </p>
          )}
        </div>

        {/* ---- Détailler ce qui reste (facultatif) ------------------------- */}
        <details
          id="detail-reste"
          open={saisie.detailOuvert}
          onToggle={(e) => {
            const ouvert = e.currentTarget.open;
            if (ouvert !== saisie.detailOuvert) maj({ detailOuvert: ouvert });
          }}
          className="group scroll-mt-28 rounded-3xl border border-brand-100 bg-white shadow-sm shadow-brand-900/5"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 sm:p-8 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block font-display text-xl font-bold text-brand-900 sm:text-2xl">
                Détailler ce qui reste <span className="text-base font-medium text-ink-600">(facultatif)</span>
              </span>
              <span className="mt-1 block text-sm text-ink-600">
                Par exemple : Examen 2, 20&nbsp;% ; examen final, 35&nbsp;%. Utile surtout pour le seuil de
                moyenne d'examens.
              </span>
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="mt-1 shrink-0 text-brand-700 transition-transform duration-200 group-open:rotate-180"
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>

          <div className="px-5 pb-5 sm:px-8 sm:pb-8">
            {saisie.optionExamens && (
              <p className="text-sm text-brand-700">
                Coche « C'est un examen » pour chaque examen à venir, examen final compris.
              </p>
            )}
            <ul className="mt-3 space-y-3">
              {restantesLues.map(({ ligne, ponderation, vide }, i) => (
                <li key={ligne.id} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                    <div className="col-span-2 sm:col-span-1">
                      <label htmlFor={`reste-nom-${ligne.id}`} className={etiquette}>
                        Évaluation à venir
                      </label>
                      <input
                        id={`reste-nom-${ligne.id}`}
                        type="text"
                        autoComplete="off"
                        placeholder={i === 0 ? "Ex. : Examen final" : `Ex. : Évaluation ${i + 1}`}
                        value={ligne.nom}
                        onChange={(e) => majRestante(ligne.id, { nom: e.target.value })}
                        className={champ(false)}
                      />
                    </div>
                    <ChampPourcentage
                      id={`reste-pond-${ligne.id}`}
                      libelle="Pondération (%)"
                      valeur={ligne.ponderation}
                      lu={ponderation}
                      afficherErreur={!vide}
                      onChange={(v) => majRestante(ligne.id, { ponderation: v })}
                    />
                  </div>
                  <PiedDeLigne
                    examen={saisie.optionExamens ? ligne.examen : null}
                    onExamen={(v) => majRestante(ligne.id, { examen: v })}
                    onRetirer={() =>
                      setSaisie((s) => ({ ...s, restantes: s.restantes.filter((l) => l.id !== ligne.id) }))
                    }
                    nom={ligne.nom.trim() || `l'évaluation à venir ${i + 1}`}
                  />
                </li>
              ))}
            </ul>

            <BoutonAjouter
              libelle="Ajouter une évaluation à venir"
              onClick={() =>
                setSaisie((s) => ({ ...s, restantes: [...s.restantes, restanteVide(prochainId(s.restantes))] }))
              }
            />

            {restantes.length > 0 && etatReste === "en-cours" && (
              <p
                className={clsx(
                  "mt-4 rounded-2xl p-3 text-sm",
                  detailIncoherent ? "border border-amber-200 bg-amber-50 text-amber-900" : "text-ink-600",
                )}
              >
                {detailIncoherent
                  ? `Ton détail totalise ${pourcentage(arrondi(totalDetaille))}, mais il te reste ${pourcentage(
                      arrondi(ponderationRestante),
                    )} du cours. Vérifie ton plan de cours : il manque peut-être une évaluation, ou une pondération est à corriger.`
                  : `Ton détail totalise ${pourcentage(arrondi(totalDetaille))} : c'est bien tout ce qui reste.`}
              </p>
            )}
          </div>
        </details>

        {/* ---- 2. La note visée -------------------------------------------- */}
        <section className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-900/5 sm:p-8">
          <fieldset>
            <legend className="font-display text-xl font-bold text-brand-900 sm:text-2xl">
              2. Ta note visée dans le cours
            </legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {CIBLES.map((c) => {
                const choisi = saisie.cible === c.valeur;
                return (
                  <label
                    key={c.valeur}
                    className={clsx(
                      "cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500",
                      choisi
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50",
                    )}
                  >
                    <input
                      type="radio"
                      name="cible"
                      value={c.valeur}
                      checked={choisi}
                      onChange={() => maj({ cible: c.valeur })}
                      className="sr-only"
                    />
                    {c.libelle}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {saisie.cible === "autre" && (
            <div className="mt-4 max-w-[12rem]">
              <ChampPourcentage
                id="cible-perso"
                libelle="Ta cible (%)"
                valeur={saisie.ciblePerso}
                lu={cible}
                afficherErreur={cible.erreur !== "vide"}
                onChange={(v) => maj({ ciblePerso: v })}
              />
            </div>
          )}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-4 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={saisie.optionExamens}
              onChange={(e) =>
                // Le seuil a besoin du détail de ce qui reste : on l'ouvre d'office.
                maj({ optionExamens: e.target.checked, detailOuvert: e.target.checked || saisie.detailOuvert })
              }
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-brand-600"
            />
            <span>
              <span className="font-semibold text-ink-900">
                Mon cours exige aussi une moyenne d'examens d'au moins 60&nbsp;%
              </span>
              <span className="mt-1 block text-ink-600">
                Indique alors quels examens sont faits et lesquels restent : le calculateur
                vérifie ce seuil à part.
              </span>
            </span>
          </label>
        </section>

        {/* ---- Résultat ---------------------------------------------------- */}
        <Resultat
          analyse={analyse}
          cible={cible.valeur}
          seuil={seuil}
          moyenneExamensFaits={moyenneExamensFaits(faites)}
          faitesIncompletes={faitesIncompletes}
          restantesIncompletes={restantesIncompletes}
          onOuvrirDetail={ouvrirDetail}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={reinitialiser}
            className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-ink-600 underline underline-offset-2 transition-colors duration-200 hover:text-brand-700"
          >
            Réinitialiser
          </button>
        </div>

        <Explications />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  Champs et lignes
// ═════════════════════════════════════════════════════════════════════════

const etiquette = "text-xs font-semibold text-ink-700";

// text-base sur téléphone : sous 16 px, Safari agrandit la page au focus.
const champ = (erreur: boolean) =>
  clsx(
    "mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-base text-ink-900 outline-none transition-colors sm:text-sm",
    erreur ? "border-amber-400 focus:border-amber-500" : "border-brand-200 focus:border-brand-500",
  );

function ChampPourcentage({
  id,
  libelle,
  valeur,
  lu,
  afficherErreur,
  onChange,
}: {
  id: string;
  libelle: string;
  valeur: string;
  lu: Champ;
  afficherErreur: boolean;
  onChange: (v: string) => void;
}) {
  const message = afficherErreur && lu.erreur ? MESSAGES[lu.erreur] : null;
  return (
    <div>
      <label htmlFor={id} className={etiquette}>
        {libelle}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-aide` : undefined}
        className={champ(message !== null)}
      />
      {message && (
        <p id={`${id}-aide`} className="mt-1 text-xs text-amber-800">
          {message}
        </p>
      )}
    </div>
  );
}

/** Case « C'est un examen » (null : option désactivée) et bouton Retirer. */
function PiedDeLigne({
  examen,
  onExamen,
  onRetirer,
  nom,
}: {
  examen: boolean | null;
  onExamen: (v: boolean) => void;
  onRetirer: () => void;
  nom: string;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      {examen !== null ? (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={examen}
            onChange={(e) => onExamen(e.target.checked)}
            className="h-5 w-5 cursor-pointer accent-brand-600"
          />
          C'est un examen
        </label>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onRetirer}
        className="cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-ink-600 transition-colors duration-200 hover:bg-white hover:text-brand-700"
        aria-label={`Retirer ${nom}`}
      >
        Retirer
      </button>
    </div>
  );
}

function BoutonAjouter({ libelle, onClick }: { libelle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors duration-200 hover:bg-brand-50"
    >
      <span aria-hidden="true">+</span> {libelle}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════
//  Résultat
// ═════════════════════════════════════════════════════════════════════════

function encouragement(requise: number): string {
  if (requise <= 50) return "C'est tout à fait à ta portée. Garde le rythme jusqu'à la fin.";
  if (requise <= 75) return "Avec une préparation régulière, c'est à ta portée.";
  if (requise <= 90) return "C'est exigeant, mais possible : prépare-toi tôt et pratique beaucoup.";
  return "C'est très exigeant : chaque point compte. Mise sur la pratique et n'hésite pas à demander de l'aide.";
}

function Resultat({
  analyse,
  cible,
  seuil,
  moyenneExamensFaits,
  faitesIncompletes,
  restantesIncompletes,
  onOuvrirDetail,
}: {
  analyse: Analyse | null;
  cible: number | null;
  seuil: AnalyseSeuil | null;
  moyenneExamensFaits: number | null;
  faitesIncompletes: number;
  restantesIncompletes: number;
  onOuvrirDetail: () => void;
}) {
  if (!analyse || cible === null) {
    return (
      <section
        aria-live="polite"
        className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/40 p-6 text-center text-sm text-ink-600 sm:p-8"
      >
        Indique ta note visée pour voir le résultat.
      </section>
    );
  }

  const cibleTexte = pourcentage(arrondi(cible));

  return (
    <section className="rounded-3xl border border-brand-200 bg-white p-5 shadow-sm shadow-brand-900/5 sm:p-8">
      <h2 className="text-xl font-bold sm:text-2xl">Résultat</h2>

      <div aria-live="polite" className="mt-4 space-y-4">
        {analyse.statut === "trop" && (
          <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">
            Aucun calcul : tes évaluations faites totalisent{" "}
            {pourcentage(arrondi(analyse.ponderationFaite))}, soit plus que 100&nbsp;%. Corrige
            leurs pondérations ci-dessus.
          </div>
        )}

        {analyse.statut === "termine" && (
          <div className="rounded-2xl bg-brand-50 p-5">
            <p className="font-display text-xl font-bold text-brand-900">
              Ton cours est terminé : ta note finale est de {pourcentage(arrondi(analyse.noteFinale))}.
            </p>
            <p className="mt-2 text-sm text-ink-700">
              {analyse.cibleAtteinte
                ? `Bravo : tu atteins ta cible de ${cibleTexte}!`
                : `Ta cible était de ${cibleTexte}.`}
            </p>
          </div>
        )}

        {analyse.statut === "atteint" && (
          <div className="rounded-2xl bg-accent-300/25 p-5">
            <p className="font-display text-2xl font-bold text-accent-600">Tu as déjà atteint ton objectif!</p>
            <p className="mt-2 text-sm text-ink-700">
              Même avec 0&nbsp;% sur ce qui reste, ta note finale serait de{" "}
              {pourcentage(arrondi(analyse.acquis))}. Bravo! Les évaluations restantes sont une belle
              occasion d'aller chercher encore plus.
            </p>
          </div>
        )}

        {analyse.statut === "possible" && (
          <div className="rounded-2xl bg-brand-50 p-5">
            <p className="text-sm font-medium text-ink-700">Il te faut en moyenne</p>
            <p className="font-display text-5xl font-bold text-brand-700">
              {pourcentage(arrondiHaut(analyse.requise))}
            </p>
            <p className="mt-1 text-sm text-ink-700">
              sur les évaluations restantes ({pourcentage(arrondi(analyse.ponderationRestante))} du cours)
              pour atteindre {cibleTexte}.
            </p>
            <p className="mt-3 text-sm text-ink-600">{encouragement(analyse.requise)}</p>
          </div>
        )}

        {analyse.statut === "impossible" && (
          <div className="rounded-2xl bg-amber-50 p-5">
            <p className="font-display text-xl font-bold text-amber-900">
              Ton objectif de {cibleTexte} n'est plus atteignable.
            </p>
            <p className="mt-2 text-sm text-ink-700">
              Il faudrait en moyenne {pourcentage(arrondiHaut(analyse.requise))} sur ce qui reste. Avec
              100&nbsp;% sur toutes les évaluations restantes, ta note finale maximale serait de{" "}
              {pourcentage(arrondiBas(analyse.noteMax))}.
            </p>
            <p className="mt-2 text-sm text-ink-700">
              Choisis une autre cible ci-dessus pour voir ce qui reste possible. Chaque point compte
              quand même, et ton aide pédagogique peut t'aider à voir tes options.
            </p>
          </div>
        )}

        {seuil && analyse.statut !== "trop" && (
          <LigneSeuil
            seuil={seuil}
            termine={analyse.statut === "termine"}
            moyenneExamensFaits={moyenneExamensFaits}
            onOuvrirDetail={onOuvrirDetail}
          />
        )}
      </div>

      {(faitesIncompletes > 0 || restantesIncompletes > 0) && (
        <div className="mt-4 space-y-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {faitesIncompletes > 0 && (
            <p>
              {faitesIncompletes === 1
                ? "Une évaluation faite incomplète n'est pas comptée."
                : `${faitesIncompletes} évaluations faites incomplètes ne sont pas comptées.`}
            </p>
          )}
          {restantesIncompletes > 0 && (
            <p>
              {restantesIncompletes === 1
                ? "Une évaluation à venir sans pondération valide n'est pas comptée dans le détail."
                : `${restantesIncompletes} évaluations à venir sans pondération valide ne sont pas comptées dans le détail.`}
            </p>
          )}
        </div>
      )}

      {(analyse.statut === "atteint" || analyse.statut === "possible" || analyse.statut === "impossible") && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="mb-2 text-left font-display text-base font-semibold text-brand-900">
              Si tu obtiens en moyenne… sur ce qui reste
            </caption>
            <thead>
              <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-ink-600">
                <th scope="col" className="py-2 pr-3 font-semibold">Sur ce qui reste</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Ta note finale sera</th>
                <th scope="col" className="py-2 font-semibold">
                  <span className="sr-only">Objectif</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {analyse.tableau.map((l) => (
                <tr key={l.x} className={clsx("border-b border-brand-50", l.reussit && "bg-accent-300/15")}>
                  <td className="py-2 pr-3 font-medium text-ink-900">{pourcentage(l.x)}</td>
                  <td className="py-2 pr-3">{pourcentage(arrondi(l.note))}</td>
                  <td className="whitespace-nowrap py-2 text-xs font-semibold text-accent-600">
                    {l.reussit ? "✓ atteint" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** La ligne du seuil de moyenne d'examens, à côté du résultat principal. */
function LigneSeuil({
  seuil,
  termine,
  moyenneExamensFaits,
  onOuvrirDetail,
}: {
  seuil: AnalyseSeuil;
  termine: boolean;
  moyenneExamensFaits: number | null;
  onOuvrirDetail: () => void;
}) {
  const boite = "rounded-2xl border border-brand-100 p-4 text-sm text-ink-700";

  // Cours terminé : la moyenne d'examens est connue, le détail est sans objet.
  if (termine) {
    return (
      <p className={boite}>
        {moyenneExamensFaits === null
          ? "Coche tes examens parmi tes évaluations pour connaître ta moyenne d'examens."
          : `Ta moyenne d'examens est de ${pourcentage(arrondi(moyenneExamensFaits))} : ${
              moyenneExamensFaits >= SEUIL_EXAMENS ? "le seuil de 60\u00a0% est respecté." : "c'est sous le seuil de 60\u00a0%."
            }`}
      </p>
    );
  }

  switch (seuil.statut) {
    case "sans-detail":
      return (
        <div className={boite}>
          <p>
            Pour vérifier le seuil de 60&nbsp;% de moyenne d'examens, le calculateur doit savoir lesquelles
            de tes évaluations restantes sont des examens. Il ne le devine pas.
          </p>
          <button
            type="button"
            onClick={onOuvrirDetail}
            className="mt-3 inline-flex cursor-pointer items-center rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors duration-200 hover:bg-brand-50"
          >
            Détailler ce qui reste
          </button>
        </div>
      );
    case "detail-incomplet":
      // Pas de chiffre partiel : il induirait en erreur (voir analyserSeuil).
      return (
        <div className={boite}>
          <p className="font-semibold text-ink-900">
            Complète le détail de ce qui reste pour voir l'exigence sur tes examens.
          </p>
          <p className="mt-1">
            Ton détail totalise {pourcentage(arrondi(seuil.totalDetaille))}, mais il te reste{" "}
            {pourcentage(arrondi(seuil.ponderationRestante))} du cours.
          </p>
          <button
            type="button"
            onClick={onOuvrirDetail}
            className="mt-3 inline-flex cursor-pointer items-center rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors duration-200 hover:bg-brand-50"
          >
            Compléter le détail
          </button>
        </div>
      );
    case "fixe":
      return (
        <p className={boite}>
          {seuil.moyenne === null
            ? "Aucun examen n'est coché, ni parmi tes évaluations faites ni parmi celles à venir : coche tes examens pour vérifier le seuil."
            : `Aucune évaluation à venir n'est cochée comme examen : ta moyenne d'examens reste de ${pourcentage(
                arrondi(seuil.moyenne),
              )}, ${seuil.respecte ? "au-dessus du" : "sous le"} seuil de 60\u00a0%.`}
        </p>
      );
    case "atteint":
      return (
        <p className={boite}>
          Seuil d'examens : tes 60&nbsp;% de moyenne sont déjà assurés, même avec 0&nbsp;% à tes examens
          restants.
        </p>
      );
    case "possible":
      return (
        <p className={boite}>
          Sur tes examens restants ({pourcentage(arrondi(seuil.ponderationExamensRestants))} du cours), il te
          faut au moins <strong className="text-brand-700">{pourcentage(arrondiHaut(seuil.requise))}</strong>{" "}
          pour respecter le seuil de 60&nbsp;% de moyenne d'examens.
        </p>
      );
    case "impossible":
      return (
        <p className={clsx(boite, "border-amber-200 bg-amber-50 text-amber-900")}>
          Le seuil de 60&nbsp;% de moyenne d'examens ne peut plus être respecté : même avec 100&nbsp;% à
          tes examens restants, ta moyenne d'examens serait de {pourcentage(arrondiBas(seuil.moyenneMax))}.
        </p>
      );
  }
}

// ═════════════════════════════════════════════════════════════════════════
//  Comment ça marche
// ═════════════════════════════════════════════════════════════════════════

function Explications() {
  return (
    <section className="pt-6 text-sm leading-relaxed text-ink-700 sm:text-base">
      <h2 className="text-xl font-bold sm:text-2xl">Comment le calcul fonctionne</h2>
      <p className="mt-3">
        Chaque évaluation déjà faite te rapporte sa note multipliée par sa pondération. Tout ce
        qui n'est pas encore évalué, examen final compris, forme « ce qui reste » : le
        calculateur cherche la moyenne qu'il te faut sur ces évaluations restantes pour
        atteindre ta cible.
      </p>
      <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/40 p-5">
        <p className="font-semibold text-ink-900">Exemple</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Mini-test : 80&nbsp;% × 5&nbsp;% = 4 points</li>
          <li>Examen 1 : 55&nbsp;% × 15&nbsp;% = 8,25 points</li>
          <li>Tu as donc 12,25 points sur les 20 déjà en jeu, et il te reste 80&nbsp;% du cours.</li>
          <li>
            Pour obtenir 80&nbsp;%, il te manque 80 − 12,25 = 67,75 points, à aller chercher sur 80 points :
            67,75 ÷ 80 = 84,69&nbsp;%, donc <strong>84,7&nbsp;%</strong> de moyenne sur ce qui reste.
          </li>
        </ul>
      </div>
      <p className="mt-4">
        La moyenne requise est arrondie <strong>vers le haut</strong> au dixième : 84,69&nbsp;% devient
        84,7&nbsp;%, jamais 84,6&nbsp;%. Ainsi, le calculateur ne te laisse jamais croire qu'une note un peu
        trop basse suffit.
      </p>
      <p className="mt-3">
        Certains cours exigent aussi une moyenne d'examens d'au moins 60&nbsp;%. C'est une moyenne
        pondérée de tous les examens, faits et à venir. Pour la vérifier, le calculateur a besoin
        de savoir lesquelles de tes évaluations restantes sont des examens : c'est à ça que sert
        « Détailler ce qui reste ». Vérifie la règle exacte dans ton plan de cours.
      </p>
      <p className="mt-3 text-ink-600">
        Le calcul se fait entièrement sur ton appareil : rien n'est envoyé. Ta saisie est gardée
        dans ton navigateur pour ta prochaine visite ; « Réinitialiser » l'efface.
      </p>

      <div className="mt-8 border-t border-brand-100 pt-6 text-ink-600">
        Pour te préparer à ce qui reste, pratique avec nos{" "}
        <Link to="/practice" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
          exercices corrigés gratuits
        </Link>
        , chacun avec sa démarche complète, ou découvre le{" "}
        <Link to="/boutique" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
          matériel complet de calcul différentiel
        </Link>
        .
      </div>
    </section>
  );
}
