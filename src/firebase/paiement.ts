// Déclenche un achat : demande une session Checkout au serveur, puis redirige
// vers Stripe.
//
// Le navigateur ne fixe ni le prix, ni la durée, ni le cours — il ne transmet
// qu'un identifiant de cours, que la Cloud Function valide. Tout le reste est
// décidé côté serveur, où la clé secrète Stripe se trouve. Un formulaire de
// paiement maison n'aurait aucun de ces avantages, et devrait en plus assumer
// la conformité PCI et l'authentification forte.

import { chargerFirebase } from "./config";

/** Ce que l'interface doit dire quand ça se passe mal. */
export type EchecPaiement =
  | "non-configure"
  | "non-connecte"
  | "deja-achete"
  | "boutique-fermee"
  | "indisponible";

export class ErreurPaiement extends Error {
  // Champ déclaré puis affecté, plutôt qu'une propriété de paramètre : le
  // projet compile avec `erasableSyntaxOnly`, qui interdit la forme courte
  // parce qu'elle génère du code au lieu de simplement disparaître.
  readonly echec: EchecPaiement;
  constructor(echec: EchecPaiement) {
    super(echec);
    this.echec = echec;
  }
}

const MESSAGES: Record<EchecPaiement, string> = {
  "non-configure": "La boutique n'est pas encore ouverte.",
  "non-connecte": "Connecte-toi d'abord : ton achat doit être rattaché à un compte.",
  "deja-achete": "Tu as déjà accès à ce cours. Retrouve-le dans ton compte.",
  "boutique-fermee": "La vente n'est pas encore ouverte. Réessaie bientôt.",
  indisponible: "Le paiement est momentanément indisponible. Réessaie dans quelques minutes.",
};

export function messagePaiement(erreur: unknown): string {
  if (erreur instanceof ErreurPaiement) return MESSAGES[erreur.echec];
  return MESSAGES.indisponible;
}

/**
 * Traduit les codes d'erreur des fonctions appelables. Ils arrivent sous la
 * forme « functions/unauthenticated ».
 */
function versEchec(erreur: unknown): EchecPaiement {
  const code =
    typeof erreur === "object" && erreur !== null && "code" in erreur
      ? String((erreur as { code: unknown }).code)
      : "";
  if (code.endsWith("unauthenticated")) return "non-connecte";
  if (code.endsWith("already-exists")) return "deja-achete";
  if (code.endsWith("failed-precondition")) return "boutique-fermee";
  return "indisponible";
}

/**
 * Demande une session et redirige. Ne rend la main qu'en cas d'échec — en cas
 * de succès, la page a déjà changé.
 */
export async function demarrerAchat(coursId: string): Promise<never | void> {
  const services = await chargerFirebase();
  if (!services) throw new ErreurPaiement("non-configure");

  const { getAuth } = await import("firebase/auth");
  if (!getAuth().currentUser) throw new ErreurPaiement("non-connecte");

  const { getFunctions, httpsCallable } = await import("firebase/functions");
  const fonctions = getFunctions(undefined, "northamerica-northeast1");

  try {
    const appeler = httpsCallable<{ coursId: string }, { url: string }>(
      fonctions,
      "creerSessionCheckout"
    );
    const { data } = await appeler({ coursId });
    if (!data?.url) throw new ErreurPaiement("indisponible");
    // Redirection en dur plutôt que par le routeur : on quitte le site.
    window.location.assign(data.url);
  } catch (erreur) {
    if (erreur instanceof ErreurPaiement) throw erreur;
    throw new ErreurPaiement(versEchec(erreur));
  }
}
