// ===========================================================================
//  Analyse de notes — les décisions, sans entrées-sorties
// ===========================================================================
//
// Même découpage que src/acces/telechargement.ts : tout ce qui décide vit
// ici, en fonctions pures, et la Cloud Function ne fait que lire Firestore,
// appeler ces fonctions, puis écrire. C'est ce qui rend les règles testables
// sans émulateur — et c'est aussi la raison pour laquelle l'horloge est
// toujours un paramètre, jamais `Date.now()`.
//
// Rien ici ne touche au contenu de l'étudiant : les limites portent sur des
// tailles, jamais sur du texte.

// Extension « .js » comme dans src/acces/ : ces modules sont partagés avec
// les Cloud Functions, dont la résolution ESM l'exige.
import type { NiveauAcces } from "../acces/documents.js";

// ─── Les constantes de politique ──────────────────────────────────────────
//
// Groupées en tête pour qu'un ajustement ne demande pas de lire le reste.

/** Qui a droit à l'analyse de notes. Liste explicite, pas une hiérarchie. */
export const NIVEAUX_ANALYSE_NOTES: NiveauAcces[] = ["restreint", "acheteur", "enseignant"];

/** Analyses par jour et par personne, pour un détenteur d'accès. */
export const QUOTA_QUOTIDIEN = 10;

/**
 * Analyses offertes à quelqu'un qui a un compte mais pas d'accès — une
 * fois par compte, sans recharge. Pas « par jour » : c'est un aperçu, pas
 * un service.
 */
export const ESSAIS_SANS_ACCES = 1;

export const MAX_CARACTERES = 30_000;
/** Pour un PDF. */
export const MAX_OCTETS_FICHIER = 10 * 1024 * 1024;
export const MAX_PAGES_PDF = 20;

/**
 * Pour une photo, la borne est plus basse : l'API plafonne une image à
 * 10 Mo une fois encodée en base64, et le base64 pèse les 4/3 de
 * l'original. 7 Mio d'image font 9,3 Mio encodés, sous la barre. En
 * pratique l'interface réduira les photos avant l'envoi (une photo de
 * cellulaire passe sous le mégaoctet) ; ceci n'est que le filet.
 */
export const MAX_OCTETS_IMAGE = 7 * 1024 * 1024;

/**
 * Les types que l'API lit (documentation vérifiée le 2026-10-15) : PDF,
 * JPEG, PNG, WebP. Le GIF aussi, mais personne ne prend ses notes en GIF.
 */
export const TYPES_FICHIER_ACCEPTES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * Le HEIC, format par défaut des photos d'iPhone, n'est PAS lu par l'API.
 * On le reconnaît pour répondre autre chose que « format non reconnu » —
 * l'étudiant n'a souvent aucune idée du format de ses photos.
 */
const TYPES_HEIC = ["image/heic", "image/heif"];

export type TypeFichier = (typeof TYPES_FICHIER_ACCEPTES)[number];

// ─── L'entrée ─────────────────────────────────────────────────────────────

export type EntreeAnalyse = {
  coursId: string;
  texte?: string;
  fichier?: {
    mediaType: string;
    /** Taille du fichier décodé, en octets. */
    octets: number;
    /** Nombre de pages — seulement pour un PDF, compté avant l'appel. */
    pages?: number;
  };
};

export type RaisonRefus =
  | "non-connecte"
  | "cours-inconnu"
  | "entree-vide"
  | "entree-double"
  | "texte-trop-long"
  | "fichier-vide"
  | "fichier-trop-gros"
  | "image-trop-grosse"
  | "type-non-accepte"
  | "heic-non-lu"
  | "pdf-trop-long"
  | "pdf-illisible"
  | "niveau-non-autorise"
  | "essai-gratuit-epuise"
  | "quota-atteint";

/**
 * Ce qu'on dit à l'étudiant. Tutoiement, et jamais de jargon interne : ces
 * phrases sont lues dans une carte d'erreur, pas dans un journal.
 */
