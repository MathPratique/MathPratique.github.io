// Page de retour après paiement Stripe.
//
// L'accès est accordé par le webhook, jamais par cette page — voir
// functions/src/index.ts. La page LIT l'accès et attend son arrivée. Trois
// états possibles :
//
//   1. En attente   — webhook pas encore reçu (ou pas encore propagé) :
//                     spinner, message rassurant, on rafraîchit toutes les
//                     3 s pendant TIMEOUT_MS.
//   2. Actif        — accès trouvé et valide : date de fin en clair + liens.
//   3. Timeout      — plus de TIMEOUT_MS écoulés sans accès : message avec
//                     l'adresse de contact. On NE dit PAS « tu n'as pas
//                     accès » : le paiement peut être réussi, le retard vient
//                     du webhook. On demande de contacter le site.

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AnimatedSection from "../components/ui/AnimatedSection";
import { EMAIL_CONTACT } from "../data/site";
import { useAuth } from "../firebase/useAuth";
import { lireAcces } from "../firebase/acces";
import { formaterDate, verifierAcces, type Acces } from "../acces/regles";
import { getProductById } from "../data/products";

const COURS_ID = "calcul-differentiel";
const POLL_MS = 3000; // toutes les 3 s
const TIMEOUT_MS = 60_000; // après 60 s, on affiche un message d'aide

type Etat =
  | { phase: "chargement" }
  | { phase: "attente"; secondesEcoulees: number }
  | { phase: "actif"; acces: Acces }
  | { phase: "timeout" };

export default function AchatConfirme() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("produit");
  const product = productId ? getProductById(productId) : null;
  const { utilisateur, chargement: chargementAuth, disponible } = useAuth();

  const [etat, setEtat] = useState<Etat>({ phase: "chargement" });

  useEffect(() => {
    // Attendre que l'auth soit résolue avant de décider quoi que ce soit.
    if (chargementAuth || !disponible) return;

    // Utilisateur non connecté : rien à interroger. On garde `chargement`,
    // le rendu affichera l'invite de connexion.
    if (!utilisateur) return;

    const uid = utilisateur.uid;
    const debut = Date.now();
    let annule = false;

    const verifierMaintenant = async () => {
      try {
        const acces = await lireAcces(uid, COURS_ID);
        const etat = verifierAcces(acces, Date.now());
        if (annule) return;
        if (etat.actif && acces) {
          setEtat({ phase: "actif", acces });
          return true; // stop
        }
      } catch {
        // Silencieux : la prochaine tentative retentera. On ne veut pas
        // afficher une erreur pendant l'attente normale.
      }
      const ecoule = Date.now() - debut;
      if (ecoule >= TIMEOUT_MS) {
        if (!annule) setEtat({ phase: "timeout" });
        return true;
      }
      if (!annule) {
        setEtat({ phase: "attente", secondesEcoulees: Math.floor(ecoule / 1000) });
      }
      return false;
    };

    // Première tentative immédiate — un webhook rapide n'oblige pas à
    // attendre 3 s avant d'afficher la confirmation.
    let intervalle: ReturnType<typeof setInterval> | null = null;
    verifierMaintenant().then((fini) => {
      if (annule || fini) return;
      intervalle = setInterval(async () => {
        const fini = await verifierMaintenant();
        if (fini && intervalle) clearInterval(intervalle);
      }, POLL_MS);
    });

    return () => {
      annule = true;
      if (intervalle) clearInterval(intervalle);
    };
  }, [chargementAuth, disponible, utilisateur]);

  // -------------------------------------------------------------------------

  return (
    <div className="container-page py-16 sm:py-20">
      <AnimatedSection className="mx-auto max-w-xl text-center">
        {chargementAuth && <EtatVerification />}

        {!chargementAuth && !utilisateur && <InviteConnexion />}

        {!chargementAuth && utilisateur && etat.phase === "chargement" && <EtatVerification />}

        {etat.phase === "attente" && <EtatAttente secondes={etat.secondesEcoulees} />}

        {etat.phase === "actif" && <EtatActif acces={etat.acces} nomCours={product?.courseName} />}

        {etat.phase === "timeout" && <EtatTimeout nomCours={product?.courseName} />}
      </AnimatedSection>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  Sous-composants — un par phase, pour rester lisible
// ═══════════════════════════════════════════════════════════════════════

function IconeCoche() {
  return (
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
  );
}

function Spinner() {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="animate-spin text-brand-600"
        aria-hidden="true"
      >
        <path d="M3 12a9 9 0 0115-6.7" />
      </svg>
    </div>
  );
}

