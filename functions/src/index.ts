// ===========================================================================
//  Paiement — création de session Checkout et octroi d'accès par webhook.
// ===========================================================================
//
// Deux fonctions, et une règle qui les gouverne :
//
//   **L'accès est accordé par le webhook, jamais par la page de succès.**
//
// Un acheteur peut fermer son navigateur avant la redirection, perdre le
// réseau, ou simplement ne jamais revenir. Le paiement est valide quand même.
// Inversement, la page de succès est une URL comme une autre : n'importe qui
// peut l'ouvrir. Si elle accordait l'accès, elle le donnerait gratuitement.
//
// La règle métier — ce que « 12 mois » veut dire, et ce qu'on fait d'un
// événement — vit dans ../../src/acces/. Le même code sert au navigateur et
// au serveur. Il n'y a pas deux définitions à garder en phase.

import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import Stripe from "stripe";

import { deciderWebhook, journaliser } from "../../src/acces/webhook.js";
import {
  deciderTelechargement,
  MESSAGES_REFUS,
  VALIDITE_LIEN_MINUTES,
} from "../../src/acces/telechargement.js";
import { trouverDocument } from "../../src/acces/documents.js";
import { DUREE_ACCES_MOIS } from "../../src/acces/regles.js";
import { versAccesDepuisDonnees } from "./lecture.js";

initializeApp();
const db = getFirestore();

// ---------------------------------------------------------------------------
//  Configuration
// ---------------------------------------------------------------------------
//
// Les secrets vivent dans Secret Manager, pas dans le dépôt :
//     firebase functions:secrets:set STRIPE_SECRET_KEY
//     firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

const CLE_STRIPE = defineSecret("STRIPE_SECRET_KEY");
const SECRET_WEBHOOK = defineSecret("STRIPE_WEBHOOK_SECRET");

/** Identifiant du Price Stripe du package. Se règle sans redéploiement. */
const PRICE_ID = defineString("STRIPE_PRICE_ID", { default: "" });

/**
 * Coupon de lancement, appliqué automatiquement à la session.
 *
 * Choix assumé : la page produit affiche « 34 $, 49 $ barré » AVANT l'achat.
 * Un code promotionnel classique ne s'applique que dans Checkout — le client
 * verrait 49 $ après avoir lu 34 $, ce qui est exactement le genre de
 * surprise qui fait abandonner un panier. Un coupon appliqué par le serveur
 * garde l'affichage honnête, tout en restant désactivable depuis le tableau
 * de bord Stripe sans redéployer : il suffit de vider cette variable.
 */
const COUPON_LANCEMENT = defineString("STRIPE_COUPON_LANCEMENT", { default: "" });

/** Racine du site, pour les URL de retour. */
const URL_SITE = defineString("URL_SITE", { default: "https://mathpratique.ca" });

/**
 * Stripe Tax — PRÉPARÉ MAIS DÉSACTIVÉ.
 *
 * Aucun taux n'est codé en dur nulle part, et ce n'est pas un oubli : la
 * perception des taxes dépend du statut fiscal du vendeur, pas du code. Tant
 * qu'aucun numéro de TPS/TVQ n'est enregistré, facturer une taxe serait une
 * faute.
 *
 * Pour l'activer le jour venu :
 *   1. activer Stripe Tax dans le tableau de bord et y déclarer les
 *      immatriculations (Québec, Canada) ;
 *   2. passer cette variable à « oui ».
 * Stripe calcule alors la taxe selon l'adresse du client, qu'il faut donc
 * collecter — d'où `billing_address_collection` ci-dessous.
 */
const TAXES_ACTIVES = defineString("STRIPE_TAXES_ACTIVES", { default: "non" });

const COURS_EN_VENTE = "calcul-differentiel";

function stripe(): Stripe {
  return new Stripe(CLE_STRIPE.value(), { apiVersion: "2025-10-29.clover" });
}

// ---------------------------------------------------------------------------
//  1. Créer la session Checkout
// ---------------------------------------------------------------------------

