import { Link } from "react-router-dom";
import AnimatedSection from "../ui/AnimatedSection";
import { matieresEnVente } from "../../data/stats";
import { PRODUITS_PAR_TOPIC } from "../../data/boutique";
import { nombre } from "../../data/compteurs";
import { DUREE_ACCES_MOIS } from "../../acces/regles";
import { VENTE_OUVERTE } from "../../acces/vente";
import type { Topic } from "../../data/topics";

// Section « package » de l'accueil.
//
// N'affiche que les matières dont un package s'achète (`data/boutique.ts`) :
// aujourd'hui, Calcul différentiel seulement. Prix et durée d'accès sont lus
// dans leurs constantes, jamais recopiés. `VENTE_OUVERTE` n'est lu que pour
// prévenir que l'achat n'est pas encore ouvert — rien ici ne touche au
// paiement.
//
// Le contenu énuméré (notes, exercices, examens corrigés) est celui des
// packages actuels : à revérifier le jour où un autre cours passe en vente.

export default function SectionBoutique() {
  if (matieresEnVente.length === 0) return null;
  return (
    <section className="container-page py-20 sm:py-24">
      <AnimatedSection className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-bold sm:text-4xl">
          Le matériel complet de ton cours
        </h2>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Les exercices gratuits te font pratiquer. Le package te donne tout le
          cours, prêt pour les examens.
        </p>
      </AnimatedSection>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6">
        {matieresEnVente.map((topic, i) => (
          <AnimatedSection key={topic.id} delay={i * 0.08}>
            <CartePackage topic={topic} />
          </AnimatedSection>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-sm">
        <Link
          to="/boutique"
          className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          Voir toute la boutique
        </Link>
      </p>

      {/* Mention neutre, sans tutoiement ni vouvoiement : elle s'adresse aux
          enseignants depuis une page étudiante. */}
      <p className="mx-auto mt-4 max-w-2xl text-balance text-center text-sm text-ink-600">
        Enseignante ou enseignant? Le matériel existe aussi en version enseignant,
        avec des licences de groupe.{" "}
        <Link
          to="/enseignants"
          className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          Découvrir l'offre aux enseignants
        </Link>
      </p>
    </section>
  );
}

function CartePackage({ topic }: { topic: Topic }) {
  const produit = PRODUITS_PAR_TOPIC[topic.id];
  const contenu = [
    "Notes de cours complètes",
    topic.nbExercicesTotal
      ? `${nombre(topic.nbExercicesTotal)} exercices avec démarches détaillées`
      : "Exercices avec démarches détaillées",
    "Examens corrigés, avec grilles de correction",
    `Accès de ${DUREE_ACCES_MOIS}\u00a0mois : un seul paiement, aucun abonnement`,
  ];
  const rabais = typeof produit.prixOriginal === "number" && produit.prixOriginal > produit.prix;

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-brand-100 bg-white p-6 shadow-sm shadow-brand-900/5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${topic.couleur.accentBadge}`}>
          Package
        </span>
        <h3 className="mt-3 font-display text-2xl font-bold text-brand-900">{topic.name}</h3>
        <ul className="mt-4 space-y-2 text-sm text-ink-700">
          {contenu.map((ligne) => (
            <li key={ligne} className="flex items-start gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className={`mt-0.5 shrink-0 ${topic.couleur.accentTexte}`}
              >
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {ligne}
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 sm:text-right">
        <p className="font-display text-4xl font-bold text-brand-900">
          {produit.prix}&nbsp;$
        </p>
        {rabais ? (
          <p className="mt-1 text-sm text-ink-600">
            Prix de lancement · prix régulier{" "}
            <span className="line-through">{produit.prixOriginal}&nbsp;$</span>
          </p>
        ) : null}
        <Link
          to={produit.href}
          className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
        >
          Voir le package
        </Link>
        {!VENTE_OUVERTE && (
          <p className="mt-2 text-xs text-ink-600">L'achat en ligne ouvre bientôt.</p>
        )}
      </div>
    </div>
  );
}
