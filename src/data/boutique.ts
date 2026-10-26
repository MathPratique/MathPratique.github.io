// Ce que chaque matière « offre » côté boutique — la seule liste des
// packages en vente.
//
// Déplacée telle quelle depuis `pages/Boutique.tsx` le 2026-10-26 : la page
// d'accueil en a besoin aussi (compteurs « avec le package », section
// Boutique), et deux listes finiraient par se contredire. Elle reste hors de
// `topics.ts` pour la même raison qu'avant : le lien vers un package ne
// concerne que la vente, pas le modèle de matière.
//
// Ajouter un cours en vente = ajouter une entrée ici et créer sa page
// package. Retirer une entrée retire le cours de la vente partout.

import type { ProduitCarte } from "../components/shop/CarteBoutique";
import { TARIFS_CALCUL_DIFFERENTIEL } from "./tarifs";

export const PRODUITS_PAR_TOPIC: Record<string, ProduitCarte> = {
  "differential-calculus": {
    prix: TARIFS_CALCUL_DIFFERENTIEL.prixLancement,
    prixOriginal: TARIFS_CALCUL_DIFFERENTIEL.prixRegulier,
    devise: TARIFS_CALCUL_DIFFERENTIEL.devise,
    href: "/boutique/calcul-differentiel",
    disponible: true,
  },
};

/** Un package de cette matière s'achète-t-il aujourd'hui? */
export function packageEnVente(topicId: string): boolean {
  return PRODUITS_PAR_TOPIC[topicId]?.disponible === true;
}
