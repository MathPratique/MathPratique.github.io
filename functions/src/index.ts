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
// Import ciblé du logger, PAS depuis "firebase-functions/v2" : le point
// d'entrée racine v2 charge tous les providers (dont database), qui
// requièrent @firebase/database-compat, qui requiert @firebase/app. Un seul
// paquet manquant dans le node_modules déployé faisait crasher les quatre
// containers au boot avec « Cannot find module '@firebase/app' ». Le
// sous-chemin dédié évite toute la cascade — le logger n'a rien à voir
// avec les providers, il ne devrait pas les charger.
import * as logger from "firebase-functions/logger";
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
import { DUREE_ACCES_MOIS, verifierAcces } from "../../src/acces/regles.js";
import { versAccesDepuisDonnees } from "./lecture.js";
import { CONTENT_HASH_CD } from "./data/exercices-cd-version.js";
// La banque calc-diff complète (305 exos AVEC contenu) — bundlée avec la
// Function. Ne quitte jamais le serveur sans passer par verifierAcces()
// dans obtenirExercices() ci-dessous.
//
// ⚠️ A1 PROVISOIRE — la banque calc-diff vit ici, dans le bundle des Cloud
// Functions. Conséquence : toute correction de contenu d'exercice exige un
// redéploiement des fonctions de paiement (creerSessionCheckout,
// webhookStripe, obtenirLienTelechargement). Bénin quand le contenu change
// tous les mois, pénible si ça devient hebdomadaire. À revoir avant
// novembre 2026 : migration vers un doc Firestore admin lu par la Function
// (A2, cf. DIAGNOSTIC-ACHAT.md §5).
import banqueCd from "./data/exercices-cd.json" with { type: "json" };

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
          // `acces.niveau` provient de creerAcces via deciderWebhook, qui
          // passe explicitement « acheteur » pour tout paiement Stripe
          // validé. On n'invente rien ici — on écrit ce que la logique
          // pure a décidé, pour garder la seule source de vérité du
          // niveau au point de création de l'accès.
          niveau: acces.niveau,
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

/**
 * Rend un titre francophone du catalogue sûr pour l'en-tête
 * Content-Disposition. La RFC 6266 recommande RFC 5987
 * (`filename*=UTF-8''<encoded>`) pour les caractères non-ASCII, mais son
 * support navigateur reste inégal — on choisit un nom ASCII pur, plutôt
 * qu'un nom joli qui casse chez quelqu'un. Le titre reste visible dans
 * /mon-compte ; ici c'est seulement le nom du fichier téléchargé.
 *
 * Transformations, dans l'ordre :
 *   1. décomposer les accents (NFD) puis retirer les marques combinantes
 *      (« é » → « e », « à » → « a », « ç » → « c ») ;
 *   2. remplacer tout ce qui n'est pas [A-Za-z0-9._-] par « - » — englobe
 *      les espaces, les tirets cadratins « — », les deux-points, les
 *      parenthèses et le reste de la ponctuation ;
 *   3. effondrer les séries de « - » consécutifs en un seul ;
 *   4. rogner les « - » en début et en fin ;
 *   5. ajouter .pdf.
 *
 * Exemples issus du catalogue :
 *   « Chapitre 1 — Fonctions et domaines »
 *     → Chapitre-1-Fonctions-et-domaines.pdf
 *   « Exercices — chapitre 4 : La dérivée : définition (étudiant) »
 *     → Exercices-chapitre-4-La-derivee-definition-etudiant.pdf
 *   « Examen intra 1 — grille de correction »
 *     → Examen-intra-1-grille-de-correction.pdf
 */
