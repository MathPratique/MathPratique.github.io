import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  analyser,
  analyserSeuil,
  arrondi,
  arrondiBas,
  arrondiHaut,
  lireChamp,
  pourcentage,
  totauxEgaux,
} from "../.tmp-test/outils/note-finale.js";

// Calculateur « Quelle note me faut-il à l'examen final? ».
// L'étudiant entre ses évaluations déjà faites ; tout le reste du cours
// (examen final compris) est « le reste ». Les valeurs attendues sont
// calculées à la main dans les commentaires.

const fait = (note, ponderation, examen = false) => ({ note, ponderation, examen });
const reste = (ponderation, examen = false) => ({ ponderation, examen });
const proche = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ""} ${a} ≠ ${b}`);

// ---------------------------------------------------------------------------
//  Calcul principal
// ---------------------------------------------------------------------------

test("exemple de référence : mini-test 80 % (5 %), examen 1 55 % (15 %), cible 80 % → 84,7 %", () => {
  // acquis = 4 + 8,25 = 12,25 ; reste = 80 ; requise = 67,75 / 0,8 = 84,6875
  const a = analyser([fait(80, 5), fait(55, 15)], 80);
  assert.equal(a.statut, "possible");
  proche(a.ponderationRestante, 80);
  proche(a.acquis, 12.25);
  proche(a.requise, 84.6875);
  assert.equal(pourcentage(arrondiHaut(a.requise)), "84,7\u00a0%");
});

test("tableau « si tu obtiens en moyenne… sur ce qui reste » pour l'exemple de référence", () => {
  const a = analyser([fait(80, 5), fait(55, 15)], 80);
  assert.deepEqual(a.tableau.map((l) => l.x), [50, 60, 70, 80, 90, 100]);
  // note = 12,25 + 0,8 x
  assert.deepEqual(a.tableau.map((l) => arrondi(l.note)), [52.3, 60.3, 68.3, 76.3, 84.3, 92.3]);
  assert.deepEqual(a.tableau.map((l) => l.reussit), [false, false, false, false, true, true]);
});

test("régression : 20 % faits et un final à 30 % ne rendent plus 80 % impossible", () => {
  // L'ancienne version ne voyait que le final (30 %) comme reste.
  // acquis = 14 ; reste = 80 ; requise = 66 / 0,8 = 82,5
  const a = analyser([fait(70, 20)], 80);
  assert.equal(a.statut, "possible");
  proche(a.requise, 82.5);
});

test("aucune évaluation saisie : la moyenne requise est la cible elle-même", () => {
  const a = analyser([], 70);
  proche(a.ponderationRestante, 100);
  proche(a.requise, 70);
});

test("pondérations faites = 100 % : le cours est terminé, la note finale est connue", () => {
  // 40 + 35 = 75
  const a = analyser([fait(80, 50), fait(70, 50)], 60);
  assert.equal(a.statut, "termine");
  proche(a.noteFinale, 75);
  assert.equal(a.cibleAtteinte, true);
  assert.equal(analyser([fait(80, 50), fait(70, 50)], 80).cibleAtteinte, false);
});

test("3 × 33,33 % = 99,99 % : cours terminé, pas un reste de 0,01 %", () => {
  const a = analyser([fait(70, 33.33), fait(70, 33.33), fait(70, 33.33)], 60);
  assert.equal(a.statut, "termine");
});

test("pondérations faites > 100 % : erreur, aucun calcul", () => {
  const a = analyser([fait(80, 60), fait(70, 50)], 60);
  assert.equal(a.statut, "trop");
  proche(a.ponderationFaite, 110);
  assert.equal(a.requise, undefined);
});

test("objectif déjà atteint : la moyenne requise est négative ou nulle", () => {
  // acquis = 70 ≥ 60
  const a = analyser([fait(100, 70)], 60);
  assert.equal(a.statut, "atteint");
  assert.ok(a.requise <= 0);
  // pile atteint : acquis = 60, requise = 0
  assert.equal(analyser([fait(100, 60)], 60).statut, "atteint");
});

test("objectif impossible : plus de 100 % requis, et note maximale atteignable", () => {
  // acquis = 15 + 12 = 27 ; reste = 20 ; requise = 33 / 0,2 = 165 ; max = 27 + 20 = 47
  const a = analyser([fait(30, 50), fait(40, 30)], 60);
  assert.equal(a.statut, "impossible");
  proche(a.requise, 165);
  proche(a.noteMax, 47);
});

test("objectif atteignable à 100 % exactement : possible, pas impossible", () => {
  // acquis = 40 ; reste = 20 ; requise = 20 / 0,2 = 100
  const a = analyser([fait(50, 80)], 60);
  assert.equal(a.statut, "possible");
  assert.equal(arrondiHaut(a.requise), 100);
});

// ---------------------------------------------------------------------------
//  Arrondi de la moyenne requise : toujours vers le haut
// ---------------------------------------------------------------------------

test("arrondiHaut : 51,44 → 51,5, jamais 51,4", () => {
  assert.equal(arrondiHaut(51.44), 51.5);
  assert.equal(arrondiHaut(51.41), 51.5);
  assert.equal(arrondiHaut(51.5), 51.5);
  // Un flottant à peine au-dessus d'un dixième exact ne doit pas monter.
  assert.equal(arrondiHaut(51.400000000000006), 51.4);
  assert.equal(arrondiHaut(0.01), 0.1);
});

test("moyenne requise de 51,42 % : affichée 51,5 %, là où l'arrondi usuel dirait 51,4 %", () => {
  // acquis = 18 + 16,29 = 34,29 ; reste = 50 ; requise = 25,71 / 0,5 = 51,42
  const a = analyser([fait(72, 25), fait(65.16, 25)], 60);
  proche(a.requise, 51.42);
  assert.equal(arrondi(a.requise), 51.4);
  assert.equal(arrondiHaut(a.requise), 51.5);
});

test("arrondiBas et arrondi usuel", () => {
  assert.equal(arrondiBas(59.96), 59.9);
  assert.equal(arrondiBas(54.5), 54.5);
  assert.equal(arrondi(59.25), 59.3);
  assert.equal(pourcentage(arrondi(-0.04)), "0,0\u00a0%");
});

// ---------------------------------------------------------------------------
//  Option : seuil de moyenne d'examens à 60 %
// ---------------------------------------------------------------------------

test("seuil d'examens sans détail de ce qui reste : on invite, on ne devine pas", () => {
  assert.deepEqual(analyserSeuil([fait(55, 15, true)], [], 60), { statut: "sans-detail" });
});

test("seuil d'examens avec détail : moyenne requise sur les examens restants", () => {
  // Faits : mini-test 80 (5, pas un examen), examen 1 55 (15, examen).
  // Restants : examen 2 (20, examen), final (35, examen), travail (25).
  // (60 × (15 + 55) − 55 × 15) / 55 = (4200 − 825) / 55 = 61,36
  const s = analyserSeuil(
    [fait(80, 5), fait(55, 15, true)],
    [reste(20, true), reste(35, true), reste(25)],
    60,
  );
  assert.equal(s.statut, "possible");
  proche(s.requise, 3375 / 55);
  proche(s.ponderationExamensRestants, 55);
  assert.equal(arrondiHaut(s.requise), 61.4);
});

test("seuil d'examens bloqué tant que le détail ne couvre pas tout ce qui reste", () => {
  // Même cas que ci-dessus, mais seul l'examen 2 est détaillé (20 % sur 80 %).
  // Le calcul partiel donnerait (60 × 35 − 825) / 20 = 63,75, alors que
  // l'exigence réelle, final compris, est de 61,36 : aucun chiffre ne sort.
  const s = analyserSeuil([fait(80, 5), fait(55, 15, true)], [reste(20, true)], 60);
  assert.deepEqual(s, { statut: "detail-incomplet", totalDetaille: 20, ponderationRestante: 80 });
  assert.equal(s.requise, undefined);
});

test("seuil d'examens bloqué aussi quand le détail dépasse ce qui reste", () => {
  // 20 + 35 + 35 = 90 pour 80 qui restent
  const s = analyserSeuil([fait(80, 5), fait(55, 15, true)], [reste(20, true), reste(35, true), reste(35)], 60);
  assert.equal(s.statut, "detail-incomplet");
  proche(s.totalDetaille, 90);
});

test("seuil d'examens : le détail est accepté à la tolérance de ±0,05 près", () => {
  // 79,97 détaillés pour 80 qui restent
  const s = analyserSeuil([fait(80, 5), fait(55, 15, true)], [reste(19.97, true), reste(35, true), reste(25)], 60);
  assert.equal(s.statut, "possible");
});

test("seuil d'examens détaillé, mais aucun examen restant coché : moyenne déjà fixée", () => {
  // Il reste 85 %, détaillés en un seul travail.
  const s = analyserSeuil([fait(55, 15, true)], [reste(85)], 60);
  assert.equal(s.statut, "fixe");
  proche(s.moyenne, 55);
  assert.equal(s.respecte, false);
});

test("seuil d'examens déjà assuré, même avec 0 % aux examens restants", () => {
  // Il reste 40 % : un examen de 10 % et un travail de 30 %.
  // (60 × 70 − 6000) / 10 < 0
  const s = analyserSeuil([fait(100, 60, true)], [reste(10, true), reste(30)], 60);
  assert.equal(s.statut, "atteint");
});

test("seuil d'examens impossible : moyenne maximale atteignable", () => {
  // Il reste 50 % : un examen de 10 % et un travail de 40 %.
  // (60 × 60 − 1000) / 10 = 260 ; max = (1000 + 1000) / 60 = 33,3
  const s = analyserSeuil([fait(20, 50, true)], [reste(10, true), reste(40)], 60);
  assert.equal(s.statut, "impossible");
  proche(s.moyenneMax, 2000 / 60);
});

test("totauxEgaux : le détail de ce qui reste se compare à la tolérance près", () => {
  assert.equal(totauxEgaux(80, 80.02), true);
  assert.equal(totauxEgaux(80, 75), false);
});

// ---------------------------------------------------------------------------
//  Lecture des champs : validation douce
// ---------------------------------------------------------------------------

test("lireChamp accepte la virgule et les espaces", () => {
  assert.deepEqual(lireChamp("72,5"), { valeur: 72.5, erreur: null });
  assert.deepEqual(lireChamp(" 65 "), { valeur: 65, erreur: null });
  assert.deepEqual(lireChamp("100"), { valeur: 100, erreur: null });
  assert.deepEqual(lireChamp("0"), { valeur: 0, erreur: null });
});

test("lireChamp signale les champs vides, invalides ou hors de 0–100", () => {
  assert.equal(lireChamp("").erreur, "vide");
  assert.equal(lireChamp("   ").erreur, "vide");
  assert.equal(lireChamp("abc").erreur, "invalide");
  assert.equal(lireChamp("7,2,5").erreur, "invalide");
  assert.equal(lireChamp("120").erreur, "hors-bornes");
  assert.equal(lireChamp("-3").erreur, "hors-bornes");
});

// ---------------------------------------------------------------------------
//  Métadonnées : la page et le pré-rendu doivent dire la même chose
// ---------------------------------------------------------------------------

test("titre et description identiques dans la page et le pré-rendu, titre ≤ 60 caractères", () => {
  const page = readFileSync("src/pages/CalculateurNoteFinale.tsx", "utf8");
  const prerendu = readFileSync("scripts/prerendre.mjs", "utf8");
  const titre = page.match(/const TITRE = "([^"]+)";/)[1];
  const description = page.match(/const DESCRIPTION =\s*"([^"]+)";/)[1];
  assert.ok(prerendu.includes(`titre: "${titre}"`), "titre différent dans prerendre.mjs");
  assert.ok(prerendu.includes(`"${description}"`), "description différente dans prerendre.mjs");
  assert.ok(titre.length <= 60, `titre de ${titre.length} caractères`);
  assert.ok(description.includes("évaluations restantes"), "la description doit parler des évaluations restantes");
  assert.ok(!/\b(vous|votre|vos)\b/i.test(titre + description), "vouvoiement dans les métadonnées");
});
