// ===========================================================================
//  Couche Firestore des devoirs : lecture par abonnement, enregistrement
//  par transaction.
// ===========================================================================
//
// Un document par cours, `devoirs/{coursId}` (voir regles.ts). Les pages ne
// connaissent que les deux fonctions exportées ici.
//
// ─── Pourquoi un abonnement ─────────────────────────────────────────────
// Ce que l'administrateur enregistre apparaît chez l'étudiant sans qu'il
// recharge la page.
//
// ─── Pourquoi une transaction ───────────────────────────────────────────
// `version` sert de verrou. Les règles refusent déjà toute écriture dont la
// version n'est pas « celle du document + 1 », mais un refus des règles
// arrive sous la forme d'un « permission-denied » muet. La transaction lit
// d'abord la version en place : si elle a bougé depuis le chargement de la
// page (enregistrement fait dans un autre onglet), on lève `ConflitVersion`,
// que l'éditeur sait expliquer.

import type { Firestore, Unsubscribe } from "firebase/firestore";
import { versDevoirs, type Devoirs, type Semaine } from "./regles";

/** L'enregistrement partait d'une version périmée. */
export class ConflitVersion extends Error {
  readonly versionEnPlace: number;
  constructor(versionEnPlace: number) {
    super(`Les devoirs ont été modifiés ailleurs (version ${versionEnPlace}).`);
    this.versionEnPlace = versionEnPlace;
  }
}

/**
 * Écoute les devoirs d'un cours. `sur` reçoit DEVOIRS_VIDES tant que le
 * document n'existe pas ; `surErreur` reçoit le code Firebase d'un refus
 * (« permission-denied » pour un compte qui n'y a pas droit).
 */
export async function abonnerDevoirs(
  db: Firestore,
  coursId: string,
  sur: (d: Devoirs) => void,
  surErreur: (code: string) => void,
): Promise<Unsubscribe> {
  const { doc, onSnapshot } = await import("firebase/firestore");
  return onSnapshot(
    doc(db, "devoirs", coursId),
    (snap) => sur(versDevoirs(snap.exists() ? snap.data() : null)),
    (err) => {
      const code = (err as { code?: string })?.code ?? String(err);
      console.warn(`[devoirs] lecture refusée (${code})`);
      surErreur(code);
    },
  );
}

/**
 * Enregistre toutes les semaines d'un coup. `versionLue` est la version
 * chargée par l'éditeur (0 si le document n'existait pas). Retourne la
 * nouvelle version.
 */
export async function enregistrerDevoirs(
  db: Firestore,
  coursId: string,
  semaines: Semaine[],
  versionLue: number,
): Promise<number> {
  const { doc, runTransaction, serverTimestamp } = await import("firebase/firestore");
  const ref = doc(db, "devoirs", coursId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const enPlace = snap.exists() ? versDevoirs(snap.data()).version : 0;
    if (enPlace !== versionLue) throw new ConflitVersion(enPlace);
    const version = enPlace + 1;
    tx.set(ref, {
      // Copie explicite des champs : rien d'autre ne part sur le fil.
      semaines: semaines.map((s) => ({
        id: s.id,
        titre: s.titre.trim(),
        date: s.date,
        note: s.note.trim(),
        exercices: s.exercices,
      })),
      version,
      dateMaj: serverTimestamp(),
    });
    return version;
  });
}