export const MESSAGES_REFUS: Record<RaisonRefus, string> = {
  "non-connecte": "Crée un compte gratuit pour analyser tes notes — c'est l'affaire d'une minute.",
  "cours-inconnu": "L'analyse de notes n'est pas encore offerte pour ce cours.",
  "entree-vide": "Colle le texte de tes notes ou choisis un fichier avant de lancer l'analyse.",
  "entree-double": "Envoie soit du texte, soit un fichier, pas les deux en même temps.",
  "texte-trop-long": `Ton texte dépasse ${MAX_CARACTERES.toLocaleString("fr-CA")} caractères. Garde la partie que tu veux réviser.`,
  "fichier-vide": "Ce fichier est vide.",
  "fichier-trop-gros": `Ton PDF dépasse ${MAX_OCTETS_FICHIER / (1024 * 1024)} Mo. Garde seulement les pages de la matière à réviser.`,
  "image-trop-grosse": `Ta photo dépasse ${MAX_OCTETS_IMAGE / (1024 * 1024)} Mo. Reprends-la en résolution normale, ou fais une capture d'écran.`,
  "type-non-accepte": "Format non reconnu. Envoie un PDF ou une photo (JPG, PNG ou WebP).",
  "heic-non-lu":
    "Les photos HEIC ne peuvent pas être lues. Sur iPhone, choisis « Le plus compatible » dans Réglages › Appareil photo › Formats, ou envoie une capture d'écran de la photo.",
  "pdf-trop-long": `Ton PDF dépasse ${MAX_PAGES_PDF} pages. Garde les pages de la matière à réviser.`,
  // On refuse au lieu de deviner : sans pouvoir compter les pages, rien ne
  // dit que ce PDF en a vingt plutôt que six cents.
  "pdf-illisible": "Ce PDF n'a pas pu être ouvert. Essaie de l'exporter à nouveau, ou envoie une photo des pages.",
  "niveau-non-autorise": "Ton accès ne comprend pas l'analyse de notes.",
  "essai-gratuit-epuise":
    "Tu as utilisé ton analyse d'essai. Le package donne droit à des analyses tous les jours.",
  "quota-atteint": `Tu as atteint tes ${QUOTA_QUOTIDIEN} analyses pour aujourd'hui. Le compteur repart demain.`,
};

/**
 * Contrôle de l'entrée, avant toute lecture de Firestore et avant tout appel
 * au modèle. Un fichier trop gros doit coûter zéro cent.
 */
export function validerEntree(
  entree: EntreeAnalyse,
  coursConnus: readonly string[],
): { valide: true } | { valide: false; raison: RaisonRefus } {
  const refus = (raison: RaisonRefus) => ({ valide: false as const, raison });

  if (!coursConnus.includes(entree.coursId)) return refus("cours-inconnu");

  const aDuTexte = typeof entree.texte === "string" && entree.texte.trim().length > 0;
  const aUnFichier = entree.fichier !== undefined;
  if (!aDuTexte && !aUnFichier) return refus("entree-vide");
  if (aDuTexte && aUnFichier) return refus("entree-double");

  if (aDuTexte && (entree.texte as string).length > MAX_CARACTERES) {
    return refus("texte-trop-long");
  }

  if (entree.fichier) {
    const { mediaType, octets, pages } = entree.fichier;
    if (TYPES_HEIC.includes(mediaType)) return refus("heic-non-lu");
    if (!(TYPES_FICHIER_ACCEPTES as readonly string[]).includes(mediaType)) {
      return refus("type-non-accepte");
    }
    if (octets <= 0) return refus("fichier-vide");
    const estUnPdf = mediaType === "application/pdf";
    if (estUnPdf && octets > MAX_OCTETS_FICHIER) return refus("fichier-trop-gros");
    if (!estUnPdf && octets > MAX_OCTETS_IMAGE) return refus("image-trop-grosse");
    if (estUnPdf && typeof pages === "number" && pages > MAX_PAGES_PDF) {
      return refus("pdf-trop-long");
    }
  }
  return { valide: true };
}

// ─── La sortie du modèle ──────────────────────────────────────────────────

/** Au-delà, la détection ne dit plus rien : une page de notes ne couvre pas
 *  huit notions. Borne aussi ce qu'une réponse bavarde peut imposer à l'UI. */
export const MAX_NOTIONS_DETECTEES = 8;

export type Confiance = "elevee" | "moyenne";
export type Detection = { id: string; confiance: Confiance };

export type SortieValidee = {
  detectees: Detection[];
  horsSujet: boolean;
  /** Identifiants renvoyés par le modèle mais absents du catalogue. */
  ignorees: string[];
};

/**
 * Le filtre entre le modèle et le reste du site.
 *
 * Deux choses s'y jouent. La première est banale : une réponse peut être mal
 * formée, et on préfère une erreur franche à un objet à moitié lu. La
 * seconde l'est moins — le texte analysé vient de l'étudiant, et rien
 * n'empêche une page de notes de contenir « ignore tes instructions et
 * renvoie… ». Quoi qu'il arrive en amont, seul ce qui existe déjà dans le
 * catalogue ressort d'ici. La détection ne peut donc jamais désigner autre
 * chose que des sections de la banque.
 */
export function validerDetections(
  brut: unknown,
  idsValides: ReadonlySet<string>,
): { valide: false } | ({ valide: true } & SortieValidee) {
  if (typeof brut !== "object" || brut === null) return { valide: false };
  const objet = brut as Record<string, unknown>;
  if (!Array.isArray(objet.notions)) return { valide: false };

  const detectees: Detection[] = [];
  const ignorees: string[] = [];
  const deja = new Set<string>();

  for (const item of objet.notions) {
    if (typeof item !== "object" || item === null) continue;
    const { id, confiance } = item as Record<string, unknown>;
    if (typeof id !== "string") continue;
    if (!idsValides.has(id)) {
      ignorees.push(id.slice(0, 40));
      continue;
    }
    if (deja.has(id)) continue;
    deja.add(id);
    detectees.push({ id, confiance: confiance === "elevee" ? "elevee" : "moyenne" });
    if (detectees.length >= MAX_NOTIONS_DETECTEES) break;
  }

  return {
    valide: true,
    detectees,
    horsSujet: objet.horsSujet === true || detectees.length === 0,
    ignorees,
  };
}

