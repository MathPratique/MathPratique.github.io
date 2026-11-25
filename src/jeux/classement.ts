// ===========================================================================
//  Classement des jeux — couche Firestore.
// ===========================================================================
//
// Un document par joueur et par jeu : classements/{jeu}/entrees/{uid} =
// { pseudo, temps (secondes), date }. C'est le meilleur temps du joueur.
// Les règles Firestore (bloc « Classements des jeux ») n'acceptent qu'une
// entrée à soi, un pseudonyme de 1 à 20 caractères et un temps de 3 minutes
// à 10 heures ; une mise à jour ne peut qu'améliorer le temps, ou garder le
// même temps et la même date pour changer de pseudonyme.
//
// Les pages ne connaissent que les trois fonctions exportées ici.

import type { DocumentData, Firestore } from "firebase/firestore";
import { TAILLE_TOP, arrondirTemps, tempsValide, verifierPseudo } from "./regles";

export type LigneClassement = { pseudo: string; temps: number; date: number | null; moi: boolean };
export type MonEntree = { pseudo: string; temps: number; rang: number | null };
export type DonneesClassement = { top: LigneClassement[]; moi: MonEntree | null };

export type RaisonRefus = "pseudo-refuse" | "temps-invalide" | "sans-temps" | "non-connecte" | "erreur";
export type ResultatEcriture = { ok: true } | { ok: false; raison: RaisonRefus; message: string };

/** Lecture prudente d'un document : un champ inattendu ne casse rien. */
function versEntree(data: DocumentData | undefined): { pseudo: string; temps: number; date: number | null } | null {
  if (!data || typeof data.pseudo !== "string" || typeof data.temps !== "number") return null;
  const date = data.date && typeof data.date.toMillis === "function" ? data.date.toMillis() : null;
  return { pseudo: data.pseudo, temps: data.temps, date };
}

/** Le top 10 du jeu, et l'entrée du joueur connecté (avec son rang) s'il en a une. */
export async function lireClassement(db: Firestore, jeu: string, uid: string | null): Promise<DonneesClassement> {
  const { collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, where } = await import(
    "firebase/firestore"
  );
  const entrees = collection(db, "classements", jeu, "entrees");
  const instantane = await getDocs(query(entrees, orderBy("temps"), limit(TAILLE_TOP)));
  const top: LigneClassement[] = [];
  for (const d of instantane.docs) {
    const e = versEntree(d.data());
    if (e) top.push({ ...e, moi: d.id === uid });
  }
  let moi: MonEntree | null = null;
  if (uid) {
    const s = await getDoc(doc(entrees, uid));
    const e = s.exists() ? versEntree(s.data()) : null;
    if (e) {
      const devant = await getCountFromServer(query(entrees, where("temps", "<", e.temps)));
      moi = { pseudo: e.pseudo, temps: e.temps, rang: devant.data().count + 1 };
    }
  }
  return { top, moi };
}

/**
 * Inscrit un temps. Sans `pseudo`, le joueur garde celui de son entrée.
 * Un temps moins bon que le meilleur ne remplace rien (mais un nouveau
 * pseudonyme est quand même enregistré).
 */
export async function inscrireTemps(
  db: Firestore,
  jeu: string,
  uid: string,
  temps: unknown,
  pseudo?: unknown,
): Promise<ResultatEcriture> {
  if (!tempsValide(temps)) {
    return { ok: false, raison: "temps-invalide", message: "Ce temps ne peut pas être inscrit au classement." };
  }
  const { doc, getDoc, serverTimestamp, setDoc } = await import("firebase/firestore");
  const ref = doc(db, "classements", jeu, "entrees", uid);
  const s = await getDoc(ref);
  const existante = s.exists() ? versEntree(s.data()) : null;
  let pseudoFinal = existante?.pseudo ?? null;
  if (pseudo !== undefined) {
    const verdict = verifierPseudo(pseudo);
    if (!verdict.ok) return { ok: false, raison: "pseudo-refuse", message: verdict.message };
    pseudoFinal = verdict.pseudo;
  }
  if (!pseudoFinal) return { ok: false, raison: "pseudo-refuse", message: "Choisis d’abord un pseudonyme." };
  const t = arrondirTemps(temps);
  if (!existante || t < existante.temps) {
    await setDoc(ref, { pseudo: pseudoFinal, temps: t, date: serverTimestamp() });
  } else if (pseudoFinal !== existante.pseudo) {
    // Même temps, même date : seul le pseudonyme change (les règles l'exigent)
    await setDoc(ref, { pseudo: pseudoFinal, temps: existante.temps, date: s.get("date") });
  }
  return { ok: true };
}

/** Change le pseudonyme d'une entrée existante, sans toucher au temps. */
export async function changerPseudo(db: Firestore, jeu: string, uid: string, pseudo: unknown): Promise<ResultatEcriture> {
  const verdict = verifierPseudo(pseudo);
  if (!verdict.ok) return { ok: false, raison: "pseudo-refuse", message: verdict.message };
  const { doc, getDoc, setDoc } = await import("firebase/firestore");
  const ref = doc(db, "classements", jeu, "entrees", uid);
  const s = await getDoc(ref);
  const existante = s.exists() ? versEntree(s.data()) : null;
  if (!existante) return { ok: false, raison: "sans-temps", message: "Inscris d’abord un temps au classement." };
  if (existante.pseudo !== verdict.pseudo) {
    await setDoc(ref, { pseudo: verdict.pseudo, temps: existante.temps, date: s.get("date") });
  }
  return { ok: true };
}
