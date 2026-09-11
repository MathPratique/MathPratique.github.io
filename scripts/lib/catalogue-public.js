// ============================================================================
//  Garde-fou commun : ce qui entre dans le catalogue PUBLIC d'une banque.
// ============================================================================
//
// `catalogue.json` part dans le bundle JavaScript servi à chaque visiteur.
// Les scripts de synchronisation le recopiaient tel quel depuis l'export du
// projet jumeau — c'est ainsi qu'un sigle de cours s'est retrouvé en ligne.
//
// Ce module applique la liste blanche définie dans src/data/banque-types.ts,
// la seule source du schéma. Une clé hors liste arrête la synchronisation :
// on préfère un script qui échoue à un site qui publie ce qu'il ne devait pas.

import { CLES_CATALOGUE, clesRefuseesCatalogue } from "../../src/data/banque-types.ts";

/**
 * Vérifie un catalogue exporté par un projet jumeau et renvoie sa version
 * publiable : les seules clés du schéma, dans l'ordre du schéma.
 *
 * Ne filtre PAS en silence : une clé refusée termine le processus avec un
 * message qui la nomme et dit pourquoi. Retirer la clé dans le générateur du
 * projet jumeau est la seule correction durable — la faire disparaître ici
 * sans bruit laisserait le générateur fautif en place.
 *
 * @param {Record<string, unknown>} index  le catalogue lu depuis l'export
 * @param {string} source                  chemin du fichier, pour le message
 */
export function catalogueSansFuite(index, source) {
  const refusees = clesRefuseesCatalogue(index);
  if (refusees.length > 0) {
    console.error(`\n❌ Le catalogue exporté contient ${refusees.length} clé(s) hors schéma :\n`);
    for (const { cle, raison } of refusees) {
      console.error(`     « ${cle} »  (${raison})`);
    }
    console.error(`
   Fichier : ${source}

   Ce catalogue part dans le bundle public du site. Aucun sigle de cours,
   aucun nom d'établissement, aucun nom de personne ne doit y figurer.
   Retire ces clés dans le générateur du projet jumeau (scripts/generer-web.js),
   puis relance la synchronisation. Le schéma est dans src/data/banque-types.ts.
`);
    process.exit(1);
  }

  const publiable = {};
  for (const cle of CLES_CATALOGUE) {
    if (cle in index) publiable[cle] = index[cle];
  }
  return publiable;
}