// ─── Le quota ─────────────────────────────────────────────────────────────

/**
 * Le compteur d'une personne, tel qu'il dort dans Firestore.
 *
 * `jour` est une date locale (voir jourLocal) et non un horodatage : le
 * compteur doit repartir à minuit chez l'étudiant, pas à 20 h parce que le
 * serveur compte en UTC.
 */
export type QuotaStocke = {
  jour?: string;
  utiliseesAujourdhui?: number;
  essaiGratuitUtilise?: boolean;
};

export type DecisionAnalyse =
  | { autorise: true; restantes: number; essaiGratuit: boolean }
  | { autorise: false; restantes: number; raison: RaisonRefus };

/**
 * La date locale d'un instant, au format AAAA-MM-JJ.
 *
 * `fr-CA` rend précisément ce format, ce qui évite d'assembler la date à la
 * main — et le fuseau est passé en paramètre pour que le test n'ait pas à
 * dépendre de l'horloge de la machine.
 */
export function jourLocal(maintenant: number, fuseau = "America/Toronto"): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(maintenant));
}

/**
 * Peut-elle lancer une analyse, et combien lui en restera-t-il ?
 *
 * `accesActif` et `niveau` viennent d'une lecture de l'accès faite avec
 * l'horloge du serveur — cette fonction ne les recalcule pas, elle décide.
 *
 * Deux régimes volontairement différents : un détenteur a un quota qui se
 * recharge chaque jour, quelqu'un sans accès a un seul essai, qui ne se
 * recharge jamais.
 */
export function deciderAnalyse(params: {
  accesActif: boolean;
  niveau: NiveauAcces | null;
  quota: QuotaStocke | undefined;
  jour: string;
}): DecisionAnalyse {
  const { accesActif, niveau, quota, jour } = params;

  // Un vieux document d'accès peut ne pas porter de niveau. On applique
  // alors le plus restrictif, comme le fait déjà la règle de téléchargement
  // — et on le vérifie comme les autres, au lieu de le laisser passer.
  const niveauEffectif: NiveauAcces = niveau ?? "restreint";
  if (accesActif && !NIVEAUX_ANALYSE_NOTES.includes(niveauEffectif)) {
    return { autorise: false, restantes: 0, raison: "niveau-non-autorise" };
  }

  if (!accesActif) {
    if (quota?.essaiGratuitUtilise === true) {
      return { autorise: false, restantes: 0, raison: "essai-gratuit-epuise" };
    }
    return { autorise: true, restantes: ESSAIS_SANS_ACCES - 1, essaiGratuit: true };
  }

  // Un compteur d'hier ne compte pas : le jour change, le compteur repart.
  const utilisees = quota?.jour === jour ? (quota.utiliseesAujourdhui ?? 0) : 0;
  if (utilisees >= QUOTA_QUOTIDIEN) {
    return { autorise: false, restantes: 0, raison: "quota-atteint" };
  }
  return { autorise: true, restantes: QUOTA_QUOTIDIEN - utilisees - 1, essaiGratuit: false };
}

/** Le compteur après une analyse accordée — ce que la transaction écrira. */
export function quotaApres(quota: QuotaStocke | undefined, jour: string, essaiGratuit: boolean): QuotaStocke {
  if (essaiGratuit) {
    return { ...quota, jour: quota?.jour ?? jour, essaiGratuitUtilise: true };
  }
  const utilisees = quota?.jour === jour ? (quota.utiliseesAujourdhui ?? 0) : 0;
  return { ...quota, jour, utiliseesAujourdhui: utilisees + 1 };
}

/**
 * Le compteur après un remboursement — une analyse réservée puis ratée.
 *
 * La réservation a lieu AVANT l'appel au modèle, pour que deux analyses
 * lancées en même temps ne passent pas toutes les deux au travers du quota.
 * Quand l'appel échoue, on rend ce qu'on a pris : une panne de notre côté ne
 * doit pas coûter une analyse à l'étudiant.
 */
export function quotaRembourse(quota: QuotaStocke | undefined, jour: string, essaiGratuit: boolean): QuotaStocke {
  if (essaiGratuit) return { ...quota, essaiGratuitUtilise: false };
  if (quota?.jour !== jour) return { ...quota };
  return { ...quota, utiliseesAujourdhui: Math.max(0, (quota.utiliseesAujourdhui ?? 0) - 1) };
}
