// ===========================================================================
//  Initialisation de Firebase — facultative, et chargée à la demande.
// ===========================================================================
//
// Le site est déployé sur GitHub Pages et fonctionnait sans compte avant ce
// chantier. Il doit continuer à fonctionner tant que le projet Firebase
// n'existe pas : les exercices gratuits, la boutique, l'aperçu et la page
// enseignants ne dépendent d'aucune authentification.
//
// Deux conséquences, toutes deux appliquées ici :
//
//   1. **Si la configuration est absente, on ne plante pas, on désactive.**
//      `firebaseEstConfigure` vaut false, les écrans de compte affichent un
//      message honnête, et rien d'autre ne bouge.
//
//   2. **Le SDK n'est jamais dans le bundle principal.** Importé
//      statiquement, il ajoutait 511 ko à chaque visite — pour une
//      fonctionnalité que personne ne peut utiliser tant que les comptes ne
//      sont pas ouverts. Tous les imports sont donc dynamiques, et seuls les
//      types sont importés statiquement : `import type` disparaît à la
//      compilation, il ne coûte rien.
//
// Les clés d'un projet Firebase côté client ne sont PAS des secrets : elles
// partent dans le bundle, c'est prévu. Ce qui protège les données, ce sont
// les règles Firestore (voir firestore.rules) et les vérifications faites
// dans les Cloud Functions. La clé secrète Stripe, elle, ne doit jamais
// approcher ce fichier.

import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Functions } from "firebase/functions";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Vrai seulement si toutes les variables sont présentes. Une configuration
 * à moitié remplie est plus dangereuse qu'une absente : elle laisserait
 * croire que l'authentification marche.
 */
export const firebaseEstConfigure = Object.values(config).every(
  (v) => typeof v === "string" && v.length > 0
);

export type ServicesFirebase = { auth: Auth; db: Firestore; functions: Functions };

let promesse: Promise<ServicesFirebase | null> | null = null;

// La région doit correspondre à celle codée dans functions/src/index.ts
// (`onCall({ region: "northamerica-northeast1" })`). Sans ça, `httpsCallable`
// pointerait sur `us-central1` par défaut et ne trouverait rien.
const REGION_FONCTIONS = "northamerica-northeast1";

/**
 * Charge le SDK et initialise l'application, une seule fois.
 *
 * En mode `npm run dev` (`import.meta.env.DEV`), les trois services se
 * branchent automatiquement sur les émulateurs locaux — sinon le site
 * appellerait Firebase en production, ce qui court-circuite complètement
 * l'infrastructure de test.
 *
 * Renvoie null si la configuration est absente — les appelants doivent
 * traiter ce cas, jamais supposer que Firebase est là.
 */
export function chargerFirebase(): Promise<ServicesFirebase | null> {
  if (!firebaseEstConfigure) return Promise.resolve(null);
  if (!promesse) {
    promesse = (async () => {
      const [
        { initializeApp },
        { getAuth, connectAuthEmulator },
        {
          initializeFirestore,
          persistentLocalCache,
          persistentMultipleTabManager,
          connectFirestoreEmulator,
        },
        { getFunctions, connectFunctionsEmulator },
      ] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/firestore"),
        import("firebase/functions"),
      ]);
      const app = initializeApp(config as Required<typeof config>);
      const auth = getAuth(app);
      // Cache persistant IndexedDB, avec un gestionnaire multi-onglets. Utile
      // pour la progression : navigation entre pages sans re-lecture, et les
      // writes hors-ligne sont mises en file d'attente pour partir à la
      // reconnexion. Le multi-tab manager gère le cas où l'étudiant a la page
      // Exercices ouverte dans un onglet et le quiz dans un autre.
      const db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
      const functions = getFunctions(app, REGION_FONCTIONS);

      if (import.meta.env.DEV) {
        // Adresses des émulateurs Firebase (voir firebase.json). Le drapeau
        // `disableWarnings` retire la bannière rouge « Running in emulator
        // mode » sur Auth — elle est utile pour signaler qu'on n'est pas en
        // prod, mais son affichage n'est pas configurable en français et
        // brise la mise en page. Le mode dev est déjà signalé par l'URL.
        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
        connectFirestoreEmulator(db, "127.0.0.1", 8080);
        connectFunctionsEmulator(functions, "127.0.0.1", 5001);
      }

      return { auth, db, functions };
    })();
  }
  return promesse;
}

/**
 * Message unique affiché partout où l'authentification est requise mais
 * indisponible. Une seule formulation, pour ne pas dire trois choses
 * différentes selon l'écran.
 */
export const MESSAGE_NON_CONFIGURE =
  "Les comptes ne sont pas encore ouverts. Le matériel reste consultable en aperçu gratuit, sans inscription.";
