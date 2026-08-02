import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AnimatedSection from "../components/ui/AnimatedSection";
import { useAuth } from "../firebase/useAuth";
import { MESSAGE_NON_CONFIGURE } from "../firebase/config";
import { lireTousLesAcces } from "../firebase/acces";
import {
  formaterDate,
  remboursementPossible,
  verifierAcces,
  DELAI_REMBOURSEMENT_JOURS,
  type Acces,
} from "../acces/regles";
import { DOCUMENTS, LIBELLES_CATEGORIES } from "../acces/documents";
import { telecharger, messageTelechargement } from "../firebase/telechargement";
import { EMAIL_CONTACT } from "../data/site";
import { getProductById } from "../data/products";

/** Le nom affichable d'un cours, sans exposer son identifiant technique. */
function nomDuCours(coursId: string): string {
  return getProductById(`package-${coursId}`)?.courseName ?? coursId;
}

export default function MonCompte() {
  const { utilisateur, chargement, disponible, deconnexion } = useAuth();
  const navigate = useNavigate();
  const [acces, setAcces] = useState<Acces[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!utilisateur) return;
    let annule = false;
    lireTousLesAcces(utilisateur.uid)
      .then((a) => !annule && setAcces(a))
      .catch(() => !annule && setErreur("Impossible de charger tes accès pour le moment."));
    return () => {
      annule = true;
    };
  }, [utilisateur]);

  if (!disponible) {
    return (
      <div className="container-page py-16 sm:py-20">
        <AnimatedSection className="mx-auto max-w-md text-center">
          <h1 className="text-balance text-3xl font-bold sm:text-4xl">Mon compte</h1>
          <p className="mt-4 text-base text-ink-600">{MESSAGE_NON_CONFIGURE}</p>
        </AnimatedSection>
      </div>
    );
  }

  if (chargement) {
    return (
      <div className="container-page py-16">
        <p className="text-center text-sm text-ink-600">Un instant…</p>
      </div>
    );
  }

  if (!utilisateur) {
    return <Navigate to="/connexion" state={{ retour: "/mon-compte" }} replace />;
  }

  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="mx-auto max-w-3xl">
        <h1 className="text-balance text-3xl font-bold sm:text-4xl">Mon compte</h1>
        <p className="mt-2 text-sm text-ink-600">{utilisateur.email}</p>

        <h2 className="mt-10 font-display text-xl font-bold text-brand-900">Mes accès</h2>

        {erreur && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {erreur}
          </p>
        )}

        {acces === null && !erreur && (
          <p className="mt-4 text-sm text-ink-600">Chargement…</p>
        )}

        {acces?.length === 0 && (
          <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/40 p-6">
            <p className="text-sm text-ink-700">
              Tu n'as pas encore d'accès à un cours.
            </p>
            <Link
              to="/boutique"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Voir le matériel
            </Link>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {acces?.map((a) => (
            <CarteAcces key={a.coursId} acces={a} />
          ))}
        </div>

        <button
          type="button"
          onClick={async () => {
            await deconnexion();
            navigate("/", { replace: true });
          }}
          className="mt-12 inline-flex items-center justify-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
        >
          Se déconnecter
        </button>
      </AnimatedSection>
    </div>
  );
}

/**
 * Les documents téléchargeables, groupés par catégorie.
 *
 * Cinquante-huit fichiers : une liste à plat serait illisible, et les
 * catégories repliées évitent d'écraser la page. Aucun contrôle d'accès
 * ici — la liste s'affiche dès que l'accès est actif, et c'est la Cloud
 * Function qui refuse si elle ne l'est plus au moment du clic.
 */
function ListeDocuments({ coursId }: { coursId: string }) {
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const documents = DOCUMENTS.filter((d) => d.coursId === coursId);
  const categories = [...new Set(documents.map((d) => d.categorie))];

  async function obtenir(id: string) {
    setErreur(null);
    setEnCours(id);
    try {
      await telecharger(id);
    } catch (err) {
      setErreur(messageTelechargement(err));
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="mt-5 border-t border-brand-100 pt-5">
      <h4 className="font-display text-sm font-bold text-brand-900">
        Tes documents ({documents.length})
      </h4>

      {erreur && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {erreur}
        </p>
      )}

      {categories.map((categorie) => (
        <details key={categorie} className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">
            {LIBELLES_CATEGORIES[categorie]}{" "}
            <span className="font-normal text-ink-600">
              ({documents.filter((d) => d.categorie === categorie).length})
            </span>
          </summary>
          <ul className="mt-2 space-y-1">
            {documents
              .filter((d) => d.categorie === categorie)
              .map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => obtenir(d.id)}
                    disabled={enCours !== null}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-700 transition-colors hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0 text-brand-600">
                      <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
                    </svg>
                    {enCours === d.id ? "Préparation du lien…" : d.titre}
                  </button>
                </li>
              ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

function CarteAcces({ acces }: { acces: Acces }) {
  const etat = verifierAcces(acces);
  const remboursable = remboursementPossible(acces);

  return (
    <div
      className={`rounded-2xl border p-6 ${
        etat.actif ? "border-brand-100 bg-white" : "border-ink-600/20 bg-ink-600/5"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-brand-900">
          {nomDuCours(acces.coursId)}
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            etat.actif ? "bg-accent-500/15 text-accent-600" : "bg-ink-600/10 text-ink-700"
          }`}
        >
          {etat.actif ? "Actif" : "Expiré"}
        </span>
      </div>

      {/* La date de fin, en clair. C'est l'information que l'étudiant vient
          chercher ici, elle ne se met pas en petits caractères. */}
      <p className="mt-3 text-sm text-ink-700">
        {etat.actif ? (
          <>
            Ton accès se termine le{" "}
            <strong className="text-brand-900">{formaterDate(acces.dateFin)}</strong>
            {etat.joursRestants <= 60 && <> — dans {etat.joursRestants} jours.</>}
          </>
        ) : (
          <>
            Ton accès s'est terminé le{" "}
            <strong className="text-ink-900">{formaterDate(acces.dateFin)}</strong>. La
            consultation en ligne et les téléchargements sont désactivés.
          </>
        )}
      </p>

      {acces.source === "code-classe" && (
        <p className="mt-2 text-xs text-ink-600">Accès ouvert par un code de classe.</p>
      )}

      {etat.bientotExpire && (
        <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Il te reste {etat.joursRestants} jours. C'est le bon moment pour
          télécharger les documents que tu veux garder : ils resteront à toi
          après la fin de l'accès.
        </p>
      )}

      {etat.actif && <ListeDocuments coursId={acces.coursId} />}

      {remboursable && (
        <p className="mt-3 text-xs text-ink-600">
          Remboursement possible dans les {DELAI_REMBOURSEMENT_JOURS} jours suivant
          l'achat, tant qu'aucun document n'a été téléchargé. Écris à{" "}
          <a href={`mailto:${EMAIL_CONTACT}`} className="font-semibold text-brand-700">
            {EMAIL_CONTACT}
          </a>
          .
        </p>
      )}
    </div>
  );
}
