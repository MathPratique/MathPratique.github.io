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
import { documentVisible, type Document, type NiveauAcces } from "./documents.js";

export type Autorisation =
  | { autorise: true; chemin: string }
  | { autorise: false; raison: RefusTelechargement };

export type RefusTelechargement =
  | "document-inconnu"
  | "aucun-acces"
  | "acces-expire"
  | "mauvais-cours"
  | "document-restreint";

export const MESSAGES_REFUS: Record<RefusTelechargement, string> = {
  "document-inconnu": "Ce document n'existe pas.",
  "aucun-acces": "Tu n'as pas accès à ce cours.",
  "acces-expire":
    "Ta période d'accès est terminée. Les téléchargements sont désactivés, mais les documents que tu as déjà téléchargés restent à toi.",
  "mauvais-cours": "Ce document appartient à un cours auquel tu n'as pas accès.",
  "document-restreint": "Ce document n'est pas accessible à ton niveau d'accès.",
};

/**
 * Lit le niveau d'un accès, avec pour défaut le plus restrictif possible.
 *
 * Trois entrées produisent « restreint » :
 *   - le champ `niveau` absent (accès Firestore antérieur à l'ajout du champ) ;
 *   - une chaîne vide (mauvaise écriture côté outil admin) ;
 *   - une valeur inconnue (typo, ancien schéma, champ renommé).
 *
 * Un accès mal configuré doit donner TROP PEU, jamais trop — un utilisateur
 * qui devrait voir un document et ne le voit pas peut le demander ; l'inverse
 * signifie qu'un document est fuité.
 */
export function niveauDe(acces: Acces): NiveauAcces {
  if (
    acces.niveau === "restreint" ||
    acces.niveau === "acheteur" ||
    acces.niveau === "enseignant"
  ) {
    return acces.niveau;
  }
  return "restreint";
}

/**
 * Décide si une demande de téléchargement aboutit.
 *
 * @param document   le document demandé, ou null s'il n'est pas au catalogue
 * @param acces      l'accès de l'utilisateur au cours, ou null
 * @param maintenant l'horloge du SERVEUR
 *
 * L'ordre des refus est délibéré :
 *
 *   1. `document-inconnu`   — avant tout. Un identifiant inventé ne doit pas
 *                             permettre de découvrir quels documents existent.
 *   2. `aucun-acces`        — même sans accès, on ne dit pas si le document
 *                             existe (déjà écarté ci-dessus).
 *   3. `mauvais-cours`      — l'accès concerne un autre cours.
 *   4. `document-restreint` — le niveau de l'accès ne permet pas ce document
 *                             précis. Placé APRÈS la vérification de cours
 *                             (un accès qui ne concerne pas le bon cours doit
 *                             remonter cette raison-là, pas une histoire de
 *                             niveau), et AVANT `acces-expire` (le niveau ne
 *                             change pas selon la date, un document qu'on ne
 *                             pouvait pas voir hier reste hors de portée).
 *   5. `acces-expire`       — dernier check : le droit d'usage dans le temps.
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

  if (!documentVisible(document, niveauDe(acces))) {
    return { autorise: false, raison: "document-restreint" };
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
