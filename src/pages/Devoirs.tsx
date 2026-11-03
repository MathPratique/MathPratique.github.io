// La liste des exercices à faire d'un cours, pour ses étudiants.
//
// Lue en direct dans Firestore (`devoirs/{coursId}`) : ce que l'enseignant
// enregistre apparaît sans recharger. Réservée aux comptes dont l'accès au
// cours est actif et de niveau restreint, et à l'administrateur. Les règles
// Firestore refusent toute autre lecture ; ce que vérifie cette page ne sert
// qu'à afficher le bon message.
//
// Chaque exercice est nommé par son numéro du cahier, recalculé depuis le
// catalogue courant, et mène à sa carte sur la page Exercices.

import type { ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import AnimatedSection from "../components/ui/AnimatedSection";
import { useAuth } from "../firebase/useAuth";
import { useAcces } from "../firebase/useAcces";
import { MESSAGE_NON_CONFIGURE } from "../firebase/config";
import {
  UID_ADMINISTRATEUR,
  formaterDateDevoir,
  grouperParChapitre,
  idsInconnus,
  peutLireDevoirs,
  type Semaine,
} from "../devoirs/regles";
import { COURS_AVEC_DEVOIRS, lienCarte, type CoursDevoirs } from "../devoirs/cours";
import { useDevoirs } from "../devoirs/useDevoirs";
import { usePagePrivee } from "../devoirs/usePagePrivee";

function Message({ titre, children }: { titre: string; children?: ReactNode }) {
  return (
    <div className="container-page py-16 sm:py-20">
      <AnimatedSection className="mx-auto max-w-md text-center">
        <h1 className="text-balance text-3xl font-bold sm:text-4xl">{titre}</h1>
        {children && <div className="mt-4 text-base text-ink-600">{children}</div>}
      </AnimatedSection>
    </div>
  );
}

export default function Devoirs() {
  const { coursId = "" } = useParams();
  const cours = COURS_AVEC_DEVOIRS[coursId] ?? null;
  usePagePrivee(cours ? `Devoirs — ${cours.nom}` : "Devoirs");

  const { utilisateur, chargement, disponible } = useAuth();
  const acces = useAcces(coursId);
  const uid = utilisateur?.uid ?? null;
  const estAdmin = uid !== null && uid === UID_ADMINISTRATEUR;
  const autorise = cours !== null && peutLireDevoirs(uid, acces.acces);
  const { devoirs, erreur } = useDevoirs(coursId, uid, autorise);

  if (!cours) {
    return (
      <Message titre="Page introuvable">
        <Link to="/mon-compte" className="font-semibold text-brand-700">
          Retour à mon compte
        </Link>
      </Message>
    );
  }
  if (!disponible) return <Message titre="Devoirs">{MESSAGE_NON_CONFIGURE}</Message>;
  if (chargement) return <Message titre="Devoirs">Un instant…</Message>;
  if (!utilisateur) {
    return <Navigate to="/connexion" state={{ retour: `/devoirs/${coursId}` }} replace />;
  }
  if (!estAdmin && acces.chargement) return <Message titre="Devoirs">Un instant…</Message>;
  if (!autorise) {
    return (
      <Message titre="Devoirs">
        <p>Cette page est réservée aux étudiants du cours {cours.nom}.</p>
        <Link to="/mon-compte" className="mt-4 inline-block font-semibold text-brand-700">
          Voir mon compte
        </Link>
      </Message>
    );
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="mx-auto max-w-3xl">
        <span className="inline-block rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700">
          Devoirs
        </span>
        <h1 className="mt-4 text-balance text-3xl font-bold sm:text-4xl">{cours.nom}</h1>
        <p className="mt-3 text-sm text-ink-600">
          Les exercices à faire, semaine par semaine. Chaque numéro est celui du
          cahier et mène à l'exercice sur le site.
        </p>
        {estAdmin && (
          <Link
            to={`/devoirs/${coursId}/edition`}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Modifier les devoirs
          </Link>
        )}

        {erreur && (
          <p role="alert" className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            Impossible de charger les devoirs pour le moment.
          </p>
        )}
        {!erreur && devoirs === null && (
          <p className="mt-8 text-sm text-ink-600">Chargement des devoirs…</p>
        )}
        {devoirs?.semaines.length === 0 && (
          <p className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/40 p-6 text-sm text-ink-700">
            Aucun devoir pour l'instant.
          </p>
        )}

        <div className="mt-8 space-y-5">
          {devoirs?.semaines.map((s) => (
            <CarteSemaine key={s.id} semaine={s} cours={cours} estAdmin={estAdmin} />
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
}

function CarteSemaine({
  semaine,
  cours,
  estAdmin,
}: {
  semaine: Semaine;
  cours: CoursDevoirs;
  estAdmin: boolean;
}) {
  const groupes = grouperParChapitre(semaine.exercices, cours.index);
  const nombre = groupes.reduce((n, g) => n + g.exercices.length, 0);
  const inconnus = idsInconnus(semaine.exercices, cours.index);
  const date = formaterDateDevoir(semaine.date);

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-lg font-bold text-brand-900">{semaine.titre}</h2>
        <span className="text-xs text-ink-600">
          {nombre} exercice{nombre > 1 ? "s" : ""}
        </span>
      </div>
      {date && <p className="mt-0.5 text-sm text-ink-600">{date}</p>}
      {semaine.note && (
        <p className="mt-3 whitespace-pre-line text-sm text-ink-700">{semaine.note}</p>
      )}

      {groupes.map((g) => (
        <div key={g.chapitre} className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-600">
            Chapitre {g.chapitre}
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {g.exercices.map((e) => (
              <li key={e.id}>
                <Link
                  to={lienCarte(cours, g.chapitre, e.id)}
                  className="inline-flex items-baseline gap-1.5 rounded-full border border-brand-200 px-3 py-1 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  n° {e.numero}
                  <span className="text-xs font-normal text-ink-600">§{e.section}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Un exercice retiré de la banque est caché aux étudiants ; seul
          l'administrateur en est averti, pour le retirer de la liste. */}
      {estAdmin && inconnus.length > 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Absents du catalogue, cachés aux étudiants : {inconnus.join(", ")}
        </p>
      )}
    </section>
  );
}
