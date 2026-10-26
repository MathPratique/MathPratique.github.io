/**
 * Compteurs publics du site — calcul pur, sans import.
 *
 * Les chiffres de l'accueil étaient écrits à la main ou mal dérivés : le
 * bandeau annonçait « 539 exercices dans 4 matières », soit les seuls
 * exercices d'algèbre linéaire, rapportés à quatre matières dont une (Calcul
 * intégral) est encore « À venir ». Ici, tout se recalcule à partir de ce que
 * chaque matière déclare réellement, et `npm test` couvre les règles.
 *
 * Le câblage avec les données (catalogues, `exercises.ts`, boutique) se fait
 * dans `stats.ts` : ce module ne lit rien lui-même, ce qui le rend testable
 * sans navigateur ni import de JSON.
 */

export type MatiereComptee = {
  id: string;
  /** « À venir » : ni comptée comme disponible, ni dans les exercices. */
  enPreparation: boolean;
  /** Retirée des listes publiques : ignorée partout. */
  masquee: boolean;
  /** Exercices ouverts à tous, sans compte. */
  gratuits: number;
  /** Exercices réservés (banque payante), qu'un package soit en vente ou non. */
  reserves: number;
  /** Un package de cette matière s'achète aujourd'hui dans la boutique. */
  packageEnVente: boolean;
};

export type Compteurs = {
  matieresDisponibles: number;
  matieresEnPreparation: number;
  /** Somme des exercices gratuits des matières disponibles. */
  gratuits: number;
  /**
   * Exercices réservés qu'on peut réellement obtenir en achetant un package :
   * seulement ceux des matières dont le package est en vente. Les exercices
   * réservés d'une matière sans package en vente ne sont pas comptés — rien
   * ne permet de les acheter.
   */
  avecPackage: number;
};

export function compter(matieres: MatiereComptee[]): Compteurs {
  const visibles = matieres.filter((m) => !m.masquee);
  const disponibles = visibles.filter((m) => !m.enPreparation);
  return {
    matieresDisponibles: disponibles.length,
    matieresEnPreparation: visibles.length - disponibles.length,
    gratuits: disponibles.reduce((s, m) => s + m.gratuits, 0),
    avecPackage: disponibles.filter((m) => m.packageEnVente).reduce((s, m) => s + m.reserves, 0),
  };
}

/**
 * Texte du badge d'une carte de matière.
 *
 *   enPreparation                         → « À venir »
 *   package en vente et banque plus large → « X gratuits · Y avec le package »
 *   exercices réservés, sans package      → « X exercices gratuits »
 *   tout est gratuit                      → « X exercices »
 *
 * Le troisième cas évite d'annoncer « avec le package » pour une matière
 * dont aucun package ne s'achète.
 */
export function libelleBadge(m: {
  enPreparation?: boolean;
  gratuits: number;
  total?: number;
  packageEnVente: boolean;
}): string {
  if (m.enPreparation) return "À venir";
  const pluriel = m.gratuits > 1 ? "s" : "";
  const plusLarge = typeof m.total === "number" && m.total > m.gratuits;
  if (plusLarge && m.packageEnVente) return `${m.gratuits} gratuits · ${m.total} avec le package`;
  if (plusLarge) return `${m.gratuits} exercice${pluriel} gratuit${pluriel}`;
  return `${m.gratuits} exercice${pluriel}`;
}

const LETTRES = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];

/** Petit nombre en lettres, au féminin (« une matière ») ; en chiffres au-delà de dix. */
export function enLettres(n: number): string {
  return LETTRES[n] ?? String(n);
}

/**
 * Ordre de grandeur pour une phrase d'accroche, qui doit rester vraie quand
 * des exercices s'ajoutent : « Des centaines d'… » entre 200 et 999,
 * « Plus de mille… » au-delà, le nombre exact en deçà.
 *
 * @param suite  le nom qui suit (« exercices corrigés ») ; il doit commencer
 *               par une voyelle, à cause de l'élision « d' ».
 */
export function quantite(n: number, suite: string): string {
  if (n >= 1000) return `Plus de mille ${suite}`;
  if (n >= 200) return `Des centaines d'${suite}`;
  return `${n} ${suite}`;
}

/** Nombre avec l'espace des milliers à la québécoise : 1037 → « 1 037 ». */
export function nombre(n: number): string {
  return n.toLocaleString("fr-CA");
}
