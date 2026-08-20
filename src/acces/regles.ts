// ===========================================================================
//  Le modèle d'accès, et LA fonction qui le vérifie.
// ===========================================================================
//
// Ce fichier ne connaît ni Firebase, ni React, ni le réseau. Il ne manipule
// que des dates et des nombres. Deux raisons :
//
//   1. C'est la règle qui décide si quelqu'un a payé ou non. Elle doit être
//      lisible d'un seul tenant et vérifiable par des tests, sans émulateur
//      ni compte de service.
//   2. Le serveur devra appliquer exactement la même règle que le client.
//      Un module sans dépendance se réutilise tel quel dans une Cloud
//      Function ; un module qui importe le SDK client, non.
//
// ⚠️ Le contrôle d'accès affiché par le site n'est qu'un confort. La vraie
// barrière est côté serveur, au moment où le fichier est demandé. Ce qu'on
// calcule ici sert à montrer la bonne interface, pas à protéger le contenu.

import type { NiveauAcces } from "./documents.js";

/** Durée d'un accès acheté, en mois. Une seule définition pour tout le site. */
export const DUREE_ACCES_MOIS = 12;

/** Combien de jours avant la fin on commence à prévenir. */
export const RAPPELS_JOURS = [30, 7] as const;

/**
 * D'où vient l'accès.
 *
 * Les deux formes sont structurellement identiques : mêmes champs, mêmes
 * règles d'expiration. Seule la provenance change. C'est voulu — le jour où
 * les codes de classe existeront, il n'y aura ni migration ni deuxième
 * fonction de vérification à écrire.
 */
export type SourceAcces = "achat" | "code-classe";

export type Acces = {
  /** Identifiant du cours, p. ex. « calcul-differentiel ». */
  coursId: string;
  source: SourceAcces;
  /**
   * Niveau d'accès aux documents du catalogue. Chaque document déclare la
   * liste explicite des niveaux qui y ont droit — voir
   * `niveauxAutorises` dans documents.ts. Optionnel dans le type pour
   * supporter les documents Firestore antérieurs à l'ajout du champ ;
   * `niveauDe(acces)` dans telechargement.ts normalise l'absent, le vide
   * ou l'inconnu vers « restreint ».
   */
  niveau?: NiveauAcces;
  /** Millisecondes depuis l'époque. Neutre vis-à-vis de Firestore. */
  dateDebut: number;
  dateFin: number;
  /**
   * Vrai dès qu'au moins un document a été téléchargé. Sert uniquement à la
   * politique de remboursement : remboursement complet dans les 7 jours,
   * tant que rien n'a été téléchargé.
   */
  aTelecharge: boolean;
  /**
   * Référence de la transaction qui a ouvert l'accès. Pour un achat, c'est
   * l'identifiant de session Stripe : il sert de trace d'audit et de clé
   * d'idempotence côté webhook. Absent pour un code de classe.
   */
  reference?: string;
};

/** Ce que le site a besoin de savoir pour afficher la bonne chose. */
export type EtatAcces = {
  actif: boolean;
  /** Jours entiers restants. 0 le dernier jour, négatif une fois expiré. */
  joursRestants: number;
  /** Vrai quand il reste peu de temps — déclenche le bandeau de rappel. */
  bientotExpire: boolean;
  /** Le seuil franchi (30 ou 7), ou null. Sert à choisir le ton du message. */
  seuilRappel: number | null;
};

const JOUR_MS = 24 * 60 * 60 * 1000;

/**
 * Ajoute des mois à une date en gérant les fins de mois.
 *
 * `setMonth` déborde : le 31 janvier + 1 mois donne le 3 mars, parce que
 * février n'a pas de 31. Pour une date de fin d'accès, ce débordement
 * offrirait deux jours gratuits à qui achète le 31 — bénin, mais on préfère
 * une règle qu'on peut expliquer : on ramène au dernier jour du mois visé.
 */
export function ajouterMois(depuis: number, mois: number): number {
  const d = new Date(depuis);
  const jour = d.getDate();
  const cible = new Date(d);
  cible.setDate(1);
  cible.setMonth(cible.getMonth() + mois);
  const dernierJourDuMois = new Date(
    cible.getFullYear(),
    cible.getMonth() + 1,
    0
  ).getDate();
  cible.setDate(Math.min(jour, dernierJourDuMois));
  cible.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  return cible.getTime();
}

/** Construit un accès neuf. Utilisé par le webhook et par les codes de classe.
 *  `niveau` est requis pour forcer une décision explicite au point de
 *  création — le webhook Stripe passe « acheteur », un code de classe
 *  passera « restreint », un compte enseignant « enseignant ». Pas de
 *  défaut : le point d'entrée qui crée l'accès doit revendiquer le niveau. */
export function creerAcces(params: {
  coursId: string;
  source: SourceAcces;
  niveau: NiveauAcces;
  debut: number;
  reference?: string;
}): Acces {
  return {
    coursId: params.coursId,
    source: params.source,
    niveau: params.niveau,
    dateDebut: params.debut,
    dateFin: ajouterMois(params.debut, DUREE_ACCES_MOIS),
    aTelecharge: false,
    ...(params.reference ? { reference: params.reference } : {}),
  };
}

/**
 * LA fonction de vérification. Tout le site passe par elle — affichage du
 * bouton d'achat, bandeaux d'expiration, page « mon compte », et plus tard
 * la Cloud Function de téléchargement.
 *
 * `maintenant` est un paramètre plutôt qu'un appel à Date.now() : c'est ce
 * qui rend la règle testable, et ce qui permettra au serveur de passer sa
 * propre horloge plutôt que de faire confiance à celle du navigateur.
 */
export function verifierAcces(
  acces: Acces | null | undefined,
  maintenant: number = Date.now()
): EtatAcces {
  if (!acces) {
    return { actif: false, joursRestants: 0, bientotExpire: false, seuilRappel: null };
  }

  const actif = maintenant >= acces.dateDebut && maintenant < acces.dateFin;
  // Arrondi vers le haut : tant qu'il reste une fraction de journée, on
  // annonce un jour. Annoncer « 0 jour » à quelqu'un qui a encore accès
  // serait faux, et l'inverse le serait davantage.
  const joursRestants = Math.ceil((acces.dateFin - maintenant) / JOUR_MS);

  let seuilRappel: number | null = null;
  if (actif) {
    // Du seuil le plus serré au plus large : à 5 jours de la fin, c'est le
    // message « 7 jours » qui doit sortir, pas celui de 30.
    for (const seuil of [...RAPPELS_JOURS].sort((a, b) => a - b)) {
      if (joursRestants <= seuil) {
        seuilRappel = seuil;
        break;
      }
    }
  }

  return { actif, joursRestants, bientotExpire: seuilRappel !== null, seuilRappel };
}

/** Le remboursement est possible tant que rien n'a été téléchargé. */
export const DELAI_REMBOURSEMENT_JOURS = 7;

export function remboursementPossible(
  acces: Acces | null | undefined,
  maintenant: number = Date.now()
): boolean {
  if (!acces || acces.source !== "achat" || acces.aTelecharge) return false;
  return maintenant - acces.dateDebut <= DELAI_REMBOURSEMENT_JOURS * JOUR_MS;
}

/** Formatage québécois d'une date de fin, pour l'affichage. */
export function formaterDate(ms: number): string {
  return new Date(ms).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
