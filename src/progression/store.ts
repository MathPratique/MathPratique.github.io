// ===========================================================================
//  Couche Firestore pour la progression : lecture par abonnement, écritures
//  batchées avec debounce.
// ===========================================================================
//
// Ce module encapsule tout ce qui touche à Firestore. Le hook React
// (`useProgression`) ne connaît que les fonctions exportées ici, et un
// éventuel serveur pourrait les remplacer par du fetch REST sans que le
// reste du code s'en aperçoive.
//
// ─── Pourquoi le debounce ───────────────────────────────────────────────
// Un étudiant qui coche dix exercices d'affilée génère UNE seule écriture,
// pas dix. On accumule les toggles dans un tampon local, et un timer les
// pousse en un `setDoc` avec structure imbriquée quand la salve se calme
// (2 secondes sans nouveau clic).
//
// ─── Pourquoi la structure imbriquée { completes: { id: ts } } ─────────
// Le SDK Firebase 12 traite `setDoc(ref, { "completes.EXO-1": ... },
// { merge: true })` comme la création d'un champ top-level LITTÉRALEMENT
// nommé « completes.EXO-1 » — le point n'est PAS interprété comme chemin
// nested (contrairement à updateDoc). La règle firestore.rules
// `formeValide()` exige `keys().hasOnly(['completes', 'marques',
// 'dateMaj', 'version'])`, et refuse donc l'écriture avec clé aplatie.
// La structure imbriquée fusionne au bon niveau : les clés top-level
// sont bien celles autorisées, et Firestore descend dans `completes`
// pour ajouter/retirer les entrées enfant. Verrouillé par le test
// tests/regles-progression.test.mjs.
//
// ─── Flush à la fermeture ───────────────────────────────────────────────
// `visibilitychange` (l'onglet passe en arrière-plan) et `beforeunload`
// (l'onglet ferme) déclenchent un flush immédiat. Firestore met la requête
// dans sa file locale ; grâce à la persistance IndexedDB, elle part à la
// prochaine ouverture même si le navigateur a été fermé.
//
// ─── Erreurs jamais avalées ─────────────────────────────────────────────
// Le premier fix de ce module utilisait `.catch(() => {})`, ce qui a
// masqué le bogue de la dot-notation en production pendant deux jours.
// Aujourd'hui les erreurs de `setDoc` sont journalisées via console.warn
// avec leur code et remontées à l'appelant via le callback `onErreur`,
// pour que le contexte React rollback l'état local optimiste (sinon le
// bouton se contentait de « s'éteindre » sans raison visible).
//
// ─── Cohérence multi-vues ───────────────────────────────────────────────
// Tous les composants s'abonnent au même `onSnapshot` via le contexte.
// Un toggle dans le quiz met à jour la case dans la page Exercices d'un
// autre onglet en temps réel.

import type {
  Firestore,
  Unsubscribe,
  FieldValue,
  Timestamp,
} from "firebase/firestore";
import {
  PROGRESSION_VIDE,
  VERSION_PROGRESSION,
  type Progression,
} from "./regles";

const DEBOUNCE_MS = 2000;

type ChampProgression = "completes" | "marques";

/** Ce qu'on demande — un flag ajouté (true) ou retiré (false). */
export type Delta = { champ: ChampProgression; id: string; ajouter: boolean };

/** Info remontée au consommateur quand une écriture Firestore échoue. */
export type ErreurEcriture = {
  /** Les deltas qui étaient dans le flush refusé — sert au rollback local. */
  deltas: Delta[];
  /** Code Firebase, p. ex. « permission-denied », « unauthenticated ». */
  code: string;
  message: string;
};

/**
 * Écoute le doc de progression et rappelle `sur` à chaque changement.
 * Renvoie une fonction de désabonnement.
 *
 * Le doc peut ne pas exister (utilisateur qui n'a jamais rien coché) —
 * dans ce cas on rappelle avec PROGRESSION_VIDE, pas avec null, pour que
 * l'UI cesse d'afficher son squelette de chargement.
 */
export async function abonnerProgression(
  db: Firestore,
  uid: string,
  coursId: string,
  sur: (p: Progression) => void,
): Promise<Unsubscribe> {
  const { doc, onSnapshot } = await import("firebase/firestore");
  const ref = doc(db, "utilisateurs", uid, "progression", coursId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        sur(PROGRESSION_VIDE);
        return;
      }
      const data = snap.data();
      sur({
        completes: (data.completes ?? {}) as Record<string, Timestamp>,
        marques: (data.marques ?? {}) as Record<string, Timestamp>,
        dateMaj: data.dateMaj,
        version: data.version ?? VERSION_PROGRESSION,
      });
    },
    // Une lecture qui échoue (règles trop strictes, réseau coupé) ne doit
    // pas laisser l'UI en chargement infini. On rappelle avec un doc vide
    // et laissera le hook signaler l'état par ailleurs.
    () => sur(PROGRESSION_VIDE),
  );
}

