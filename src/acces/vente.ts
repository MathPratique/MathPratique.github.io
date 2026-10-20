// ===========================================================================
//  L'interrupteur unique de la vente
// ===========================================================================
//
// Lu par la page produit (bouton « Acheter ») ET par la Cloud Function
// creerSessionCheckout, qui refuse toute session tant qu'il vaut `false`.
// Une seule constante pour les deux : la page et le serveur ne peuvent pas
// se contredire. Un serveur ouvert derrière une page fermée laisserait
// acheter quiconque appelle la fonction directement.
//
// On ne le bascule PAS pour tester. En local, la vente s'ouvre d'elle-même :
// `npm run dev` côté site (import.meta.env.DEV), l'émulateur côté fonction
// (FUNCTIONS_EMULATOR). Le 2026-08-06, un `true` posé pour un test est parti
// en ligne par un commit de routine ; ce scénario n'a plus de raison d'être.
//
// Ouvrir la vente demande deux gestes délibérés : pousser le site ET
// déployer creerSessionCheckout. Voir TESTS-ACHAT.md, partie 4.
// ===========================================================================

export const VENTE_OUVERTE = false;
