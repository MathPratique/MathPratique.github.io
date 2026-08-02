import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AnimatedSection from "../components/ui/AnimatedSection";
import { EMAIL_CONTACT } from "../data/site";
import { useAuth } from "../firebase/useAuth";
import { useAcces } from "../firebase/useAcces";
import { COURS_EN_VENTE } from "../firebase/acces";
import { demarrerAchat, messagePaiement } from "../firebase/paiement";

// ===========================================================================
//  TOUT CE QUI SE MODIFIE SANS TOUCHER AU RESTE DE LA PAGE
// ===========================================================================

/** Les montants. Aucun prix ne doit apparaître ailleurs, texte compris. */
const TARIFS = {
  prixRegulier: 49,
  prixLancement: 34,
  devise: "CAD",
};

/** Ce que dit la mention de rabais à côté du prix. */
const PERIODE_LANCEMENT = "Prix de lancement, pour la session d'automne 2026";

/** Durée de l'accès, en mois. Sert au texte ET au calcul de la date de fin. */
const DUREE_ACCES_MOIS = 12;

/**
 * Le paiement n'existe pas encore : ni compte, ni Stripe, ni octroi d'accès.
 * Tant que c'est `false`, la page annonce le produit sans prétendre le vendre.
 * Passer à `true` uniquement quand le parcours d'achat complet est en place.
 */
const PAIEMENT_ACTIF = false;

/** Chapitre en version enseignant + dix exercices. Aucune inscription. */
const PDF_APERCU = "/boutique/echantillon.pdf";
const NOM_TELECHARGEMENT_APERCU = "calcul-differentiel-apercu.pdf";

/** §4.2 — ce que contient le package. */
const CONTENU_PACKAGE: { icone: keyof typeof ICONES; titre: string; detail: string }[] = [
  {
    icone: "notes",
    titre: "Notes de cours complètes",
    detail:
      "En version étudiant, à compléter en classe, et en version enseignant, entièrement rédigée. Sept chapitres.",
  },
  {
    icone: "exercices",
    titre: "Plus de 300 exercices",
    detail:
      "Classés par chapitre et par difficulté, avec les réponses finales et les démarches détaillées.",
  },
  {
    icone: "melange",
    titre: "Séries de révision mélangées",
    detail:
      "Des exercices tirés de plusieurs chapitres à la fois, comme à l'examen — là où il faut d'abord reconnaître quoi appliquer.",
  },
  {
    icone: "examen",
    titre: "4 examens intra et 2 examens finaux",
    detail: "Chacun avec son corrigé détaillé et sa grille de correction.",
  },
  {
    icone: "telechargement",
    titre: "Accès en ligne et PDF téléchargeables",
    detail: "Consultables sur le site, imprimables, pendant toute ta période d'accès.",
  },
];

/**
 * §4.3 — l'état réel de la livraison.
 *
 * À METTRE À JOUR à chaque publication. C'est la section la plus importante
 * de la page : un étudiant qui découvre après coup qu'il manque quelque chose
 * demande un remboursement ; celui qui l'a lu avant attend.
 */
const DISPONIBILITE = {
  maintenant: [
    "Les sept chapitres de notes, en version étudiant et en version enseignant",
    "Les 305 exercices, avec réponses finales et démarches détaillées",
    "Les cinq séries de révision mélangées, avec leurs solutions",
    "Les six examens, avec corrigés détaillés et grilles de correction",
    "Tous ces documents en PDF téléchargeables",
  ],
  aVenir: [
    // Le mois est indicatif mais il engage le site : s'il glisse, corrige-le
    // ici plutôt que de laisser une date dépassée en ligne.
    {
      texte: "La consultation en ligne du contenu, directement sur le site",
      mois: "Septembre 2026",
    },
  ],
};

/** §4.4 — la comparaison. Le prix vient de TARIFS, jamais du texte. */
const PRIX_MANUEL_COMPARE = 74;

/** §4.6 — questions fréquentes. */
const FAQ: { question: string; reponse: string }[] = [
  {
    question: `Qu'est-ce qui se passe après ${DUREE_ACCES_MOIS} mois ?`,
    reponse:
      "L'accès en ligne et les téléchargements sont désactivés. Un rappel t'est envoyé 30 jours avant la fin, pour que tu aies le temps de télécharger ce que tu veux garder.",
  },
  {
    question: "Est-ce que c'est un abonnement ?",
    reponse:
      "Non. Un seul paiement, aucun renouvellement automatique. Rien ne sera prélevé sur ta carte après l'achat.",
  },
  {
    question: "Est-ce que je peux imprimer les documents ?",
    reponse: "Oui, pendant ta période d'accès, autant de fois que tu veux.",
  },
  {
    question: "Est-ce que ça correspond à mon cours ?",
    reponse:
      "Le contenu suit les objectifs du programme de calcul différentiel du collégial. Télécharge l'aperçu gratuit ci-dessus : c'est le meilleur moyen de vérifier avant d'acheter.",
  },
  {
    question: "Et si le matériel ne me convient pas ?",
    reponse:
      "Remboursement complet dans les 7 jours suivant l'achat, tant qu'aucun document n'a été téléchargé. Écris-nous, sans avoir à te justifier.",
  },
];