/**
 * Crée un pousseur d'écritures batchées. Le pousseur retourné est appelé à
 * chaque toggle ; il accumule et flushe après une pause. `flushMaintenant`
 * force l'envoi (pour beforeunload / changement d'onglet).
 *
 * `options.onErreur` est appelé quand un flush échoue — le contexte React
 * l'utilise pour rollback l'état local optimiste et rester cohérent avec
 * le serveur, qui n'a rien accepté.
 */
export async function creerPousseur(
  db: Firestore,
  uid: string,
  coursId: string,
  options: { onErreur?: (e: ErreurEcriture) => void } = {},
): Promise<{
  pousser(delta: Delta): void;
  flushMaintenant(): Promise<void>;
  detruire(): void;
}> {
  const {
    doc,
    setDoc,
    serverTimestamp,
    deleteField,
  } = await import("firebase/firestore");
  const ref = doc(db, "utilisateurs", uid, "progression", coursId);
  const { onErreur } = options;

  // Tampon : le DERNIER delta par (champ, id) depuis le dernier flush.
  // Un même exo cliqué deux fois avant flush → net zéro (mais on garde
  // la trace du dernier état voulu, ce qui suffit).
  const tampon = new Map<string, Delta>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let vivant = true;

  // `:` plutôt que `.` pour éviter toute confusion visuelle avec un
  // chemin Firestore (qui utilise le point). C'est une clé de Map
  // interne, jamais envoyée sur le fil.
  const cle = (d: Delta) => `${d.champ}:${d.id}`;

  async function flush(): Promise<void> {
    if (tampon.size === 0) return;
    // Sauver les deltas AVANT de vider — pour que `onErreur` sache ce
    // qui a échoué et que le contexte puisse rollback ces mêmes toggles.
    const deltas = Array.from(tampon.values());
    tampon.clear();

    // Regrouper par champ pour bâtir une structure imbriquée compatible
    // avec la règle formeValide() — cf. commentaire en tête du fichier.
    const parChamp: Record<ChampProgression, Record<string, FieldValue>> = {
      completes: {},
      marques: {},
    };
    for (const d of deltas) {
      parChamp[d.champ][d.id] = d.ajouter
        ? (serverTimestamp() as FieldValue)
        : (deleteField() as FieldValue);
    }

    const modif: Record<string, unknown> = {
      version: VERSION_PROGRESSION,
      dateMaj: serverTimestamp(),
    };
    // N'inclure un champ que s'il porte au moins un delta — évite un
    // « completes: {} » inutile qui écrase les entrées existantes ? Non,
    // avec merge:true un objet vide ne casse rien. Mais c'est plus propre
    // et le paquet est plus petit sur le fil.
    if (Object.keys(parChamp.completes).length > 0) modif.completes = parChamp.completes;
    if (Object.keys(parChamp.marques).length > 0) modif.marques = parChamp.marques;

    try {
      await setDoc(ref, modif, { merge: true });
    } catch (err) {
      const code = (err as { code?: string })?.code ?? String(err);
      const message = (err as Error)?.message ?? "";
      // Journalisation VISIBLE — l'avalement silencieux à cet endroit
      // avait masqué le bogue de la structure aplatie deux jours en
      // production. On ne recommence pas.
      // eslint-disable-next-line no-console
      console.warn(`[progression] écriture refusée (${code}): ${message}`);
      if (onErreur) {
        try {
          onErreur({ deltas, code, message });
        } catch (errCallback) {
          // eslint-disable-next-line no-console
          console.error("[progression] onErreur a levé une exception :", errCallback);
        }
      }
      // On ne re-throw pas : `flush` gère elle-même (log + callback).
      // L'appelant — timer de debounce ou flushMaintenant — n'a rien
      // à faire de plus.
    }
  }

  function pousser(delta: Delta): void {
    if (!vivant) return;
    tampon.set(cle(delta), delta);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      // `flush` ne rejette plus (elle handle tout en interne) — ce catch
      // est un filet de sécurité contre une régression future qui la
      // ferait rejeter à nouveau. Ne pas retirer sans re-lire flush.
      flush().catch(() => {});
    }, DEBOUNCE_MS);
  }

  async function flushMaintenant(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    await flush();
  }

  function detruire(): void {
    vivant = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    tampon.clear();
  }

  return { pousser, flushMaintenant, detruire };
}
