import test from "node:test";
import assert from "node:assert/strict";
import {
  filtrerIds,
  estComplete,
  estMarque,
  compteAvecPrefixe,
  PROGRESSION_VIDE,
} from "../.tmp-test/progression/regles.js";

// Fabrique une Progression à partir de deux listes d'IDs — plus lisible
// que d'écrire les dictionnaires à la main pour chaque cas.
function progression({ completes = [], marques = [] } = {}) {
  return {
    completes: Object.fromEntries(completes.map((id, i) => [id, i + 1])),
    marques: Object.fromEntries(marques.map((id, i) => [id, i + 1])),
    version: 1,
  };
}

// ---------------------------------------------------------------------------
//  Filtre « tous » — le simple
// ---------------------------------------------------------------------------

test("« tous » retourne toute la liste, même sur progression vide ou absente", () => {
  const ids = ["A", "B", "C"];
  assert.deepEqual(filtrerIds(PROGRESSION_VIDE, ids, "tous"), ids);
  assert.deepEqual(filtrerIds(null, ids, "tous"), ids);
  assert.deepEqual(filtrerIds(undefined, ids, "tous"), ids);
});

// ---------------------------------------------------------------------------
//  Les trois filtres qui regardent progression
// ---------------------------------------------------------------------------

test("« completes » ne retourne que les IDs cochés", () => {
  const p = progression({ completes: ["A", "C"] });
  assert.deepEqual(filtrerIds(p, ["A", "B", "C", "D"], "completes"), ["A", "C"]);
});

test("« non-completes » retourne l'exact complément de « completes »", () => {
  const p = progression({ completes: ["A", "C"] });
  assert.deepEqual(filtrerIds(p, ["A", "B", "C", "D"], "non-completes"), ["B", "D"]);
});

test("« marques » ne retourne que les IDs étoilés, indépendamment de « completes »", () => {
  const p = progression({ completes: ["A"], marques: ["B", "C"] });
  assert.deepEqual(filtrerIds(p, ["A", "B", "C", "D"], "marques"), ["B", "C"]);
});

// ---------------------------------------------------------------------------
//  INVARIANT — les deux marqueurs sont INDÉPENDANTS
// ---------------------------------------------------------------------------
//
// C'est le test qui distingue la vraie sémantique (deux dictionnaires
// disjoints) d'une modélisation faussement pragmatique (un champ unique
// à trois valeurs mutuellement exclusives : complete / non-complete /
// a-revoir). Si un jour un refactor tente de fusionner completes et
// marques en un seul champ, ce test casse au premier passage.
//
// Ne pas le retirer sans avoir POSITIVEMENT décidé de renoncer à
// l'indépendance des deux marqueurs.

test("INVARIANT — un exercice coché ET marqué apparaît dans « completes » ET dans « marques »", () => {
  const p = progression({ completes: ["A"], marques: ["A"] });
  assert.deepEqual(filtrerIds(p, ["A"], "completes"), ["A"]);
  assert.deepEqual(filtrerIds(p, ["A"], "marques"), ["A"]);
  // Et il n'est PAS dans « non-completes » puisqu'il est coché.
  assert.deepEqual(filtrerIds(p, ["A"], "non-completes"), []);
});

test("INVARIANT — un exercice ni coché ni marqué est dans « non-completes » et nulle part ailleurs (hors « tous »)", () => {
  const p = progression(); // vide
  assert.deepEqual(filtrerIds(p, ["A"], "non-completes"), ["A"]);
  assert.deepEqual(filtrerIds(p, ["A"], "completes"), []);
  assert.deepEqual(filtrerIds(p, ["A"], "marques"), []);
});

test("INVARIANT — le crochet et l'étoile ne s'excluent pas dans les prédicats", () => {
  // estComplete et estMarque doivent pouvoir tous deux retourner true
  // pour un même id — c'est la base de l'indépendance.
  const p = progression({ completes: ["A"], marques: ["A"] });
  assert.equal(estComplete(p, "A"), true);
  assert.equal(estMarque(p, "A"), true);
});

// ---------------------------------------------------------------------------
//  Progression null / undefined — comportement de secours
// ---------------------------------------------------------------------------

test("progression null : TOUS les filtres retournent la liste entière (secours)", () => {
  // Sans progression, on ne peut discriminer — on retourne tout, ce qui
  // vaut mieux qu'un affichage vide qui inquiéterait l'étudiant.
  const ids = ["A", "B"];
  assert.deepEqual(filtrerIds(null, ids, "tous"), ids);
  assert.deepEqual(filtrerIds(null, ids, "completes"), ids);
  assert.deepEqual(filtrerIds(null, ids, "non-completes"), ids);
  assert.deepEqual(filtrerIds(null, ids, "marques"), ids);
});

// ---------------------------------------------------------------------------
//  Cas limites
// ---------------------------------------------------------------------------

test("liste vide reste vide quel que soit le filtre", () => {
  const p = progression({ completes: ["A"], marques: ["A"] });
  assert.deepEqual(filtrerIds(p, [], "tous"), []);
  assert.deepEqual(filtrerIds(p, [], "completes"), []);
  assert.deepEqual(filtrerIds(p, [], "non-completes"), []);
  assert.deepEqual(filtrerIds(p, [], "marques"), []);
});

test("l'ordre des IDs en entrée est préservé", () => {
  const p = progression({ completes: ["Z", "A", "M"] });
  assert.deepEqual(
    filtrerIds(p, ["A", "M", "Z", "B"], "completes"),
    ["A", "M", "Z"],
  );
});

// ---------------------------------------------------------------------------
//  compteAvecPrefixe — bonus, cohérent avec la même modélisation
// ---------------------------------------------------------------------------

test("compteAvecPrefixe compte séparément completes et marques sur le même préfixe", () => {
  const p = progression({
    completes: ["CD-C01-E001", "CD-C01-E002", "CD-C02-E001"],
    marques: ["CD-C01-E001", "CD-C07-E010"],
  });
  // CD-C01-E001 est dans les deux : il compte pour 1 dans chaque total.
  assert.equal(compteAvecPrefixe(p, "completes", "CD-C01-"), 2);
  assert.equal(compteAvecPrefixe(p, "marques", "CD-C01-"), 1);
  assert.equal(compteAvecPrefixe(p, "completes", "CD-C02-"), 1);
  assert.equal(compteAvecPrefixe(p, "marques", "CD-C07-"), 1);
});
