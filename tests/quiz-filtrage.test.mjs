import test from "node:test";
import assert from "node:assert/strict";
import { compterCibles, correspondAuCanal, filtrerPool } from "../.tmp-test/quiz/filtrage.js";

// ---------------------------------------------------------------------------
//  Le partage du bassin entre sections visées et reste du chapitre
// ---------------------------------------------------------------------------

const ex = (id, chapitre, section, type, difficulte) => ({ id, chapitre, section, type, difficulte });

const BANQUE = [
  ex("a", 3, "3.3", "calcul-court", "moyen"),
  ex("b", 3, "3.3", "calcul-long", "difficile"),
  ex("c", 3, "3.3", "qcm", "facile"),
  ex("d", 3, "3.4", "calcul-court", "moyen"),
  ex("e", 3, "3.9", "calcul-court", "facile"),
  ex("f", 3, "3.9", "vrai-faux", "moyen"),
  ex("g", 2, "2.7", "calcul-court", "moyen"), // autre chapitre
];

test("les deux formats de calcul tombent dans le canal CALC", () => {
  assert.ok(correspondAuCanal("calcul-court", "exercise"));
  assert.ok(correspondAuCanal("calcul-long", "exercise"));
  assert.ok(correspondAuCanal("qcm", "mcq"));
  assert.ok(correspondAuCanal("vrai-faux", "tf"));
  assert.ok(!correspondAuCanal("qcm", "exercise"));
  assert.ok(!correspondAuCanal("calcul-court", "tf"));
});

test("sans section visée, tout le chapitre est cible et rien n'est complément", () => {
  const { cibles, complements } = filtrerPool(BANQUE, { chapitre: 3, canal: "exercise" });
  assert.deepEqual(cibles.map((e) => e.id), ["a", "b", "d", "e"]);
  assert.deepEqual(complements, []);
});

test("avec des sections, le reste du chapitre devient le complément", () => {
  const { cibles, complements } = filtrerPool(BANQUE, {
    chapitre: 3,
    canal: "exercise",
    sections: ["3.3"],
  });
  assert.deepEqual(cibles.map((e) => e.id), ["a", "b"]);
  assert.deepEqual(complements.map((e) => e.id), ["d", "e"]);
  // Jamais un autre chapitre, même en complément : « g » reste dehors.
  assert.ok(![...cibles, ...complements].some((e) => e.id === "g"));
});

test("le niveau filtre les deux files de la même façon", () => {
  const { cibles, complements } = filtrerPool(BANQUE, {
    chapitre: 3,
    canal: "exercise",
    difficulte: "moyen",
    sections: ["3.3"],
  });
  assert.deepEqual(cibles.map((e) => e.id), ["a"]);
  assert.deepEqual(complements.map((e) => e.id), ["d"]);
});

test("une section sans exercice du bon canal donne une cible vide et un complément utilisable", () => {
  // Le cas qui a motivé le complément : la section existe, mais pas pour ce
  // canal — ou, pour un visiteur sans accès, pas dans le bassin gratuit.
  const { cibles, complements } = filtrerPool(BANQUE, {
    chapitre: 3,
    canal: "tf",
    sections: ["3.3"],
  });
  assert.deepEqual(cibles, []);
  assert.deepEqual(complements.map((e) => e.id), ["f"]);
});

test("le prédicat `utilisable` écarte avant le partage", () => {
  const sansB = (e) => e.id !== "b";
  const { cibles } = filtrerPool(BANQUE, { chapitre: 3, canal: "exercise", sections: ["3.3"] }, sansB);
  assert.deepEqual(cibles.map((e) => e.id), ["a"]);
});

test("compterCibles ignore le complément", () => {
  // Ce chiffre sert à griser les champs de l'interface : il doit promettre
  // la notion demandée, pas le chapitre entier.
  assert.equal(compterCibles(BANQUE, { chapitre: 3, canal: "exercise", sections: ["3.3"] }), 2);
  assert.equal(compterCibles(BANQUE, { chapitre: 3, canal: "exercise" }), 4);
  assert.equal(compterCibles(BANQUE, { chapitre: 3, canal: "tf", sections: ["3.3"] }), 0);
});

test("une liste de sections vide vaut « tout le chapitre »", () => {
  const { cibles, complements } = filtrerPool(BANQUE, { chapitre: 3, canal: "exercise", sections: [] });
  assert.equal(cibles.length, 4);
  assert.deepEqual(complements, []);
});
