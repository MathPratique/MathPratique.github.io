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
// pousse en un `updateDoc` avec dot-notation quand la salve se calme
// (2 secondes sans nouveau clic).
//
// ─── Flush à la fermeture ───────────────────────────────────────────────
// `visibilitychange` (l'onglet passe en arrière-plan) et `beforeunload`
// (l'onglet ferme) déclenchent un flush immédiat. Firestore met la requête
// dans sa file locale ; grâce à la persistance IndexedDB, elle part à la
// prochaine ouverture même si le navigateur a été fermé.
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
type Delta = { champ: ChampProgression; id: string; ajouter: boolean };

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
 */
export async function creerPousseur(
  db: Firestore,
  uid: string,
  coursId: string,
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

  // Tampon : les MODIFS depuis le dernier flush.
  //   - true  → ajouter (avec serverTimestamp)
  //   - false → retirer (avec deleteField)
  const tampon = new Map<string, boolean>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let vivant = true;

  const cle = (d: Delta) => `${d.champ}.${d.id}`;

  async function flush(): Promise<void> {
    if (tampon.size === 0) return;
    // On construit l'objet AVANT de vider le tampon : si le setDoc rejette,
    // on peut remettre les entrées dedans (pas encore fait — le SDK gère
    // déjà la file d'attente offline).
    const modif: Record<string, unknown> = { version: VERSION_PROGRESSION };
    for (const [k, ajouter] of tampon) {
      modif[k] = ajouter ? serverTimestamp() : (deleteField() as FieldValue);
    }
    modif["dateMaj"] = serverTimestamp();
    tampon.clear();
    // `setDoc(..., {merge: true})` accepte les chemins pointés et crée le
    // doc à sa première écriture. Idempotent : rejouer la même écriture ne
    // fait rien de mal.
    await setDoc(ref, modif, { merge: true });
  }

  function pousser(delta: Delta): void {
    if (!vivant) return;
    tampon.set(cle(delta), delta.ajouter);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      // On avale les erreurs ici : elles seront visibles côté Firebase
      // (règles ou réseau). Le tampon a déjà été vidé — le SDK a la main.
      flush().catch(() => {});
    }, DEBOUNCE_MS);
  }

  async function flushMaintenant(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    try {
      await flush();
    } catch {
      /* même remarque */
    }
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
