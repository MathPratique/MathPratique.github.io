// Tarifs du package Calcul différentiel — la seule source qui les définit.
//
// Importés par la carte du cours dans /boutique (grille) et par la page du
// package /boutique/calcul-differentiel. Aucun prix écrit en dur ailleurs.

export const TARIFS_CALCUL_DIFFERENTIEL = {
  prixRegulier: 49,
  prixLancement: 34,
  devise: "CAD" as const,
} as const;

/** Ce que dit la mention de rabais à côté du prix. */
export const PERIODE_LANCEMENT_CALCUL_DIFFERENTIEL =
  "Prix de lancement, pour la session d'automne 2026";
