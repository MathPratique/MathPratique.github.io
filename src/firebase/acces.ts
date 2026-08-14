// ===========================================================================
//  Lecture des accès dans Firestore.
// ===========================================================================
//
// La règle métier vit dans src/acces/regles.ts, sans dépendance. Ce fichier
// ne fait que la traduction entre Firestore et cette règle : lire, convertir
// les Timestamp en millisecondes, rien de plus. Aucune décision d'accès n'est
// prise ici.
//
// Structure retenue :
//
//     utilisateurs/{uid}/acces/{coursId}
//
// Une sous-collection plutôt qu'une carte dans le document utilisateur.
// Trois raisons :
//   - le webhook écrit un seul document, sans lire ni fusionner le reste ;
//   - les règles de sécurité s'écrivent par document, donc plus simplement ;
//   - un accès révoqué se supprime sans toucher au profil.
//
// ⚠️ Ce que le navigateur lit ici sert à AFFICHER la bonne interface. Un
// utilisateur peut modifier ce que son navigateur exécute. La barrière réelle
// est la Cloud Function de téléchargement, qui refait la vérification avec sa
// propre horloge avant de signer la moindre URL.

import { chargerFirebase } from "./config";
import { assurerAuthPrete } from "./authPrete";
import type { Acces, SourceAcces } from "../acces/regles";

/** Le seul cours en vente pour l'instant. */
export const COURS_EN_VENTE = "calcul-differentiel";

/**
 * Firestore rend des Timestamp ; la règle métier veut des nombres.
 *
 * On reconnaît un Timestamp à sa méthode `toMillis` plutôt qu'avec
 * `instanceof` : ça évite d'importer la classe, donc de tirer le SDK dans le
 * bundle principal, et ça reste vrai côté serveur où c'est le SDK Admin qui
 * fournit l'objet.
 */
function versMs(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (
    typeof v === "object" &&
    v !== null &&
    "toMillis" in v &&
    typeof (v as { toMillis: unknown }).toMillis === "function"
  ) {
    const ms = (v as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

/**
 * Convertit un document Firestore en `Acces`, ou null s'il est inutilisable.
 *
 * Un document mal formé est traité comme une absence d'accès, jamais comme un
 * accès valide. C'est le sens de prudence à avoir ici : en cas de doute, on
 * refuse.
 */
export function versAcces(coursId: string, data: unknown): Acces | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;

  const dateDebut = versMs(d.dateDebut);
  const dateFin = versMs(d.dateFin);
  if (dateDebut === null || dateFin === null) return null;
  if (dateFin <= dateDebut) return null;

  const source: SourceAcces = d.source === "code-classe" ? "code-classe" : "achat";

  return {
    coursId,
    source,
    dateDebut,
    dateFin,
    aTelecharge: d.aTelecharge === true,
    ...(typeof d.reference === "string" ? { reference: d.reference } : {}),
  };
}

/** L'accès d'un utilisateur à un cours donné, ou null. */
export async function lireAcces(uid: string, coursId: string): Promise<Acces | null> {
  const services = await chargerFirebase();
  if (!services) return null;
  // Synchronise le token Auth avec Firestore SDK avant la lecture. Sans
  // ça, une requête juste après restauration de session peut partir sans
  // token → règles refusent (voir authPrete.ts).
  await assurerAuthPrete(services.auth);
  const { doc, getDoc } = await import("firebase/firestore");
  try {
    const snap = await getDoc(doc(services.db, "utilisateurs", uid, "acces", coursId));
    return snap.exists() ? versAcces(coursId, snap.data()) : null;
  } catch (err) {
    const code = (err as { code?: string })?.code ?? String(err);
    // eslint-disable-next-line no-console
    console.warn(
      `[acces] Lecture refusée (${code}) pour utilisateurs/${uid}/acces/${coursId}`,
    );
    throw err;
  }
}

/** Tous les accès d'un utilisateur, pour la page « mon compte ». */
export async function lireTousLesAcces(uid: string): Promise<Acces[]> {
  const services = await chargerFirebase();
  if (!services) return [];
  await assurerAuthPrete(services.auth);
  const { collection, getDocs } = await import("firebase/firestore");
  try {
    const snap = await getDocs(collection(services.db, "utilisateurs", uid, "acces"));
    return snap.docs
      .map((d) => versAcces(d.id, d.data()))
      .filter((a): a is Acces => a !== null);
  } catch (err) {
    const code = (err as { code?: string })?.code ?? String(err);
    // eslint-disable-next-line no-console
    console.warn(
      `[acces] Liste refusée (${code}) pour utilisateurs/${uid}/acces`,
    );
    throw err;
  }
}
