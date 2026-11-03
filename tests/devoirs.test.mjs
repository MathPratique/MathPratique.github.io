// Tests purs de src/devoirs/regles.ts et de la numérotation du cahier.
// Les règles Firestore des devoirs sont testées à part, dans l'émulateur :
// tests/regles-devoirs.test.mjs.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { indexerCahier } from "../.tmp-test/data/banque-types.js";
import {
  UID_ADMINISTRATEUR,
  COURS_DEVOIRS,
  MAX_SEMAINES,
  DEVOIRS_VIDES,
  versDevoirs,
  peutLireDevoirs,
  accesOuvreDevoirs,
  grouperParChapitre,
  idsInconnus,
  trierParNumero,
  analyserListe,
  formaterDateDevoir,
  verifierSemaines,
} from "../.tmp-test/devoirs/regles.js";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lire = (chemin) => readFileSync(resolve(RACINE, chemin), "utf-8");
const CATALOGUE = JSON.parse(lire("src/data/calcul-differentiel/catalogue.json")).exercices;
const INDEX = indexerCahier(CATALOGUE);
const REGLES = lire("firestore.rules");

// ---------------------------------------------------------------------------
//  L'administrateur : une seule valeur, au même endroit des deux côtés
// ---------------------------------------------------------------------------

test("l'uid administrateur de l'interface est celui des règles Firestore", () => {
  const m = /function estAdministrateurSite\(\)\s*\{\s*return request\.auth != null && request\.auth\.uid == "([^"]+)";/.exec(REGLES);
  assert.ok(m, "estAdministrateurSite() introuvable dans firestore.rules");
  assert.equal(UID_ADMINISTRATEUR, m[1]);
});

test("l'uid administrateur est renseigné (pas la valeur d'attente)", () => {
  assert.notEqual(UID_ADMINISTRATEUR, "UID-A-RENSEIGNER");
  assert.match(UID_ADMINISTRATEUR, /^[A-Za-z0-9]{20,128}$/);
});

test("les cours de l'interface sont exactement ceux que les règles acceptent", () => {
  const m = /coursId in \[([^\]]*)\]/.exec(REGLES);
  assert.ok(m, "formeValide() : liste des cours introuvable");
  const cours = m[1].split(",").map((s) => s.trim().replace(/^'|'$/g, ""));
  assert.deepEqual(cours, [...COURS_DEVOIRS]);
  assert.match(REGLES, new RegExp(`semaines\\.size\\(\\) <= ${MAX_SEMAINES}\\b`));
});

// ---------------------------------------------------------------------------
//  Numéro du cahier
// ---------------------------------------------------------------------------

test("le numéro du cahier est la position dans le chapitre", () => {
  assert.deepEqual(INDEX.get("CD-C01-E026"), { chapitre: 1, section: "1.1.1", numero: 26 });
  assert.deepEqual(INDEX.get("CD-C01-E001"), { chapitre: 1, section: "1.3", numero: 1 });
  assert.equal(INDEX.get("CD-C01-E097").numero, 97);
  // Chaque chapitre est numéroté de 1 à n, sans trou.
  for (const ch of new Set(CATALOGUE.map((f) => f.chapitre))) {
    const numeros = CATALOGUE.filter((f) => f.chapitre === ch).map((f) => INDEX.get(f.id).numero);
    assert.deepEqual(numeros, numeros.map((_, i) => i + 1), `chapitre ${ch}`);
  }
});

test("indexerCahier repart à 1 à chaque chapitre, dans l'ordre des fiches", () => {
  const index = indexerCahier([
    { id: "A", chapitre: 2, section: "2.1" },
    { id: "B", chapitre: 1, section: "1.4" },
    { id: "C", chapitre: 2, section: "2.3" },
  ]);
  assert.equal(index.get("A").numero, 1);
  assert.equal(index.get("B").numero, 1);
  assert.equal(index.get("C").numero, 2);
});

// ---------------------------------------------------------------------------
//  « Coller une liste » — les lignes du document Word du chapitre 1
// ---------------------------------------------------------------------------

test("une ligne du Word donne son titre et ses IDs", () => {
  const r = analyserListe(
    "Cours du lundi 24 août : 26, 29, 31, 36, 38, 39, 41, 43, 44 et 49",
    1,
    INDEX,
  );
  assert.equal(r.titre, "Cours du lundi 24 août");
  assert.deepEqual(r.ids, [26, 29, 31, 36, 38, 39, 41, 43, 44, 49].map((n) => `CD-C01-E0${n}`));
  assert.deepEqual(r.horsChapitre, []);
  assert.deepEqual(r.illisibles, []);
});

test("les plages « à » sont dépliées, dans l'ordre écrit", () => {
  const r = analyserListe("50 à 54, 57, 58, 60, 62, 64 à 66, 68 et 70", 1, INDEX);
  assert.equal(r.titre, null);
  assert.deepEqual(
    r.ids.map((id) => INDEX.get(id).numero),
    [50, 51, 52, 53, 54, 57, 58, 60, 62, 64, 65, 66, 68, 70],
  );
});

test("« 1 à 8, 74 et 76 à 79 » : 13 exercices", () => {
  const r = analyserListe("1 à 8, 74 et 76 à 79", 1, INDEX);
  assert.equal(r.ids.length, 13);
  assert.equal(r.ids[0], "CD-C01-E001");
  assert.equal(r.ids.at(-1), "CD-C01-E079");
});

test("tiret, point-virgule et retour à la ligne sont acceptés ; les doublons sont retirés", () => {
  const r = analyserListe("13-15; 20 – 22\n13", 1, INDEX);
  assert.deepEqual(r.ids.map((id) => INDEX.get(id).numero), [13, 14, 15, 20, 21, 22]);
});

