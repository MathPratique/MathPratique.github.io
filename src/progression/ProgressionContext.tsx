// ===========================================================================
//  Contexte React qui centralise la progression d'un cours pour toutes les
//  vues (page Exercices, quiz, méli-mélo).
// ===========================================================================
//
// Un seul provider en haut de l'app garantit :
//   - une seule souscription onSnapshot (pas N souscriptions par carte)
//   - un seul pousseur d'écritures (pas de writes en double)
//   - un état PARTAGÉ : un exercice coché depuis le quiz est coché sur la
//     page Exercices sans re-lecture réseau.
//
// L'accès est vérifié par useAcces (règle serveur `verifierAcces`). Sans
// accès valide, le contexte reste en état "aucun-acces" et les composants
// consommateurs ne rendent aucun contrôle de progression. La règle Firestore
// est la vraie barrière — l'affichage n'est qu'un confort.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Firestore, Unsubscribe } from "firebase/firestore";
import { chargerFirebase } from "../firebase/config";
import { assurerAuthPrete } from "../firebase/authPrete";
import { useAuth } from "../firebase/useAuth";
import { useAcces } from "../firebase/useAcces";
import { PROGRESSION_VIDE, type Progression } from "./regles";
import { abonnerProgression, creerPousseur } from "./store";

type Statut =
  | "desactive"     // Firebase non configuré — on n'utilise pas la feature
  | "chargement"    // Auth ou premier snapshot en cours
  | "aucun-acces"   // Pas d'accès valide (jamais acheté OU expiré)
  | "actif";        // Accès valide, données prêtes

type Contexte = {
  statut: Statut;
  progression: Progression;
  /** Fait bouger un flag. Optimiste : l'UI change immédiatement. */
  basculer(champ: "completes" | "marques", id: string): void;
};

const CTX = createContext<Contexte | null>(null);

/**
 * Envelopper l'app une seule fois avec ce provider, en passant le coursId
 * courant. Aujourd'hui il n'y a qu'un cours (calcul-differentiel) ; le jour
 * où d'autres cours existent, on instancie un provider par cours ou on
 * étend la clé du contexte.
 */
export function ProgressionProvider({
  coursId,
  children,
}: {
  coursId: string;
  children: ReactNode;
}) {
  const { utilisateur, chargement: chargementAuth, disponible } = useAuth();
  const acces = useAcces(coursId);
  const uid = utilisateur?.uid ?? null;

  const [progression, setProgression] = useState<Progression>(PROGRESSION_VIDE);
  const [snapshotRecu, setSnapshotRecu] = useState(false);

  // Le pousseur vit dans une ref : sa création est asynchrone (import
  // dynamique Firebase), et on ne veut pas déclencher un rerender à
  // chaque toggle en le rangeant dans un state.
  const pousseurRef = useRef<Awaited<ReturnType<typeof creerPousseur>> | null>(null);

  // Le progression locale doit rester lisible dans les gestionnaires de
  // fermeture qui ne captureront pas de dépendance React à jour.
  const progressionRef = useRef(progression);
  progressionRef.current = progression;

  const actif = disponible && !!uid && acces.etat.actif;

  // ── Souscription au snapshot Firestore ────────────────────────────────
  useEffect(() => {
    if (!actif || !uid) return;

    let annule = false;
    let desabonner: Unsubscribe | null = null;
    let dbRef: Firestore | null = null;

    (async () => {
      const services = await chargerFirebase();
      if (annule || !services) return;
      dbRef = services.db;
      // Synchronise le token Auth avec Firestore SDK avant d'ouvrir la
      // souscription. Sans ça, l'onSnapshot juste après restauration de
      // session peut partir sans token → règles refusent (voir authPrete.ts).
      await assurerAuthPrete(services.auth);
      if (annule) return;
      const off = await abonnerProgression(services.db, uid, coursId, (p) => {
        if (annule) return;
        setProgression(p);
        setSnapshotRecu(true);
      });
      if (annule) {
        off();
        return;
      }
      desabonner = off;

      // Le pousseur est instancié en parallèle. Firebase gère le partage
      // des connexions, donc pas de doublon.
      pousseurRef.current = await creerPousseur(services.db, uid, coursId);
    })();

    return () => {
      annule = true;
      if (desabonner) desabonner();
      const p = pousseurRef.current;
      pousseurRef.current = null;
      if (p) {
        // Flush avant de détruire : ne pas perdre les toggles en attente
        // parce que l'utilisateur navigue vers une autre page.
        p.flushMaintenant().finally(() => p.detruire());
      }
      // On garde `progression` en mémoire : si l'utilisateur revient sur
      // la même page, le premier rendu sera correct avant même le snapshot.
      void dbRef;
    };
  }, [actif, uid, coursId]);

  // ── Flush sur fermeture ────────────────────────────────────────────────
  useEffect(() => {
    if (!actif) return;
    const flush = () => {
      pousseurRef.current?.flushMaintenant().catch(() => {});
    };
    // `visibilitychange` : l'onglet passe en arrière-plan — moment sûr
    // pour flusher, car le SDK a le temps de finir la requête si l'onglet
    // revient. `pagehide`/`beforeunload` : dernière chance avant la
    // fermeture ; la requête part dans la file offline si elle n'aboutit
    // pas à temps.
    const surVisibilite = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", surVisibilite);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", surVisibilite);
      window.removeEventListener("pagehide", flush);
    };
  }, [actif]);

  const basculer = useCallback(
    (champ: "completes" | "marques", id: string) => {
      // Optimistic UI : on met à jour l'état local IMMÉDIATEMENT. Le
      // snapshot Firestore viendra confirmer plus tard (ou corriger, si
      // l'écriture est refusée — auquel cas la case reviendra à son état
      // serveur, ce qui est correct).
      setProgression((p) => {
        const suivant = { ...p, [champ]: { ...p[champ] } };
        const dejaLa = id in p[champ];
        if (dejaLa) {
          delete suivant[champ][id];
          pousseurRef.current?.pousser({ champ, id, ajouter: false });
        } else {
          // Timestamp local temporaire ; le snapshot serveur écrasera avec
          // le serverTimestamp. La valeur n'a d'importance que via `in`.
          suivant[champ][id] = Date.now();
          pousseurRef.current?.pousser({ champ, id, ajouter: true });
        }
        return suivant;
      });
    },
    [],
  );

  const statut: Statut = useMemo(() => {
    if (!disponible) return "desactive";
    if (chargementAuth || acces.chargement) return "chargement";
    if (!acces.etat.actif) return "aucun-acces";
    return snapshotRecu ? "actif" : "chargement";
  }, [disponible, chargementAuth, acces.chargement, acces.etat.actif, snapshotRecu]);

  const valeur = useMemo(
    () => ({ statut, progression, basculer }),
    [statut, progression, basculer],
  );

  return <CTX.Provider value={valeur}>{children}</CTX.Provider>;
}

/**
 * Hook consommateur. À l'intérieur d'un `ProgressionProvider`.
 * Retourne un contexte vide et inerte hors provider — utile pour un
 * composant qui peut être rendu à un endroit sans progression (aperçu
 * gratuit, page publique) sans devoir peupler d'un provider factice.
 */
export function useProgression(): Contexte {
  return (
    useContext(CTX) ?? {
      statut: "desactive",
      progression: PROGRESSION_VIDE,
      basculer: () => {},
    }
  );
}