function nomFichierPourAttachment(titre: string): string {
  const sansAccents = titre.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const asciiSeulement = sansAccents.replace(/[^A-Za-z0-9._-]+/g, "-");
  const compact = asciiSeulement.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return `${compact}.pdf`;
}

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
    //
    // `responseDisposition: attachment` force le navigateur à télécharger
    // le PDF plutôt que de l'ouvrir dans sa visionneuse intégrée —
    // l'étudiant reste sur /mon-compte au lieu d'être expulsé vers un
    // onglet PDF, et les autres cartes d'accès restent à un clic.
    //
    // Le nom du fichier vient du titre du catalogue, assaini en ASCII
    // (voir nomFichierPourAttachment ci-dessus). Repli sur "document" si
    // jamais `document` était nul — situation qui ne peut pas se produire
    // aujourd'hui (decision.autorise l'exige non-null) mais que TypeScript
    // ne prouve pas, et qu'un refactor futur de deciderTelechargement
    // pourrait casser. Coût nul, pas de 500 sur le cas limite.
    //
    // Les guillemets doubles autour du nom sont sûrs parce que
    // nomFichierPourAttachment garantit qu'il ne contient que
    // [A-Za-z0-9._-] — aucun caractère qui pourrait casser l'échappement.
    const nomAttachment = nomFichierPourAttachment(document?.titre ?? "document");
    const [url] = await fichier.getSignedUrl({
      action: "read",
      expires: Date.now() + VALIDITE_LIEN_MINUTES * 60_000,
      responseDisposition: `attachment; filename="${nomAttachment}"`,
    });

    // Marque le premier téléchargement. C'est ce drapeau, et lui seul, qui
    // ferme le droit au remboursement — d'où l'importance qu'il soit posé
    // ici, par le serveur, et jamais par le navigateur.
    //
    // Garde explicite sur `document` : contrairement à responseDisposition
    // ci-dessus où un repli sur "document.pdf" est acceptable, ici un
    // chemin Firestore construit avec un coursId par défaut écrirait au
    // MAUVAIS endroit en silence — pire qu'une erreur, plus difficile à
    // trouver après coup. Si l'invariant « decision.autorise implique
    // document non-null » venait à casser suite à un refactor de
    // deciderTelechargement, on refuse l'écriture et on journalise en
    // erreur (visible dans les alertes) plutôt que de corrompre des
    // données. Le téléchargement lui-même reste accordé — l'URL signée
    // vient d'être renvoyée à l'étudiant, on ne la retire pas.
    if (!acces?.aTelecharge) {
      if (!document) {
        logger.error(
          `[telechargement] ${uid} → ${documentId} : autorisé, mais document ` +
            `introuvable au moment de poser aTelecharge. Invariant rompu dans ` +
            `deciderTelechargement — à investiguer. Aucune écriture Firestore faite.`,
        );
      } else {
        await db.doc(`utilisateurs/${uid}/acces/${document.coursId}`).update({
          aTelecharge: true,
          premierTelechargementLe: FieldValue.serverTimestamp(),
        });
      }
    }

    logger.info(`[telechargement] ${uid} → ${documentId} autorisé`);
    return { url, titre: document!.titre };
  }
);

// ---------------------------------------------------------------------------
//  obtenirExercices — sert les 305 exos calc-diff aux détenteurs d'accès
// ---------------------------------------------------------------------------
//
// Le bassin complet vit dans le bundle de cette Function (voir import de
// banqueCd ci-dessus). Il n'est renvoyé qu'après vérification de l'accès
// avec l'horloge du serveur — la MÊME règle que pour les téléchargements.
//
// Un utilisateur sans compte, sans accès ou avec accès expiré reçoit un
// « permission-denied » et rien d'autre. Le contenu ne quitte jamais le
// serveur dans ce cas.

export const obtenirExercices = onCall(
  { region: "northamerica-northeast1", cors: true },
  async (requete) => {
    const uid = requete.auth?.uid;
    if (!uid) {
      throw new HttpsError("unauthenticated", "Connecte-toi pour accéder à la banque complète.");
    }

    const coursId = String(requete.data?.coursId ?? "calcul-differentiel");
    if (coursId !== "calcul-differentiel") {
      // Aujourd'hui un seul cours a une banque complète en ligne. Le jour où
      // d'autres cours l'auront, on switch sur coursId. Une valeur inconnue
      // se traite comme un accès refusé, pas comme une erreur — on ne
      // divulgue rien sur les cours disponibles.
      throw new HttpsError("permission-denied", "Aucun accès pour ce cours.");
    }

    const snap = await db.doc(`utilisateurs/${uid}/acces/${coursId}`).get();
    const acces = versAccesDepuisDonnees(coursId, snap.data());
    const etat = verifierAcces(acces, Date.now());

    if (!etat.actif) {
      logger.info(`[exercices] ${uid} → ${coursId} refusé (accès inactif)`);
      throw new HttpsError(
        "permission-denied",
        "Ton accès à la banque complète n'est pas actif.",
      );
    }

    // Contrôle de cohérence — le hash figé dans exercices-cd-version.ts
    // doit correspondre à celui du blob. Si la personne qui a déployé a
    // édité le JSON à la main sans passer par le script de sync, on
    // refuse plutôt que de servir un contenu incohérent.
    if ((banqueCd as { contentHash: string }).contentHash !== CONTENT_HASH_CD) {
      logger.error(
        `[exercices] hash divergent : blob=${(banqueCd as { contentHash: string }).contentHash} constante=${CONTENT_HASH_CD}`,
      );
      throw new HttpsError("internal", "Erreur de cohérence de la banque.");
    }

    logger.info(`[exercices] ${uid} → ${coursId} autorisé`);
    return banqueCd;
  },
);
