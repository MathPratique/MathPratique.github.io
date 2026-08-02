// ===========================================================================
//  Qui a le droit de télécharger quoi — logique pure.
// ===========================================================================
//
// Cette règle s'exécute SUR LE SERVEUR, à chaque demande de fichier. Elle ne
// s'exécute pas dans le navigateur pour décider : le client s'en sert
// seulement pour afficher un bouton actif ou grisé.
//
// C'est la différence entre une barrière et une pancarte. Le navigateur peut
// mentir sur tout : son horloge, son état, le code qu'il exécute. Le serveur
// refait donc le contrôle avec sa propre horloge, à l'instant où il s'apprête
// à signer une URL, et pas une seconde plus tôt.

import { verifierAcces, type Acces } from "./regles.js";

/** Un document téléchargeable du catalogue. */
export type Document = {
  id: string;
  coursId: string;
  titre: string;
  /** Chemin dans le seau privé. Jamais exposé au navigateur. */
  chemin: string;
  categorie: "notes" | "exercices" | "revision" | "examens";
};

export type Autorisation =
  | { autorise: true; chemin: string }
  | { autorise: false; raison: RefusTelechargement };

export type RefusTelechargement =
  | "document-inconnu"
  | "aucun-acces"
  | "acces-expire"
  | "mauvais-cours";

export const MESSAGES_REFUS: Record<RefusTelechargement, string> = {
  "document-inconnu": "Ce document n'existe pas.",
  "aucun-acces": "Tu n'as pas accès à ce cours.",
  "acces-expire":
    "Ta période d'accès est terminée. Les téléchargements sont désactivés, mais les documents que tu as déjà téléchargés restent à toi.",
  "mauvais-cours": "Ce document appartient à un cours auquel tu n'as pas accès.",
};

/**
 * Décide si une demande de téléchargement aboutit.
 *
 * @param document   le document demandé, ou null s'il n'est pas au catalogue
 * @param acces      l'accès de l'utilisateur au cours, ou null
 * @param maintenant l'horloge du SERVEUR
 *
 * L'ordre des refus est délibéré : on répond « ce document n'existe pas »
 * avant de parler d'accès. Un identifiant inventé ne doit pas permettre de
 * découvrir quels documents existent.
 */
export function deciderTelechargement(
  document: Document | null,
  acces: Acces | null,
  maintenant: number
): Autorisation {
  if (!document) return { autorise: false, raison: "document-inconnu" };
  if (!acces) return { autorise: false, raison: "aucun-acces" };
  if (acces.coursId !== document.coursId) {
    return { autorise: false, raison: "mauvais-cours" };
  }

  const etat = verifierAcces(acces, maintenant);
  if (!etat.actif) return { autorise: false, raison: "acces-expire" };

  return { autorise: true, chemin: document.chemin };
}

/**
 * Durée de validité d'une URL signée.
 *
 * Quinze minutes : assez pour lancer un téléchargement, même sur une
 * connexion lente, trop peu pour qu'une adresse copiée dans un forum serve
 * encore le lendemain. Une URL signée échappe à tout contrôle une fois
 * émise — c'est sa nature — donc la seule protection est sa brièveté.
 */
export const VALIDITE_LIEN_MINUTES = 15;
