import test from "node:test";
import assert from "node:assert/strict";
import { encodeCustomQuiz, decodeCustomQuiz } from "../.tmp-test/quiz/specs.js";

// ---------------------------------------------------------------------------
//  Le codec d'URL du quiz personnalisé
// ---------------------------------------------------------------------------
//
// Ces adresses circulent : un étudiant partage son quiz par copier-coller, et
// une adresse d'hier doit continuer à marcher demain. D'où les deux familles
// de tests — la compatibilité avec le format d'avant les sections, et le
// traitement d'une adresse bricolée à la main.

test("une consigne simple fait l'aller-retour", () => {
  const specs = [{ lessonId: "L15", exerciseCount: 2, mcqCount: 3, tfCount: 1 }];
  assert.equal(encodeCustomQuiz(specs), "L15-e2m3t1");
  assert.deepEqual(decodeCustomQuiz("L15-e2m3t1"), specs);
});

test("les adresses d'avant les sections se décodent inchangées", () => {
  // Format en circulation depuis août 2026. Aucun champ `sections` ne doit
  // apparaître : son absence vaut « tout le chapitre ».
  const specs = decodeCustomQuiz("PSD1-e2m3t1-df_CD5-e1m0t2");
  assert.deepEqual(specs, [
    { lessonId: "PSD1", exerciseCount: 2, mcqCount: 3, tfCount: 1, difficulty: "Facile" },
    { lessonId: "CD5", exerciseCount: 1, mcqCount: 0, tfCount: 2 },
  ]);
  assert.ok(!("sections" in specs[0]));
});

test("les sections font l'aller-retour, niveau compris", () => {
  const specs = [
    { lessonId: "PSD3", exerciseCount: 2, mcqCount: 0, tfCount: 0, difficulty: "Moyen", sections: ["3.3", "3.4"] },
    { lessonId: "CD1", exerciseCount: 1, mcqCount: 1, tfCount: 0, sections: ["1.1.3"] },
  ];
  const code = encodeCustomQuiz(specs);
  assert.equal(code, "PSD3-e2m0t0-dm-s3.3,3.4_CD1-e1m1t0-s1.1.3");
  assert.deepEqual(decodeCustomQuiz(code), specs);
});

test("une section mal formée est écartée, le reste de la consigne survit", () => {
  // Adresse bricolée à la main : on ne laisse pas n'importe quelle chaîne
  // entrer dans un filtre, mais on ne jette pas la consigne pour autant.
  const specs = decodeCustomQuiz("PSD3-e2m0t0-s3.3,4.1");
  assert.deepEqual(specs[0].sections, ["3.3", "4.1"]);

  // « 3..3 » et « .5 » ne sont pas des numéros de section.
  assert.deepEqual(decodeCustomQuiz("PSD3-e2m0t0-s3..3")[0].sections, undefined);
  assert.deepEqual(decodeCustomQuiz("PSD3-e2m0t0-s3.3,.5")[0].sections, ["3.3"]);
});

test("une section invalide n'est pas encodée", () => {
  const code = encodeCustomQuiz([
    { lessonId: "PSD3", exerciseCount: 1, mcqCount: 0, tfCount: 0, sections: ["3.3", "tout", ""] },
  ]);
  assert.equal(code, "PSD3-e1m0t0-s3.3");
});

test("un segment incompréhensible est ignoré sans emporter les autres", () => {
  const specs = decodeCustomQuiz("n'importe quoi_PSD1-e1m0t0");
  assert.deepEqual(specs, [{ lessonId: "PSD1", exerciseCount: 1, mcqCount: 0, tfCount: 0 }]);
  assert.deepEqual(decodeCustomQuiz(""), []);
});

test("une consigne vide n'est pas encodée", () => {
  assert.equal(
    encodeCustomQuiz([
      { lessonId: "L15", exerciseCount: 0, mcqCount: 0, tfCount: 0 },
      { lessonId: "L16", exerciseCount: 1, mcqCount: 0, tfCount: 0 },
    ]),
    "L16-e1m0t0",
  );
});
