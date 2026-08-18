// ===========================================================================
//  État d'authentification, disponible partout dans l'application.
// ===========================================================================
//
// Un seul abonnement à onAuthStateChanged, monté une fois à la racine. Les
// composants lisent l'état par `useAuth()` et ne parlent jamais au SDK
// directement — ça garde un seul endroit à regarder quand la connexion se
// comporte mal, et un seul endroit à changer si le fournisseur change.
//
// Tous les imports du SDK sont dynamiques (voir config.ts) : sans projet
// Firebase configuré, rien de tout cela n'est téléchargé par le visiteur.
// Seul `import type` subsiste, et il disparaît à la compilation.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { chargerFirebase, firebaseEstConfigure } from "./config";
import { ContexteAuthentification, type ContexteAuth } from "./contexte";


/** Récupère les services, ou lève une erreur reconnaissable par l'interface. */
async function exigerServices() {
  const services = await chargerFirebase();
  if (!services) throw Object.assign(new Error("auth indisponible"), { code: "auth-indisponible" });
  return services;
}

/**
 * URL de retour après un clic sur un lien envoyé par Firebase Auth
 * (réinitialisation de mot de passe, vérification d'adresse). Firebase la
 * met derrière un bouton « Continuer » sur sa page hébergée — sans ce
 * réglage, l'étudiant termine sa réinitialisation sur `<projectId>.firebaseapp.com`
 * et ne retrouve jamais le chemin vers `mathpratique.ca`. Le domaine
 * doit figurer dans les « Authorized domains » de la console Firebase
 * Authentication, sinon le SDK refuse d'envoyer le courriel.
 */
const URL_RETOUR_APRES_ACTION = "https://mathpratique.ca/connexion";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<User | null>(null);
  // Sans Firebase, on ne charge rien : l'état est connu tout de suite.
  const [chargement, setChargement] = useState(firebaseEstConfigure);

  useEffect(() => {
    if (!firebaseEstConfigure) return;
    let desabonner: (() => void) | undefined;
    let annule = false;

    (async () => {
      const services = await chargerFirebase();
      if (!services || annule) return;
      const { onAuthStateChanged } = await import("firebase/auth");
      if (annule) return;
      desabonner = onAuthStateChanged(services.auth, (u) => {
        setUtilisateur(u);
        setChargement(false);
      });
    })().catch(() => {
      // Le SDK n'a pas pu être chargé — réseau coupé, blocage par une
      // extension. On sort de l'état « chargement » plutôt que de laisser
      // l'interface tourner indéfiniment.
      if (!annule) setChargement(false);
    });

    return () => {
      annule = true;
      desabonner?.();
    };
  }, []);

  const valeur = useMemo<ContexteAuth>(
    () => ({
      utilisateur,
      chargement,
      disponible: firebaseEstConfigure,
      connexionCourriel: async (courriel, motDePasse) => {
        const { auth } = await exigerServices();
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        await signInWithEmailAndPassword(auth, courriel, motDePasse);
      },
      inscriptionCourriel: async (courriel, motDePasse) => {
        const { auth } = await exigerServices();
        const {
          createUserWithEmailAndPassword,
          sendEmailVerification,
        } = await import("firebase/auth");
        const cred = await createUserWithEmailAndPassword(auth, courriel, motDePasse);
        // Envoyer le courriel de vérification, sans bloquer si ça échoue :
        // la création du compte a réussi, l'utilisateur peut se connecter.
        // Un service temporairement indisponible ne doit pas transformer
        // l'inscription en erreur. Les comptes non vérifiés sont
        // récupérables ensuite via `scripts/lister-comptes-non-verifies.js`.
        try {
          await sendEmailVerification(cred.user, { url: URL_RETOUR_APRES_ACTION });
        } catch (err) {
          const code = (err as { code?: string })?.code ?? String(err);
          // eslint-disable-next-line no-console
          console.warn(`[auth] sendEmailVerification a échoué (${code}) — compte créé sans envoi`);
        }
      },
      connexionGoogle: async () => {
        const { auth } = await exigerServices();
        const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
        await signInWithPopup(auth, new GoogleAuthProvider());
      },
      reinitialiserMotDePasse: async (courriel) => {
        const { auth } = await exigerServices();
        const { sendPasswordResetEmail } = await import("firebase/auth");
        // `actionCodeSettings.url` = destination du bouton « Continuer »
        // affiché par Firebase après la réinitialisation. Sans ce réglage,
        // l'étudiant reste bloqué sur la page hébergée Firebase et ne
        // retrouve plus le chemin vers le site — le scénario d'un dimanche
        // soir sans aide disponible.
        await sendPasswordResetEmail(auth, courriel, { url: URL_RETOUR_APRES_ACTION });
      },
      deconnexion: async () => {
        const { auth } = await exigerServices();
        const { signOut } = await import("firebase/auth");
        await signOut(auth);
      },
    }),
    [utilisateur, chargement]
  );

  return (
    <ContexteAuthentification.Provider value={valeur}>
      {children}
    </ContexteAuthentification.Provider>
  );
}
