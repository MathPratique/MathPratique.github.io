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
        const { createUserWithEmailAndPassword } = await import("firebase/auth");
        await createUserWithEmailAndPassword(auth, courriel, motDePasse);
      },
      connexionGoogle: async () => {
        const { auth } = await exigerServices();
        const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
        await signInWithPopup(auth, new GoogleAuthProvider());
      },
      reinitialiserMotDePasse: async (courriel) => {
        const { auth } = await exigerServices();
        const { sendPasswordResetEmail } = await import("firebase/auth");
        await sendPasswordResetEmail(auth, courriel);
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
