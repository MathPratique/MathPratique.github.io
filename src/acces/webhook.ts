// ===========================================================================
//  La décision du webhook Stripe — logique pure, sans dépendance.
// ===========================================================================
//
// Ce module ne parle ni à Stripe, ni à Firestore. Il reçoit un événement déjà
// vérifié et un état (« cette session a-t-elle déjà été traitée ? »), et rend
// une décision. Toute l'entrée/sortie reste dans la Cloud Function.
//
// Pourquoi séparer : c'est ici que se joue l'octroi d'un accès payant. Cette
// logique doit être testable sans compte Stripe, sans émulateur et sans
// réseau — sinon elle ne serait jamais testée sérieusement, et les cas qui
// comptent (rejeu, paiement abandonné, métadonnées manquantes) sont
// précisément ceux qu'on ne reproduit pas à la main.
//
// Deux règles gouvernent tout ce fichier :
//
//   1. **En cas de doute, on n'octroie rien.** Un accès refusé à tort se
//      règle par un courriel ; un accès accordé à tort se découvre rarement.
//   2. **Le rejeu ne doit rien changer.** Stripe réessaie ses webhooks après
//      une erreur, un délai, ou sans raison particulière. Traiter deux fois
//      le même paiement ne doit ni créer deux accès ni repousser la date de
//      fin.

// L'extension est explicite : ce module est compilé tel quel pour les tests
// Node, qui exigent un chemin complet en ESM. TypeScript et Vite acceptent
// tous deux `.js` pointant vers un `.ts` — c'est la forme qui fonctionne des
// deux côtés.
import { creerAcces, type Acces } from "./regles.js";

/** Ce que la Cloud Function doit faire de l'événement. */
export type Decision =
  | { action: "ignorer"; raison: RaisonIgnorer }
  | { action: "rejeter"; raison: RaisonRejeter }
  | { action: "octroyer"; acces: Acces; uid: string; sessionId: string };

export type RaisonIgnorer =
  | "type-non-traite"
  | "paiement-non-complete"
  | "deja-traite";

export type RaisonRejeter = "metadonnees-manquantes" | "evenement-illisible";

/** Le seul type d'événement qui ouvre un accès. */
export const TYPE_TRAITE = "checkout.session.completed";

/**
 * La forme minimale attendue d'un événement Stripe. On ne dépend pas des
 * types du SDK : cette fonction doit rester exécutable dans un test qui
 * n'installe pas Stripe.
 */
export type EvenementEntrant = {
  type?: unknown;
  data?: { object?: unknown };
};

type SessionLue = {
  id: string;
  payment_status: string;
  uid: string;
  coursId: string;
};

/**
 * Extrait ce dont on a besoin, ou null si quoi que ce soit manque.
 *
 * Le paiement est encaissé par Stripe même quand nos métadonnées sont
 * absentes — un lien de paiement créé à la main dans le tableau de bord, par
 * exemple. Ce cas ne doit pas passer inaperçu : on rejette, on journalise, et
 * quelqu'un règle la situation à la main. Accorder l'accès « au cas où »
 * reviendrait à deviner à qui.
 */
function lireSession(objet: unknown): SessionLue | null {
  if (typeof objet !== "object" || objet === null) return null;
  const o = objet as Record<string, unknown>;

  const id = typeof o.id === "string" ? o.id : null;
  const paiement = typeof o.payment_status === "string" ? o.payment_status : null;
  if (!id || !paiement) return null;

  const meta =
    typeof o.metadata === "object" && o.metadata !== null
      ? (o.metadata as Record<string, unknown>)
      : {};
  const uid = typeof meta.uid === "string" ? meta.uid.trim() : "";
  const coursId = typeof meta.coursId === "string" ? meta.coursId.trim() : "";
  if (!uid || !coursId) return null;

  return { id, payment_status: paiement, uid, coursId };
}

/**
 * Décide du sort d'un événement.
 *
 * @param evenement    l'événement Stripe, DÉJÀ vérifié par signature. Cette
 *                     fonction ne vérifie aucune signature : la validation
 *                     cryptographique appartient à la Cloud Function, qui
 *                     seule détient le secret.
 * @param dejaTraite   la session figure-t-elle déjà au journal ?
 * @param maintenant   l'horloge du serveur, jamais celle du client.
 */
export function deciderWebhook(
  evenement: EvenementEntrant,
  dejaTraite: boolean,
  maintenant: number
): Decision {
  if (evenement?.type !== TYPE_TRAITE) {
    return { action: "ignorer", raison: "type-non-traite" };
  }

  const session = lireSession(evenement.data?.object);
  if (!session) {
    return { action: "rejeter", raison: "metadonnees-manquantes" };
  }

  // Un paiement abandonné, en attente ou échoué n'ouvre rien. L'ordre compte :
  // on écarte le non-payé AVANT de consulter le journal, pour qu'une session
  // impayée n'y laisse jamais de trace.
  if (session.payment_status !== "paid") {
    return { action: "ignorer", raison: "paiement-non-complete" };
  }

  if (dejaTraite) {
    return { action: "ignorer", raison: "deja-traite" };
  }

  return {
    action: "octroyer",
    uid: session.uid,
    sessionId: session.id,
    acces: creerAcces({
      coursId: session.coursId,
      source: "achat",
      // Un paiement Stripe validé ouvre TOUJOURS un accès « acheteur ». Le
      // niveau est décidé ici — pas dans le tx.set du webhookStripe, pas
      // par défaut ailleurs. Le jour où on ajoutera d'autres modes d'octroi
      // (code de classe, invitation enseignant), ce sera dans une autre
      // fonction qui appellera creerAcces avec son propre niveau.
      niveau: "acheteur",
      debut: maintenant,
      reference: session.id,
    }),
  };
}

/** Message de journal, pour retrouver ce qui s'est passé six mois plus tard. */
export function journaliser(decision: Decision, sessionId: string | null): string {
  const ref = sessionId ?? "session-inconnue";
  switch (decision.action) {
    case "octroyer":
      return `[webhook] ${ref} : accès ${decision.acces.coursId} ouvert pour ${decision.uid} jusqu'au ${new Date(decision.acces.dateFin).toISOString()}`;
    case "ignorer":
      return `[webhook] ${ref} : ignoré (${decision.raison})`;
    case "rejeter":
      return `[webhook] ${ref} : REJETÉ (${decision.raison}) — paiement possiblement encaissé sans accès, à traiter à la main`;
  }
}
