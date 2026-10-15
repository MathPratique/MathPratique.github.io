// ===========================================================================
//  Le quota d'analyses — les écritures Firestore
// ===========================================================================
//
// La décision vit dans src/notes/analyse.ts, en fonctions pures et testées.
// Ici, il n'y a que la transaction : lire le compteur, demander la décision,
// écrire. Aucune règle ne doit apparaître dans ce fichier — si une condition
// s'y glisse un jour, c'est qu'elle a été écrite sans test.
//
// La collection n'est accessible qu'au serveur : les règles Firestore
// refusent tout par défaut, et le navigateur n'a aucune raison d'y toucher.
// Il n'y lirait d'ailleurs rien d'utile — le nombre d'analyses restantes est
// renvoyé dans la réponse de la fonction.

import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import {
  deciderAnalyse,
  quotaApres,
  quotaRembourse,
  type DecisionAnalyse,
  type QuotaStocke,
} from "../../../src/notes/analyse.js";
import type { NiveauAcces } from "../../../src/acces/documents.js";

export const COLLECTION_QUOTAS = "quotasAnalyse";

/**
 * Réserve une analyse, ou explique pourquoi elle est refusée.
 *
 * La réservation a lieu AVANT l'appel au modèle, dans une transaction :
 * deux onglets qui lancent une analyse en même temps ne doivent pas passer
 * tous les deux au travers du dernier jeton. Ce qui est réservé est rendu
 * par `rembourser` si l'analyse échoue.
 */
export async function reserverAnalyse(
  db: Firestore,
  uid: string,
  params: { accesActif: boolean; niveau: NiveauAcces | null; jour: string },
): Promise<DecisionAnalyse> {
  const ref = db.collection(COLLECTION_QUOTAS).doc(uid);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const quota = snap.data() as QuotaStocke | undefined;
    const decision = deciderAnalyse({ ...params, quota });
    if (decision.autorise) {
      tx.set(
        ref,
        { ...quotaApres(quota, params.jour, decision.essaiGratuit), majLe: FieldValue.serverTimestamp() },
        { merge: true },
      );
    }
    return decision;
  });
}

/**
 * Rend l'analyse réservée. Une panne de notre côté — modèle injoignable,
 * réponse illisible — ne doit rien coûter à l'étudiant.
 */
export async function rembourserAnalyse(
  db: Firestore,
  uid: string,
  jour: string,
  essaiGratuit: boolean,
): Promise<void> {
  const ref = db.collection(COLLECTION_QUOTAS).doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const quota = snap.data() as QuotaStocke | undefined;
    tx.set(
      ref,
      { ...quotaRembourse(quota, jour, essaiGratuit), majLe: FieldValue.serverTimestamp() },
      { merge: true },
    );
  });
}