/**
 * §4.7 — témoignages.
 *
 * Ce tableau est VIDE, et la section ne s'affiche pas tant qu'il l'est.
 * N'y mets que de vrais témoignages, reçus de vraies personnes, avec leur
 * accord. Un avis inventé se remarque, et il coûte plus cher qu'il ne rapporte.
 */
type Temoignage = { id: string; citation: string; auteur: string };
const TEMOIGNAGES: Temoignage[] = [];

// ===========================================================================

/** La date de fin d'accès si l'achat se faisait aujourd'hui. */
function dateFinAcces(depuis: Date = new Date()): string {
  const fin = new Date(depuis);
  fin.setMonth(fin.getMonth() + DUREE_ACCES_MOIS);
  return fin.toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Boutique() {
  const finAcces = dateFinAcces();

  return (
    <div className="container-page py-12 sm:py-16">
      {/* ---------- 4.1  Accroche ---------- */}
      <AnimatedSection className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          Boutique
        </span>
        <h1 className="mt-4 text-balance text-4xl font-bold sm:text-5xl">
          Calcul différentiel
        </h1>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Tout le matériel du cours, préparé par un enseignant du collégial. Un
          seul paiement, {DUREE_ACCES_MOIS} mois d'accès, aucun abonnement.
        </p>
      </AnimatedSection>

      {/* ---------- Prix et modalités ---------- */}
      <AnimatedSection delay={0.1} className="mt-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-brand-100 bg-brand-50/40 p-8 text-center sm:p-10">
          <div className="flex items-baseline justify-center gap-3">
            <span className="font-display text-5xl font-bold text-brand-900">
              {TARIFS.prixLancement} $
            </span>
            <span className="text-xl text-ink-600 line-through">
              {TARIFS.prixRegulier} $
            </span>
            <span className="text-sm text-ink-600">{TARIFS.devise}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-brand-700">
            {PERIODE_LANCEMENT}
          </p>

          <div className="mt-6 rounded-2xl bg-white p-5 text-left">
            <h2 className="font-display text-base font-bold text-brand-900">
              Ce que veut dire « {DUREE_ACCES_MOIS} mois d'accès »
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              <li>
                Tu consultes le contenu en ligne et tu télécharges les documents
                pendant {DUREE_ACCES_MOIS} mois à partir de ton achat.{" "}
                <strong className="text-brand-900">
                  Si tu achetais aujourd'hui, ton accès se terminerait le{" "}
                  {finAcces}.
                </strong>
              </li>
              <li>
                Après cette date, la consultation en ligne et les
                téléchargements sont bloqués. Les documents que tu as déjà
                téléchargés restent à toi.
              </li>
              <li>
                Les mises à jour publiées pendant ta période d'accès sont
                incluses, sans supplément.
              </li>
              <li>
                Aucun abonnement, aucun renouvellement automatique. Un paiement
                unique pour {DUREE_ACCES_MOIS} mois.
              </li>
            </ul>
          </div>

          {PAIEMENT_ACTIF ? (
            <BoutonAchat />
          ) : (
            <div className="mt-6">
              <button
                type="button"
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-brand-600/40 px-7 py-3 text-sm font-semibold text-white sm:w-auto"
              >
                L'achat en ligne ouvre bientôt
              </button>
              <p className="mt-3 text-sm text-ink-600">
                Le paiement n'est pas encore en ligne. En attendant, l'aperçu
                ci-dessous est complet et gratuit — et tu peux nous écrire pour
                être prévenu de l'ouverture.
              </p>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* ---------- 4.2  Ce que contient le package ---------- */}
      <AnimatedSection delay={0.15} className="mt-16">
        <h2 className="text-center font-display text-2xl font-bold text-brand-900 sm:text-3xl">
          Ce que contient le package
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {CONTENU_PACKAGE.map((item) => (
            <div
              key={item.titre}
              className="flex gap-4 rounded-2xl border border-brand-100 bg-white p-5"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <Icone nom={item.icone} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-brand-900">
                  {item.titre}
                </h3>
                <p className="mt-1 text-sm text-ink-600">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ---------- 4.3  Ce qui est disponible aujourd'hui ---------- */}
      <AnimatedSection delay={0.2} className="mt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
            Ce qui est disponible aujourd'hui
          </h2>
          <p className="mt-3 text-balance text-base text-ink-600">
            Le matériel se publie au fil de la session. Voici exactement où en
            sont les choses, pour que tu saches ce que tu obtiens tout de suite.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-accent-300 bg-white p-6 sm:p-7">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-brand-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white">
                <Icone nom="coche" petite />
              </span>
              Disponible maintenant
            </h3>
            <ul className="mt-4 space-y-3">
              {DISPONIBILITE.maintenant.map((ligne) => (
                <li key={ligne} className="flex items-start gap-3 text-sm text-ink-700">
                  <span className="mt-1 text-accent-600">
                    <Icone nom="coche" petite />
                  </span>
                  <span>{ligne}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-brand-100 bg-brand-50/40 p-6 sm:p-7">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-brand-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-200 text-brand-800">
                <Icone nom="horloge" petite />
              </span>
              À venir pendant ta période d'accès
            </h3>
            <ul className="mt-4 space-y-3">
              {DISPONIBILITE.aVenir.map((item) => (
                <li key={item.texte} className="flex items-start gap-3 text-sm text-ink-700">
                  <span className="mt-1 text-brand-600">
                    <Icone nom="horloge" petite />
                  </span>
                  <span>
                    {item.texte}
                    <span className="mt-0.5 block text-xs font-semibold text-brand-700">
                      {item.mois}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-ink-600">
              Ces ajouts sont inclus dans ton achat. Rien de plus à payer.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ---------- 4.4  Comparaison ---------- */}
      <AnimatedSection delay={0.25} className="mt-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-brand-100 bg-white p-6 text-center sm:p-7">
          <p className="text-base text-ink-700">
            Un manuel de calcul différentiel se vend autour de{" "}
            {PRIX_MANUEL_COMPARE} $. Ce package coûte {TARIFS.prixLancement} $
            et contient six examens complets avec corrigés détaillés.
          </p>
        </div>
      </AnimatedSection>

      {/* ---------- 4.5  Aperçu gratuit ---------- */}
      <AnimatedSection delay={0.3} className="mt-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-brand-100 bg-brand-50/40 p-8 text-center sm:p-10">
          <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
            Regarde avant d'acheter
          </h2>
          <p className="mt-3 text-balance text-base text-ink-600">
            {/* Pas de nombre écrit ici : l'échantillon reprend les exercices
                ouverts du chapitre, et ce compte suit la vitrine gratuite. Il
                est passé de dix à neuf sans que cette phrase ne bouge. Mieux
                vaut ne rien promettre qu'on ne puisse tenir tout seul. */}
            Un chapitre complet en version enseignant, plus les exercices
            ouverts de ce chapitre avec leurs indices, leurs réponses et leurs
            démarches détaillées. Aucune inscription, aucun courriel à laisser.
          </p>
          <a
            href={PDF_APERCU}
            download={NOM_TELECHARGEMENT_APERCU}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
          >
            <Icone nom="telechargement" />
            Télécharger l'aperçu (PDF)
          </a>
        </div>
      </AnimatedSection>

      {/* ---------- 4.6  Questions fréquentes ---------- */}
      <AnimatedSection delay={0.35} className="mt-16">
        <h2 className="text-center font-display text-2xl font-bold text-brand-900 sm:text-3xl">
          Questions fréquentes
        </h2>
        <dl className="mx-auto mt-8 max-w-3xl space-y-4">
          {FAQ.map((item) => (
            <div
              key={item.question}
              className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6"
            >
              <dt className="font-display text-base font-bold text-brand-900">
                {item.question}
              </dt>
              <dd className="mt-2 text-sm text-ink-700">{item.reponse}</dd>
            </div>
          ))}
        </dl>
      </AnimatedSection>

      {/* ---------- 4.7  Témoignages — masqués tant qu'il n'y en a pas ---------- */}
      {TEMOIGNAGES.length > 0 && (
        <AnimatedSection delay={0.4} className="mt-16">
          <h2 className="text-center font-display text-2xl font-bold text-brand-900 sm:text-3xl">
            Ce qu'en disent les étudiants
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {TEMOIGNAGES.map((t) => (
              <figure
                key={t.id}
                className="rounded-2xl border border-brand-100 bg-white p-6"
              >
                <blockquote className="text-sm text-ink-700">
                  « {t.citation} »
                </blockquote>
                <figcaption className="mt-3 text-sm font-semibold text-brand-800">
                  {t.auteur}
                </figcaption>
              </figure>
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* ---------- Remboursement ---------- */}
      <AnimatedSection delay={0.45} className="mt-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-brand-100 bg-white p-6 sm:p-7">
          <h2 className="font-display text-lg font-bold text-brand-900">
            Politique de remboursement
          </h2>
          <p className="mt-2 text-sm text-ink-700">
            Remboursement complet dans les 7 jours suivant l'achat, tant
            qu'aucun document n'a été téléchargé. Écris-nous à{" "}
            <a
              href={`mailto:${EMAIL_CONTACT}`}
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              {EMAIL_CONTACT}
            </a>{" "}
            et le remboursement est traité sans discussion.
          </p>
        </div>
      </AnimatedSection>

      {/* ---------- Contact ---------- */}
      <AnimatedSection delay={0.5} className="mt-10 text-center text-sm text-ink-600">
        <p>
          Une question ? Écris-nous à{" "}
          <a
            href={`mailto:${EMAIL_CONTACT}`}
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            {EMAIL_CONTACT}
          </a>
        </p>
        <p className="mt-3">
          <Link to="/practice" className="font-semibold text-brand-700 hover:text-brand-800">
            Ou commence par les exercices gratuits
          </Link>
        </p>
      </AnimatedSection>
    </div>
  );
}

/**
 * Le bouton d'achat, et les trois états qu'un étudiant peut rencontrer.
 *
 * Aucun contrôle d'accès n'est fait ici : ce composant choisit seulement quoi
 * afficher. C'est la Cloud Function qui refuse un achat en double ou un
 * utilisateur non connecté — un bouton peut être contourné, pas elle.
 */
function BoutonAchat() {
  const { utilisateur, chargement } = useAuth();
  const { etat } = useAcces(COURS_EN_VENTE);
  const navigate = useNavigate();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  if (chargement) {
    return <p className="mt-6 text-sm text-ink-600">Un instant…</p>;
  }

  // Quelqu'un qui a déjà payé ne doit pas revoir un bouton « Acheter ».
  if (etat.actif) {
    return (
      <div className="mt-6">
        <Link
          to="/mon-compte"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700 sm:w-auto"
        >
          Tu as déjà accès — voir ton matériel
        </Link>
        <p className="mt-3 text-sm text-ink-600">
          Il te reste {etat.joursRestants} jours d'accès.
        </p>
      </div>
    );
  }

  async function acheter() {
    setErreur(null);
    // On envoie vers la connexion plutôt que d'échouer : le compte est
    // nécessaire, et l'étudiant revient ici une fois connecté.
    if (!utilisateur) {
      navigate("/connexion", { state: { retour: "/boutique" } });
      return;
    }
    setEnvoi(true);
    try {
      await demarrerAchat(COURS_EN_VENTE);
    } catch (err) {
      setErreur(messagePaiement(err));
      setEnvoi(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={acheter}
        disabled={envoi}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-600/50 sm:w-auto"
      >
        {envoi ? "Redirection vers le paiement…" : `Acheter — ${TARIFS.prixLancement} $`}
      </button>
      {erreur && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {erreur}
        </p>
      )}
      <p className="mt-3 text-xs text-ink-600">
        Paiement traité par Stripe. Aucune donnée de carte ne transite par ce
        site.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Icônes — même facture que le reste du site : SVG écrits à la main,
//  trait de 2 à 2,5, extrémités arrondies. Aucune bibliothèque.
// ---------------------------------------------------------------------------

const ICONES = {
  notes: "M4 4h11l5 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1zM14 4v6h6M7 13h8M7 17h5",
  exercices: "M4 5h16M4 12h16M4 19h10",
  melange: "M3 7h4l10 10h4M17 7h4M3 17h4l3-3M18 4l3 3-3 3M18 14l3 3-3 3",
  examen: "M6 2h9l4 4v16H6zM15 2v4h4M9 12l2 2 4-4",
  telechargement: "M12 3v12M7 11l5 5 5-5M4 20h16",
  coche: "M5 13l4 4L19 7",
  horloge: "M12 7v5l3 2M12 22a10 10 0 100-20 10 10 0 000 20z",
} as const;

function Icone({ nom, petite = false }: { nom: keyof typeof ICONES; petite?: boolean }) {
  const taille = petite ? 14 : 20;
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={petite ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONES[nom]} />
    </svg>
  );
}