function EtatVerification() {
  return (
    <>
      <Spinner />
      <h1 className="mt-6 text-balance text-3xl font-bold sm:text-4xl">
        On vérifie ton accès…
      </h1>
    </>
  );
}

function InviteConnexion() {
  return (
    <>
      <IconeCoche />
      <h1 className="mt-6 text-balance text-3xl font-bold sm:text-4xl">
        Merci pour ton achat !
      </h1>
      <p className="mt-4 text-balance text-base text-ink-600">
        Ton paiement est enregistré. Connecte-toi pour voir la date de fin
        exacte de ton accès et commencer à télécharger tes documents.
      </p>
      <Link
        to="/connexion"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
      >
        Se connecter
      </Link>
    </>
  );
}

function EtatAttente({ secondes }: { secondes: number }) {
  return (
    <>
      <Spinner />
      <h1 className="mt-6 text-balance text-3xl font-bold sm:text-4xl">
        Merci pour ton achat !
      </h1>
      <p className="mt-4 text-balance text-base text-ink-600">
        Ton paiement est reçu. On active ton accès — ça prend quelques
        secondes. On rafraîchit automatiquement, tu n'as rien à faire.
      </p>
      <p className="mt-2 text-xs text-ink-600" aria-live="polite">
        Vérification en cours ({secondes} s)…
      </p>
    </>
  );
}

function EtatActif({ acces, nomCours }: { acces: Acces; nomCours: string | undefined }) {
  return (
    <>
      <IconeCoche />
      <h1 className="mt-6 text-balance text-4xl font-bold sm:text-5xl">
        Ton accès est ouvert !
      </h1>
      {nomCours ? (
        <p className="mt-4 text-balance text-lg text-ink-600">
          Bienvenue dans <strong>{nomCours}</strong>. Ton accès se termine le{" "}
          <strong className="text-brand-900">{formaterDate(acces.dateFin)}</strong>.
        </p>
      ) : (
        <p className="mt-4 text-balance text-lg text-ink-600">
          Ton accès se termine le{" "}
          <strong className="text-brand-900">{formaterDate(acces.dateFin)}</strong>.
        </p>
      )}

      <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50/40 p-6 text-left">
        <h2 className="font-display text-lg font-bold text-brand-900">
          Prochaines étapes
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-ink-700">
          <EtapeItem numero={1}>
            Un reçu Stripe t'a été envoyé par courriel. Vérifie ton dossier
            « courriels indésirables » juste au cas.
          </EtapeItem>
          <EtapeItem numero={2}>
            Retrouve tes documents et ton quiz personnalisé depuis la page{" "}
            <Link to="/mon-compte" className="font-semibold text-brand-700 underline">
              Mon compte
            </Link>
            .
          </EtapeItem>
          <EtapeItem numero={3}>Commence à étudier — tu es prêt !</EtapeItem>
        </ul>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          to="/mon-compte"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700"
        >
          Voir mon matériel
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          to="/practice"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          Continuer à pratiquer
        </Link>
      </div>
    </>
  );
}

function EtatTimeout({ nomCours }: { nomCours: string | undefined }) {
  return (
    <>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700" aria-hidden="true">
          <path d="M12 8v4l3 3M12 22a10 10 0 100-20 10 10 0 000 20z" />
        </svg>
      </div>
      <h1 className="mt-6 text-balance text-3xl font-bold sm:text-4xl">
        Ton paiement est enregistré
      </h1>
      <p className="mt-4 text-balance text-base text-ink-600">
        L'activation prend plus de temps que prévu. Ton achat n'est pas perdu —
        Stripe l'a bien reçu. Écris-nous à{" "}
        <a href={`mailto:${EMAIL_CONTACT}`} className="font-semibold text-brand-700 underline">
          {EMAIL_CONTACT}
        </a>{" "}
        {nomCours ? `en mentionnant « ${nomCours} », ` : ""}on ouvre ton accès
        à la main dans les meilleurs délais.
      </p>
      <Link
        to="/mon-compte"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
      >
        Voir mon compte
      </Link>
    </>
  );
}

function EtapeItem({ numero, children }: { numero: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
        {numero}
      </span>
      <span>{children}</span>
    </li>
  );
}
