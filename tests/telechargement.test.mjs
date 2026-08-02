import test from "node:test";
import assert from "node:assert/strict";
import { deciderTelechargement, VALIDITE_LIEN_MINUTES } from "../.tmp-test/telechargement.js";
import { DOCUMENTS, trouverDocument } from "../.tmp-test/documents.js";
import { creerAcces } from "../.tmp-test/regles.js";

const DEBUT = new Date("2026-09-01T12:00:00Z").getTime();
const acces = (surcharge = {}) => ({
  ...creerAcces({ coursId: "calcul-differentiel", source: "achat", debut: DEBUT }),
  ...surcharge,
});
const doc = trouverDocument("exercices-ch04");

// ---------------------------------------------------------------------------
//  Le catalogue
// ---------------------------------------------------------------------------

test("le catalogue couvre les 58 documents payants", () => {
  // 16 notes (7 chapitres × 2 versions + 2 recueils complets)
  // 14 exercices (7 recueils + 7 solutions)
  // 10 révision (5 séries + 5 solutions)
  // 18 examens (6 × énoncé, corrigé, grille)
  assert.equal(DOCUMENTS.length, 58);
  const parCategorie = DOCUMENTS.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] ?? 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(parCategorie, { notes: 16, exercices: 14, revision: 10, examens: 18 });
});

test("aucun identifiant en double", () => {
  const ids = DOCUMENTS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("aucun chemin en double, et aucun ne sort du dossier du cours", () => {
  const chemins = DOCUMENTS.map((d) => d.chemin);
  assert.equal(new Set(chemins).size, chemins.length);
  for (const c of chemins) {
    assert.ok(c.startsWith("calcul-differentiel/"), c);
    assert.ok(!c.includes(".."), `traversée de répertoire : ${c}`);
    assert.ok(c.endsWith(".pdf"), c);
  }
});

test("un identifiant inconnu ne renvoie rien", () => {
  assert.equal(trouverDocument("nexiste-pas"), null);
  assert.equal(trouverDocument(""), null);
});

// ---------------------------------------------------------------------------
//  L'autorisation
// ---------------------------------------------------------------------------

test("un accès actif ouvre le document", () => {
  const d = deciderTelechargement(doc, acces(), DEBUT + 1000);
  assert.equal(d.autorise, true);
  assert.equal(d.chemin, "calcul-differentiel/exercices/ch04-recueil.pdf");
});

test("sans accès, rien", () => {
  const d = deciderTelechargement(doc, null, DEBUT);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "aucun-acces");
});

test("un accès expiré ne télécharge plus", () => {
  const a = acces();
  const d = deciderTelechargement(doc, a, a.dateFin + 1);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "acces-expire");
});

test("la dernière seconde d'accès fonctionne encore", () => {
  const a = acces();
  assert.equal(deciderTelechargement(doc, a, a.dateFin - 1).autorise, true);
  assert.equal(deciderTelechargement(doc, a, a.dateFin).autorise, false);
});

test("un accès à un autre cours ne donne rien", () => {
  const d = deciderTelechargement(doc, acces({ coursId: "calcul-integral" }), DEBUT);
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "mauvais-cours");
});

test("un document inconnu est refusé AVANT toute question d'accès", () => {
  // Sinon, la réponse révélerait quels identifiants existent.
  const d = deciderTelechargement(null, null, DEBUT);
  assert.equal(d.raison, "document-inconnu");
  const e = deciderTelechargement(null, acces(), DEBUT);
  assert.equal(e.raison, "document-inconnu");
});

test("un code de classe donne les mêmes droits qu'un achat", () => {
  const d = deciderTelechargement(doc, acces({ source: "code-classe" }), DEBUT + 1000);
  assert.equal(d.autorise, true);
});

test("INVARIANT — aucun chemin n'est jamais rendu sans autorisation", () => {
  const cas = [
    [null, null],
    [null, acces()],
    [doc, null],
    [doc, acces({ coursId: "autre" })],
  ];
  for (const [d, a] of cas) {
    const r = deciderTelechargement(d, a, DEBUT);
    assert.equal(r.autorise, false);
    assert.ok(!("chemin" in r), "aucun chemin ne doit fuiter sur un refus");
  }
  // Et pour un accès expiré, à toute date postérieure.
  const a = acces();
  for (const t of [a.dateFin, a.dateFin + 86400_000, a.dateFin + 1e10]) {
    const r = deciderTelechargement(doc, a, t);
    assert.equal(r.autorise, false);
    assert.ok(!("chemin" in r));
  }
});

test("la validité du lien reste courte", () => {
  assert.ok(VALIDITE_LIEN_MINUTES > 0 && VALIDITE_LIEN_MINUTES <= 30);
});
