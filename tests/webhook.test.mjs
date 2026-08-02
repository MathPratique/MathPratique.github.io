import test from "node:test";
import assert from "node:assert/strict";
import { deciderWebhook, TYPE_TRAITE } from "../.tmp-test/webhook.js";
import { DUREE_ACCES_MOIS } from "../.tmp-test/regles.js";

const MAINTENANT = new Date("2026-09-01T14:00:00Z").getTime();

/** Une session Stripe payée, complète, telle qu'on l'attend. */
const session = (surcharge = {}) => ({
  type: TYPE_TRAITE,
  data: {
    object: {
      id: "cs_test_a1",
      payment_status: "paid",
      metadata: { uid: "utilisateur-42", coursId: "calcul-differentiel" },
      ...surcharge,
    },
  },
});

// ---------------------------------------------------------------------------
//  Le cas nominal
// ---------------------------------------------------------------------------

test("un paiement complété ouvre un accès de 12 mois", () => {
  const d = deciderWebhook(session(), false, MAINTENANT);
  assert.equal(d.action, "octroyer");
  assert.equal(d.uid, "utilisateur-42");
  assert.equal(d.sessionId, "cs_test_a1");
  assert.equal(d.acces.coursId, "calcul-differentiel");
  assert.equal(d.acces.source, "achat");
  assert.equal(d.acces.dateDebut, MAINTENANT);
  assert.equal(d.acces.dateFin, new Date("2027-09-01T14:00:00Z").getTime());
  assert.equal(DUREE_ACCES_MOIS, 12);
});

test("la session Stripe sert de référence, pour l'audit", () => {
  const d = deciderWebhook(session(), false, MAINTENANT);
  assert.equal(d.acces.reference, "cs_test_a1");
});

test("un accès neuf n'a rien de téléchargé — le remboursement reste ouvert", () => {
  const d = deciderWebhook(session(), false, MAINTENANT);
  assert.equal(d.acces.aTelecharge, false);
});

// ---------------------------------------------------------------------------
//  Idempotence — Stripe réessaie
// ---------------------------------------------------------------------------

test("une session déjà traitée est ignorée", () => {
  const d = deciderWebhook(session(), true, MAINTENANT);
  assert.equal(d.action, "ignorer");
  assert.equal(d.raison, "deja-traite");
});

test("rejouer le webhook ne prolonge pas la période", () => {
  const premier = deciderWebhook(session(), false, MAINTENANT);
  // Stripe réessaie une heure plus tard ; le journal contient la session.
  const second = deciderWebhook(session(), true, MAINTENANT + 3600_000);
  assert.equal(premier.action, "octroyer");
  assert.equal(second.action, "ignorer");
  assert.ok(!("acces" in second), "aucun accès ne doit être reconstruit");
});

// ---------------------------------------------------------------------------
//  Ce qui ne doit rien ouvrir
// ---------------------------------------------------------------------------

test("un autre type d'événement est ignoré", () => {
  for (const type of ["payment_intent.succeeded", "charge.refunded", "checkout.session.expired"]) {
    const d = deciderWebhook({ ...session(), type }, false, MAINTENANT);
    assert.equal(d.action, "ignorer", type);
    assert.equal(d.raison, "type-non-traite", type);
  }
});

test("un paiement non complété n'ouvre rien", () => {
  // « PAID » en majuscules n'est pas « paid » : la comparaison est stricte,
  // et c'est voulu. Stripe n'envoie que des minuscules ; tolérer une variante
  // reviendrait à accepter une valeur qui ne vient pas de Stripe.
  for (const statut of ["unpaid", "no_payment_required", "PAID", "pending"]) {
    const d = deciderWebhook(session({ payment_status: statut }), false, MAINTENANT);
    assert.equal(d.action, "ignorer", statut);
    assert.equal(d.raison, "paiement-non-complete", statut);
  }
});