export const creerSessionCheckout = onCall(
  { secrets: [CLE_STRIPE], region: "northamerica-northeast1", cors: true },
  async (requete) => {
    // L'achat doit être rattaché à un compte : sans uid, le webhook ne
    // saurait à qui ouvrir l'accès.
    const uid = requete.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Connecte-toi avant d'acheter.");
    }

    const coursId = String(requete.data?.coursId ?? COURS_EN_VENTE);
    if (coursId !== COURS_EN_VENTE) {
      throw new HttpsError("invalid-argument", "Ce cours n'est pas en vente.");
    }

    const prix = PRICE_ID.value();
    if (!prix) {
      logger.error("STRIPE_PRICE_ID n'est pas configuré : vente impossible.");
      throw new HttpsError("failed-precondition", "La boutique n'est pas encore ouverte.");
    }

    // Un accès encore actif ne se rachète pas. Sans ce contrôle, un double
    // clic sur « Acheter » facturerait deux fois sans rien ajouter — le
    // webhook écraserait simplement le premier accès.
    const existant = await db.doc(`utilisateurs/${uid}/acces/${coursId}`).get();
    if (existant.exists) {
      const fin = existant.get("dateFin");
      const finMs = fin instanceof Timestamp ? fin.toMillis() : 0;
      if (finMs > Date.now()) {
        throw new HttpsError(
          "already-exists",
          "Tu as déjà accès à ce cours. Retrouve-le dans ton compte."
        );
      }
    }

    const coupon = COUPON_LANCEMENT.value();
    const taxes = TAXES_ACTIVES.value() === "oui";

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: prix, quantity: 1 }],

      // Ce que le webhook lira. C'est le seul lien entre le paiement et le
      // compte : sans ces deux champs, l'événement sera rejeté et l'accès
      // devra être ouvert à la main.
      metadata: { uid, coursId },
      // Répété sur le paiement lui-même : les métadonnées de session ne
      // suivent pas jusqu'au remboursement, celles du payment_intent si.
      //
      // `description` de ce payment_intent apparaît sur le reçu Stripe
      // envoyé par courriel. Sans elle, le reçu ne montre que le nom du
      // produit et l'acheteur ne voit pas la durée à laquelle il a droit.
      // On NE PAS calculer de date de fin ici : la session peut être créée
      // longtemps avant que le paiement se finalise ; seule la date fixée
      // par le webhook au moment du paiement fait autorité.
      payment_intent_data: {
        metadata: { uid, coursId },
        description: `Package — Calcul différentiel — accès de ${DUREE_ACCES_MOIS} mois à partir de la date d'achat`,
      },

      client_reference_id: uid,
      customer_email: requete.auth?.token?.email ?? undefined,

      ...(coupon ? { discounts: [{ coupon }] } : {}),
      ...(taxes
        ? { automatic_tax: { enabled: true }, billing_address_collection: "required" as const }
        : {}),

      success_url: `${URL_SITE.value()}/achat-confirme?produit=package-${coursId}`,
      cancel_url: `${URL_SITE.value()}/boutique?achat=annule`,

      // Les modalités sous les yeux de l'acheteur au moment de payer, et non
      // seulement sur la page produit qu'il a peut-être survolée. Stripe les
      // reprend sur le reçu envoyé par courriel — c'est là que se trouvera la
      // politique de remboursement le jour où quelqu'un la cherchera.
      custom_text: {
        submit: {
          message:
            `Un seul paiement. ${DUREE_ACCES_MOIS} mois d'accès à partir d'aujourd'hui. ` +
            "Aucun abonnement, aucun renouvellement automatique. " +
            "Remboursement complet dans les 7 jours, tant qu'aucun document n'a été téléchargé.",
        },
      },

      locale: "fr-CA",
    });

    if (!session.url) {
      throw new HttpsError("internal", "Stripe n'a pas renvoyé d'adresse de paiement.");
    }
    logger.info(`[checkout] session ${session.id} créée pour ${uid}`);
    return { url: session.url };
  }
);

// ---------------------------------------------------------------------------
//  2. Le webhook — c'est lui, et lui seul, qui ouvre l'accès
// ---------------------------------------------------------------------------

