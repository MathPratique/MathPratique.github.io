import test from "node:test";
import assert from "node:assert/strict";
import {
  filtrerIds,
  estComplete,
  estMarque,
  compteParmi,
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
//  compteParmi — le compteur « X / N complétés » sous chaque chapitre
// ---------------------------------------------------------------------------

test("compteParmi compte séparément completes et marques sur la même liste", () => {
  const p = progression({
    completes: ["CD-C01-E001", "CD-C01-E002", "CD-C02-E001"],
    marques: ["CD-C01-E001", "CD-C07-E010"],
  });
  const ch01 = ["CD-C01-E001", "CD-C01-E002", "CD-C01-E003"];
  // CD-C01-E001 est dans les deux : il compte pour 1 dans chaque total.
  assert.equal(compteParmi(p, "completes", ch01), 2);
  assert.equal(compteParmi(p, "marques", ch01), 1);
  assert.equal(compteParmi(p, "completes", ["CD-C02-E001"]), 1);
  assert.equal(compteParmi(p, "marques", ["CD-C07-E010"]), 1);
});

test("compteParmi ignore la progression hors de la liste fournie", () => {
  const p = progression({ completes: ["CD-C01-E001", "CD-C02-E001"] });
  // Le dénominateur affiché est ids.length : le numérateur ne doit jamais
  // le dépasser, même quand d'autres chapitres sont cochés. C'est ce qui
  // pouvait produire « 12 / 9 complétés » sous un filtre de difficulté.
  assert.equal(compteParmi(p, "completes", ["CD-C01-E001"]), 1);
  assert.equal(compteParmi(p, "completes", []), 0);
});

test("compteParmi ne dépend pas du schéma de nommage du cours", () => {
  // Le défaut réel : la page de probabilités cherchait des « CD-C01- »
  // parmi des « ch01-fac-001 » et affichait « 0 / 97 » en permanence.
  const p = progression({
    completes: ["ch01-fac-001", "ch01-qcm-003"],
    marques: ["ch02-dif-137"],
  });
  assert.equal(compteParmi(p, "completes", ["ch01-fac-001", "ch01-qcm-003", "ch01-fac-002"]), 2);
  assert.equal(compteParmi(p, "marques", ["ch02-dif-137"]), 1);
});

test("compteParmi tolère une progression absente", () => {
  assert.equal(compteParmi(null, "completes", ["A"]), 0);
  assert.equal(compteParmi(undefined, "marques", ["A"]), 0);
  assert.equal(compteParmi(PROGRESSION_VIDE, "completes", ["A"]), 0);
});