test("un payment_status vide ou absent est difforme, donc rejeté", () => {
  // Rejeter plutôt qu'ignorer : un événement qu'on ne sait pas lire mérite
  // qu'on le voie passer dans les journaux, pas qu'il disparaisse en silence.
  for (const surcharge of [{ payment_status: "" }, { payment_status: 1 }, {}]) {
    const e = session();
    e.data.object = {
      id: "cs_x",
      metadata: { uid: "u1", coursId: "c" },
      ...surcharge,
    };
    const d = deciderWebhook(e, false, MAINTENANT);
    assert.equal(d.action, "rejeter", JSON.stringify(surcharge));
  }
});

test("INVARIANT — hors du cas nominal, aucun accès n'est jamais construit", () => {
  // Le seul test qui compte vraiment : quoi qu'on envoie, si ce n'est pas un
  // paiement complété, non rejoué et correctement étiqueté, rien ne s'ouvre.
  const anormaux = [
    { ...session(), type: "checkout.session.expired" },
    { ...session(), type: undefined },
    {},
    { type: TYPE_TRAITE, data: { object: null } },
    { type: TYPE_TRAITE, data: { object: { id: "cs", payment_status: "paid" } } },
    { type: TYPE_TRAITE, data: { object: { id: "cs", payment_status: "unpaid", metadata: { uid: "u", coursId: "c" } } } },
  ];
  for (const e of anormaux) {
    for (const dejaTraite of [false, true]) {
      const d = deciderWebhook(e, dejaTraite, MAINTENANT);
      assert.notEqual(d.action, "octroyer", JSON.stringify(e));
      assert.ok(!("acces" in d), "aucun accès ne doit exister sur ces décisions");
    }
  }
  // Et le rejeu du cas nominal n'en construit pas non plus.
  assert.ok(!("acces" in deciderWebhook(session(), true, MAINTENANT)));
});

test("un impayé est écarté AVANT la consultation du journal", () => {
  // Sinon une session impayée pourrait être inscrite au journal et bloquer
  // le vrai paiement qui suit.
  const d = deciderWebhook(session({ payment_status: "unpaid" }), false, MAINTENANT);
  assert.equal(d.raison, "paiement-non-complete");
  assert.notEqual(d.raison, "deja-traite");
});

// ---------------------------------------------------------------------------
//  Métadonnées absentes : on rejette, on n'invente pas
// ---------------------------------------------------------------------------

test("sans uid ni coursId, on rejette plutôt que de deviner", () => {
  const cas = [
    { metadata: {} },
    { metadata: { uid: "u1" } },
    { metadata: { coursId: "calcul-differentiel" } },
    { metadata: { uid: "   ", coursId: "calcul-differentiel" } },
    { metadata: { uid: "u1", coursId: "" } },
    { metadata: null },
    {},
  ];
  for (const surcharge of cas) {
    const e = session();
    e.data.object = { id: "cs_x", payment_status: "paid", ...surcharge };
    const d = deciderWebhook(e, false, MAINTENANT);
    assert.equal(d.action, "rejeter", JSON.stringify(surcharge));
    assert.equal(d.raison, "metadonnees-manquantes");
  }
});

test("un uid non textuel ne passe pas", () => {
  const e = session();
  e.data.object = { id: "cs_x", payment_status: "paid", metadata: { uid: 42, coursId: "c" } };
  assert.equal(deciderWebhook(e, false, MAINTENANT).action, "rejeter");
});

test("un événement difforme est rejeté sans lever d'exception", () => {
  for (const objet of [null, undefined, "texte", 7, []]) {
    const d = deciderWebhook({ type: TYPE_TRAITE, data: { object: objet } }, false, MAINTENANT);
    assert.equal(d.action, "rejeter");
  }
  assert.equal(deciderWebhook({}, false, MAINTENANT).action, "ignorer");
  assert.equal(deciderWebhook({ type: TYPE_TRAITE }, false, MAINTENANT).action, "rejeter");
});

// ---------------------------------------------------------------------------
//  L'horloge vient du serveur
// ---------------------------------------------------------------------------

test("la date de début est celle passée en argument, pas l'heure courante", () => {
  const passe = new Date("2020-01-15T00:00:00Z").getTime();
  const d = deciderWebhook(session(), false, passe);
  assert.equal(d.acces.dateDebut, passe);
  assert.equal(d.acces.dateFin, new Date("2021-01-15T00:00:00Z").getTime());
});