export const webhookStripe = onRequest(
  { secrets: [CLE_STRIPE, SECRET_WEBHOOK], region: "northamerica-northeast1" },
  async (requete, reponse) => {
    // --- Vérification de signature : non négociable -------------------------
    // Sans elle, l'URL du webhook est un formulaire public permettant de
    // s'offrir n'importe quel accès. `rawBody` est indispensable : le corps
    // analysé en JSON ne produit pas la même empreinte.
    const signature = requete.headers["stripe-signature"];
    if (typeof signature !== "string") {
      logger.warn("[webhook] requête sans signature — rejetée");
      reponse.status(400).send("signature manquante");
      return;
    }

    let evenement: Stripe.Event;
    try {
      evenement = stripe().webhooks.constructEvent(
        requete.rawBody,
        signature,
        SECRET_WEBHOOK.value()
      );
    } catch (erreur) {
      logger.warn(`[webhook] signature invalide : ${(erreur as Error).message}`);
      reponse.status(400).send("signature invalide");
      return;
    }

    const sessionId =
      typeof (evenement.data?.object as { id?: unknown })?.id === "string"
        ? ((evenement.data.object as { id: string }).id)
        : null;

    // --- Décision et écriture, en une seule transaction ---------------------
    //
    // L'idempotence ne peut PAS reposer sur un « lire, puis écrire » en deux
    // temps : Stripe peut livrer deux tentatives en parallèle, et les deux
    // liraient un journal vide avant d'écrire. La transaction relit le
    // journal au moment de valider et échoue si un autre l'a rempli entre
    // temps ; Firestore rejoue alors la transaction, qui voit cette fois la
    // trace et n'octroie rien.
    try {
      const resume = await db.runTransaction(async (tx) => {
        const refJournal = db.doc(`evenementsStripe/${sessionId ?? evenement.id}`);
        const dejaTraite = (await tx.get(refJournal)).exists;

        // L'horloge du serveur, jamais celle du client ni celle de Stripe.
        const decision = deciderWebhook(evenement, dejaTraite, Date.now());
        const message = journaliser(decision, sessionId);

        if (decision.action !== "octroyer") return message;

        const { acces, uid } = decision;
        tx.set(db.doc(`utilisateurs/${uid}/acces/${acces.coursId}`), {
          coursId: acces.coursId,
          source: acces.source,
          dateDebut: Timestamp.fromMillis(acces.dateDebut),
          dateFin: Timestamp.fromMillis(acces.dateFin),
          aTelecharge: acces.aTelecharge,
          reference: acces.reference ?? null,
        });
        // Le journal est écrit DANS la même transaction que l'accès : les
        // deux existent ensemble, ou aucun des deux.
        tx.set(refJournal, {
          type: evenement.type,
          uid,
          coursId: acces.coursId,
          traiteLe: Timestamp.now(),
        });
        return message;
      });

      logger.info(resume);
    } catch (erreur) {
      // On répond 500 pour que Stripe réessaie : l'événement est authentique,
      // c'est notre écriture qui a échoué.
      logger.error(`[webhook] échec du traitement : ${(erreur as Error).message}`);
      reponse.status(500).send("échec du traitement");
      return;
    }

    // 200 même pour un événement ignoré : il a bien été reçu et compris.
    // Répondre en erreur ferait réessayer Stripe indéfiniment pour rien.
    reponse.status(200).send("ok");
  }
);

// ---------------------------------------------------------------------------
//  3. Le téléchargement — la vraie barrière
// ---------------------------------------------------------------------------
//
// Tout le contrôle d'accès du site est ici. Ce que le navigateur affiche —
// bouton actif ou grisé, bandeau d'expiration — n'est qu'un confort ; un
// utilisateur peut modifier le code qu'il exécute. Cette fonction refait la
// vérification à chaque demande, avec l'horloge du serveur, juste avant de
// signer une URL.
//
// Les fichiers ne sont JAMAIS servis par cette fonction : elle rend une URL
// signée que le navigateur suit ensuite directement vers Cloud Storage. Faire
// transiter cinquante-huit PDF par une Cloud Function coûterait cher et
// serait lent, pour aucun gain de sécurité.

export const obtenirLienTelechargement = onCall(
  { region: "northamerica-northeast1", cors: true },
  async (requete) => {
    const uid = requete.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Connecte-toi pour télécharger.");
    }

    const documentId = String(requete.data?.documentId ?? "");
    const document = trouverDocument(documentId);

    // On lit l'accès seulement si le document existe : inutile d'interroger
    // Firestore pour un identifiant inventé.
    let acces = null;
    if (document) {
      const snap = await db.doc(`utilisateurs/${uid}/acces/${document.coursId}`).get();
      acces = versAccesDepuisDonnees(document.coursId, snap.data());
    }

    // L'horloge du serveur. Celle du navigateur ne décide de rien.
    const decision = deciderTelechargement(document, acces, Date.now());

    if (!decision.autorise) {
      logger.info(`[telechargement] ${uid} → ${documentId} refusé (${decision.raison})`);
      // « not-found » pour un document inconnu, « permission-denied » sinon :
      // on ne laisse pas deviner quels identifiants existent.
      const code = decision.raison === "document-inconnu" ? "not-found" : "permission-denied";
      throw new HttpsError(code, MESSAGES_REFUS[decision.raison]);
    }

    const fichier = getStorage().bucket().file(decision.chemin);

    // Une URL signée échappe à tout contrôle une fois émise. Sa brièveté est
    // la seule protection : quinze minutes suffisent à lancer un
    // téléchargement, pas à alimenter un lien partagé sur un forum.
    const [url] = await fichier.getSignedUrl({
      action: "read",
      expires: Date.now() + VALIDITE_LIEN_MINUTES * 60_000,
    });

    // Marque le premier téléchargement. C'est ce drapeau, et lui seul, qui
    // ferme le droit au remboursement — d'où l'importance qu'il soit posé
    // ici, par le serveur, et jamais par le navigateur.
    if (!acces?.aTelecharge) {
      await db.doc(`utilisateurs/${uid}/acces/${document!.coursId}`).update({
        aTelecharge: true,
        premierTelechargementLe: FieldValue.serverTimestamp(),
      });
    }

    logger.info(`[telechargement] ${uid} → ${documentId} autorisé`);
    return { url, titre: document!.titre };
  }
);
