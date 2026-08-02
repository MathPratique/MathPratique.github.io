// Demande une URL signée au serveur, puis déclenche le téléchargement.
//
// Le navigateur ne connaît jamais le chemin du fichier dans le seau, et le
// seau refuse toute lecture directe (voir storage.rules). La seule voie est
// cette fonction, qui revérifie l'accès et la date avant de signer quoi que
// ce soit.

import { chargerFirebase } from "./config";

export type EchecTelechargement = "non-configure" | "non-connecte" | "refuse" | "indisponible";

export class ErreurTelechargement extends Error {
  readonly echec: EchecTelechargement;
  readonly detail: string | null;
  constructor(echec: EchecTelechargement, detail: string | null = null) {
    super(detail ?? echec);
    this.echec = echec;
    this.detail = detail;
  }
}

const MESSAGES: Record<EchecTelechargement, string> = {
  "non-configure": "Les téléchargements ne sont pas encore ouverts.",
  "non-connecte": "Connecte-toi pour télécharger tes documents.",
  refuse: "Ce document ne t'est pas accessible.",
  indisponible: "Le téléchargement a échoué. Réessaie dans quelques minutes.",
};

export function messageTelechargement(erreur: unknown): string {
  if (erreur instanceof ErreurTelechargement) {
    // Le serveur renvoie un message précis — « ta période d'accès est
    // terminée », par exemple. On le préfère au message générique : il dit à
    // l'étudiant ce qui se passe au lieu de le laisser deviner.
    return erreur.detail ?? MESSAGES[erreur.echec];
  }
  return MESSAGES.indisponible;
}

/**
 * Obtient le lien et lance le téléchargement.
 *
 * On navigue vers l'URL signée plutôt que d'utiliser `<a download>` : le
 * fichier vient d'un autre domaine, où l'attribut `download` est ignoré. Les
 * en-têtes du seau décident du nom et de la disposition.
 */
export async function telecharger(documentId: string): Promise<void> {
  const services = await chargerFirebase();
  if (!services) throw new ErreurTelechargement("non-configure");

  const { getAuth } = await import("firebase/auth");
  if (!getAuth().currentUser) throw new ErreurTelechargement("non-connecte");

  const { getFunctions, httpsCallable } = await import("firebase/functions");
  const fonctions = getFunctions(undefined, "northamerica-northeast1");

  try {
    const appeler = httpsCallable<{ documentId: string }, { url: string; titre: string }>(
      fonctions,
      "obtenirLienTelechargement"
    );
    const { data } = await appeler({ documentId });
    if (!data?.url) throw new ErreurTelechargement("indisponible");
    window.location.assign(data.url);
  } catch (erreur) {
    if (erreur instanceof ErreurTelechargement) throw erreur;
    const code =
      typeof erreur === "object" && erreur !== null && "code" in erreur
        ? String((erreur as { code: unknown }).code)
        : "";
    const message =
      typeof erreur === "object" && erreur !== null && "message" in erreur
        ? String((erreur as { message: unknown }).message)
        : null;
    if (code.endsWith("unauthenticated")) throw new ErreurTelechargement("non-connecte");
    if (code.endsWith("permission-denied") || code.endsWith("not-found")) {
      throw new ErreurTelechargement("refuse", message);
    }
    throw new ErreurTelechargement("indisponible");
  }
}