test("un numéro au-delà du chapitre et un morceau incompris sont signalés, pas inventés", () => {
  const r = analyserListe("96, 97, 98, exercice bonus, 54 à 50", 1, INDEX);
  assert.deepEqual(r.ids, ["CD-C01-E096", "CD-C01-E097"]);
  assert.deepEqual(r.horsChapitre, [98]);
  assert.deepEqual(r.illisibles, ["exercice bonus", "54 à 50"]);
});

test("le chapitre choisi décide des IDs : « 1 » au chapitre 5 est CD-C05-…", () => {
  const r = analyserListe("1", 5, INDEX);
  assert.equal(INDEX.get(r.ids[0]).chapitre, 5);
  assert.equal(INDEX.get(r.ids[0]).numero, 1);
});

// ---------------------------------------------------------------------------
//  Affichage
// ---------------------------------------------------------------------------

test("grouperParChapitre garde l'ordre choisi et omet les IDs inconnus", () => {
  const ids = ["CD-C02-E003", "CD-C01-E026", "CD-X99-E000", "CD-C02-E001"];
  const g = grouperParChapitre(ids, INDEX);
  assert.deepEqual(g.map((x) => x.chapitre), [2, 1]);
  assert.deepEqual(g[0].exercices.map((e) => e.numero), [3, 1]);
  assert.deepEqual(idsInconnus(ids, INDEX), ["CD-X99-E000"]);
});

test("trierParNumero : chapitre puis numéro, les inconnus à la fin", () => {
  const ids = ["CD-C02-E003", "CD-X99-E000", "CD-C01-E026", "CD-C01-E004"];
  assert.deepEqual(trierParNumero(ids, INDEX), [
    "CD-C01-E004",
    "CD-C01-E026",
    "CD-C02-E003",
    "CD-X99-E000",
  ]);
});

test("formaterDateDevoir écrit la date en français, et rien si elle est invalide", () => {
  assert.equal(formaterDateDevoir("2026-08-24"), "lundi 24 août");
  assert.equal(formaterDateDevoir("2026-09-02"), "mercredi 2 septembre");
  assert.equal(formaterDateDevoir("2026-02-30"), "");
  assert.equal(formaterDateDevoir("24 août"), "");
  assert.equal(formaterDateDevoir(null), "");
});

// ---------------------------------------------------------------------------
//  Lecture défensive et validation
// ---------------------------------------------------------------------------

test("versDevoirs tolère un document absent ou abîmé", () => {
  assert.deepEqual(versDevoirs(null), DEVOIRS_VIDES);
  const d = versDevoirs({
    version: 3,
    semaines: [
      { id: "a", titre: "S1", date: "2026-08-24", note: "lire 1.1", exercices: ["CD-C01-E001", 7] },
      "n'importe quoi",
      { titre: "S2", date: "demain" },
    ],
  });
  assert.equal(d.version, 3);
  assert.equal(d.semaines.length, 2);
  assert.deepEqual(d.semaines[0].exercices, ["CD-C01-E001"]);
  assert.equal(d.semaines[1].date, null);
  assert.equal(d.semaines[1].id, "semaine-3");
});

test("verifierSemaines bloque un titre vide et plus de 60 semaines, avertit d'un ID inconnu", () => {
  const s = (titre, exercices = []) => ({ id: titre || "x", titre, date: null, note: "", exercices });
  const r = verifierSemaines([s("S1", ["CD-X99-E000"]), s("  ")], INDEX);
  assert.deepEqual(r.bloquants, ["La semaine 2 n'a pas de titre."]);
  assert.equal(r.avertissements.length, 1);
  assert.match(r.avertissements[0], /CD-X99-E000/);
  const trop = Array.from({ length: MAX_SEMAINES + 1 }, (_, i) => s(`S${i}`));
  assert.equal(verifierSemaines(trop, INDEX).bloquants.length, 1);
});

// ---------------------------------------------------------------------------
//  Qui peut lire — miroir de la règle, pour l'affichage
// ---------------------------------------------------------------------------

const JOUR = 24 * 60 * 60 * 1000;
const MAINTENANT = Date.UTC(2026, 10, 2);
const acces = (champs) => ({
  coursId: "calcul-differentiel",
  source: "code-classe",
  dateDebut: MAINTENANT - 30 * JOUR,
  dateFin: MAINTENANT + 300 * JOUR,
  aTelecharge: false,
  ...champs,
});

test("un étudiant restreint, accès actif, peut lire ; sans niveau aussi (défaut restreint)", () => {
  assert.equal(peutLireDevoirs("etudiant", acces({ niveau: "restreint" }), MAINTENANT), true);
  assert.equal(peutLireDevoirs("etudiant", acces({}), MAINTENANT), true);
  assert.equal(accesOuvreDevoirs(acces({ niveau: "restreint" }), MAINTENANT), true);
});

test("acheteur, enseignant, accès expiré, sans accès, non connecté : non", () => {
  assert.equal(peutLireDevoirs("u", acces({ niveau: "acheteur" }), MAINTENANT), false);
  assert.equal(peutLireDevoirs("u", acces({ niveau: "enseignant" }), MAINTENANT), false);
  assert.equal(peutLireDevoirs("u", acces({ niveau: "restreint", dateFin: MAINTENANT - JOUR }), MAINTENANT), false);
  assert.equal(peutLireDevoirs("u", null, MAINTENANT), false);
  assert.equal(peutLireDevoirs(null, acces({ niveau: "restreint" }), MAINTENANT), false);
});

test("l'administrateur peut lire sans aucun accès au cours", () => {
  assert.equal(peutLireDevoirs(UID_ADMINISTRATEUR, null, MAINTENANT), true);
});
