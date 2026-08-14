// ===========================================================================
//  assurerAuthPrete — synchronise l'état Auth avec les SDK consommateurs.
// ===========================================================================
//
// Cas d'usage : au montage d'une page qui lit Firestore ou appelle une
// Function, `onAuthStateChanged` a peut-être restauré `auth.currentUser`
// mais les autres SDK (Firestore, Functions) n'ont pas encore reçu la
// notification `onIdTokenChanged`. Résultat : la requête part sans token
// attaché → `permission-denied` côté règles Firestore, ou
// `unauthenticated` côté Callable.
//
// `getIdToken()` force la génération/rafraîchissement d'un token pour le
// currentUser. Ça déclenche `onIdTokenChanged`, ce que les autres SDK
// écoutent — la synchronisation est garantie avant que la requête suivante
// parte.
//
// Contrat : cette fonction ne DOIT PAS lever. Un échec de `getIdToken`
// (réseau coupé, token révoqué, quota) est journalisé mais laissé passer :
// le caller doit pouvoir tomber sur son propre gestionnaire d'erreur
// (permission-denied côté serveur) plutôt que sur un crash React.

import type { Auth } from "firebase/auth";

export async function assurerAuthPrete(auth: Auth): Promise<void> {
  const user = auth.currentUser;
  if (!user) return; // Aucun compte connecté — rien à préparer.
  try {
    await user.getIdToken();
  } catch (err) {
    const code = (err as { code?: string })?.code ?? String(err);
    // eslint-disable-next-line no-console
    console.warn(
      `[auth] getIdToken a échoué (${code}) — la lecture suivante partira ` +
        `sans token synchronisé. Le serveur refusera si l'accès requiert le token.`,
    );
  }
}
