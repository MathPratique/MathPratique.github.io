import test from "node:test";
import assert from "node:assert/strict";
import {
  ajouterMois,
  creerAcces,
  verifierAcces,
  remboursementPossible,
  DUREE_ACCES_MOIS,
} from "../.tmp-test/acces/regles.js";

const JOUR = 24 * 60 * 60 * 1000;
const t = (s) => new Date(s).getTime();

// ---------------------------------------------------------------------------
test("12 mois tombent sur le même quantième", () => {
  assert.equal(ajouterMois(t("2026-08-15T10:30:00"), 12), t("2027-08-15T10:30:00"));
});

test("le 31 janvier + 1 mois ne déborde pas sur mars", () => {
  // setMonth() donnerait le 3 mars. On veut le 28 février.
  assert.equal(ajouterMois(t("2026-01-31T09:00:00"), 1), t("2026-02-28T09:00:00"));
});

test("le 29 février d'une année bissextile + 12 mois donne le 28", () => {
  assert.equal(ajouterMois(t("2028-02-29T09:00:00"), 12), t("2029-02-28T09:00:00"));
});

// ---------------------------------------------------------------------------
test("un accès neuf dure exactement 12 mois et n'a rien de téléchargé", () => {
  const debut = t("2026-09-01T12:00:00");
  const a = creerAcces({ coursId: "calcul-differentiel", source: "achat", debut, reference: "cs_test_1" });
  assert.equal(a.dateFin, t("2027-09-01T12:00:00"));
  assert.equal(a.aTelecharge, false);
  assert.equal(a.reference, "cs_test_1");
  assert.equal(DUREE_ACCES_MOIS, 12);
});

test("un code de classe produit la même structure, seule la source diffère", () => {
  const debut = t("2026-09-01T12:00:00");
  const achat = creerAcces({ coursId: "c", source: "achat", debut });
  const classe = creerAcces({ coursId: "c", source: "code-classe", debut });
  assert.deepEqual({ ...achat, source: null }, { ...classe, source: null });
});

// ---------------------------------------------------------------------------
test("aucun accès → inactif, jamais une erreur", () => {
  for (const v of [null, undefined]) {
    const e = verifierAcces(v, t("2026-09-01"));
    assert.equal(e.actif, false);
    assert.equal(e.bientotExpire, false);
  }
});

test("actif le jour de l'achat, expiré à la seconde de la fin", () => {
  const debut = t("2026-09-01T12:00:00");
  const a = creerAcces({ coursId: "c", source: "achat", debut });
  assert.equal(verifierAcces(a, debut).actif, true);
  assert.equal(verifierAcces(a, a.dateFin - 1).actif, true);
  assert.equal(verifierAcces(a, a.dateFin).actif, false, "la borne de fin est exclue");
  assert.equal(verifierAcces(a, debut - 1).actif, false, "rien avant le début");
});

test("le seuil de rappel le plus serré gagne", () => {
  const debut = t("2026-09-01T12:00:00");
  const a = creerAcces({ coursId: "c", source: "achat", debut });
  const jAvantFin = (n) => a.dateFin - n * JOUR;

  assert.equal(verifierAcces(a, jAvantFin(60)).seuilRappel, null);
  assert.equal(verifierAcces(a, jAvantFin(30)).seuilRappel, 30);
  assert.equal(verifierAcces(a, jAvantFin(8)).seuilRappel, 30);
  // À 5 jours de la fin, c'est le message « 7 jours » qui doit sortir.
  assert.equal(verifierAcces(a, jAvantFin(5)).seuilRappel, 7);
  assert.equal(verifierAcces(a, jAvantFin(1)).seuilRappel, 7);
});

test("un accès expiré ne déclenche aucun rappel", () => {
  const debut = t("2026-09-01T12:00:00");
  const a = creerAcces({ coursId: "c", source: "achat", debut });
  const e = verifierAcces(a, a.dateFin + JOUR);
  assert.equal(e.actif, false);
  assert.equal(e.bientotExpire, false, "on ne relance pas quelqu'un dont l'accès est fini");
  assert.ok(e.joursRestants < 0);
});

// ---------------------------------------------------------------------------
test("remboursement : 7 jours, et rien de téléchargé", () => {
  const debut = t("2026-09-01T12:00:00");
  const a = creerAcces({ coursId: "c", source: "achat", debut });

  assert.equal(remboursementPossible(a, debut), true);
  assert.equal(remboursementPossible(a, debut + 7 * JOUR), true, "le 7e jour compte");
  assert.equal(remboursementPossible(a, debut + 7 * JOUR + 1), false);
  assert.equal(
    remboursementPossible({ ...a, aTelecharge: true }, debut),
    false,
    "un téléchargement ferme le droit au remboursement"
  );
  assert.equal(
    remboursementPossible({ ...a, source: "code-classe" }, debut),
    false,
    "un code de classe n'a rien à rembourser"
  );
  assert.equal(remboursementPossible(null, debut), false);
});
