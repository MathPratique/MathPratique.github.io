import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compter, enLettres, libelleBadge, nombre, quantite } from "../.tmp-test/data/compteurs.js";

// Compteurs publics de l'accueil (2026-10-26). Le bandeau annonçait
// « 539 exercices dans 4 matières » : les seuls exercices d'algèbre
// linéaire, rapportés à quatre matières dont une « À venir ».

const matiere = (surcharge) => ({
  id: "x",
  enPreparation: false,
  masquee: false,
  gratuits: 0,
  reserves: 0,
  packageEnVente: false,
  ...surcharge,
});

// La situation du 2026-10-26, tirée des catalogues et de exercises.ts.
const SITE = [
  matiere({ id: "differential-calculus", gratuits: 69, reserves: 329, packageEnVente: true }),
  matiere({ id: "integral-calculus", enPreparation: true }),
  matiere({ id: "linear-algebra", gratuits: 539 }),
  matiere({ id: "probability", gratuits: 100, reserves: 375 }),
];

test("situation du site : 3 matières disponibles, 708 gratuits, 329 de plus avec le package", () => {
  assert.deepEqual(compter(SITE), {
    matieresDisponibles: 3,
    matieresEnPreparation: 1,
    gratuits: 708,
    avecPackage: 329,
  });
});

test("une matière « À venir » n'est ni disponible ni comptée dans les exercices", () => {
  const c = compter([matiere({ gratuits: 10 }), matiere({ enPreparation: true, gratuits: 50, reserves: 50, packageEnVente: true })]);
  assert.equal(c.matieresDisponibles, 1);
  assert.equal(c.matieresEnPreparation, 1);
  assert.equal(c.gratuits, 10);
  assert.equal(c.avecPackage, 0);
});

test("les exercices réservés d'une matière sans package en vente ne comptent pas « avec le package »", () => {
  const c = compter([matiere({ gratuits: 100, reserves: 375, packageEnVente: false })]);
  assert.equal(c.avecPackage, 0);
});

test("une matière masquée est ignorée partout", () => {
  const c = compter([matiere({ gratuits: 10 }), matiere({ masquee: true, gratuits: 99 })]);
  assert.deepEqual(c, { matieresDisponibles: 1, matieresEnPreparation: 0, gratuits: 10, avecPackage: 0 });
});

test("badge : « X gratuits · Y avec le package » seulement si le package est en vente", () => {
  assert.equal(libelleBadge({ gratuits: 69, total: 398, packageEnVente: true }), "69 gratuits · 398 avec le package");
  assert.equal(libelleBadge({ gratuits: 100, total: 475, packageEnVente: false }), "100 exercices gratuits");
  assert.equal(libelleBadge({ gratuits: 539, packageEnVente: false }), "539 exercices");
  assert.equal(libelleBadge({ gratuits: 1, packageEnVente: false }), "1 exercice");
  assert.equal(libelleBadge({ enPreparation: true, gratuits: 0, packageEnVente: false }), "À venir");
});

test("ordre de grandeur de l'accroche : vrai à mesure que les exercices s'ajoutent", () => {
  assert.equal(quantite(708, "exercices corrigés"), "Des centaines d'exercices corrigés");
  assert.equal(quantite(1200, "exercices corrigés"), "Plus de mille exercices corrigés");
  assert.equal(quantite(150, "exercices corrigés"), "150 exercices corrigés");
});

test("nombres en lettres et séparateur des milliers", () => {
  assert.equal(enLettres(3), "trois");
  assert.equal(enLettres(1), "une");
  assert.equal(enLettres(12), "12");
  assert.equal(nombre(708), "708");
  assert.equal(nombre(1037).replace(/\s/g, " "), "1 037");
});

// ---------------------------------------------------------------------------
//  Gardes sur les textes de l'accueil
// ---------------------------------------------------------------------------

const lire = (f) => readFileSync(f, "utf8");
// Les commentaires citent volontairement les anciennes formulations : on ne
// vérifie que le code.
const sansCommentaires = (t) => t.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");

test("l'accueil ne promet plus « 100 % gratuit » ni « pas de paywall »", () => {
  for (const f of ["src/data/stats.ts", "src/components/home/CallToAction.tsx", "src/components/home/Hero.tsx"]) {
    const t = sansCommentaires(lire(f));
    assert.ok(!/paywall/i.test(t), `${f} : « paywall » affiché`);
    assert.ok(!t.includes('label: "gratuit, sans compte requis"'), `${f} : « 100 % gratuit » revenu`);
  }
});

test("la phrase des matières n'est plus écrite à la main", () => {
  assert.ok(!sansCommentaires(lire("src/components/home/TopicsShowcase.tsx")).includes("Quatre matières"));
});

test("« Probabilités et statistique » au singulier, et plus de libellé de travail dans l'exemple animé", () => {
  assert.ok(!lire("src/data/topics.ts").includes("Probabilités et statistiques"));
  assert.ok(!lire("src/components/home/Hero.tsx").includes("mathpratique.exemple</span>"));
});

test("les pages légales en brouillon ne sont ni liées au pied de page ni pré-rendues", () => {
  const pied = lire("src/components/layout/Footer.tsx");
  const prerendu = lire("scripts/prerendre.mjs");
  for (const chemin of ["/politique-de-remboursement", "/conditions-d-utilisation", "/politique-de-confidentialite"]) {
    assert.ok(!pied.includes(`"${chemin}"`), `${chemin} est lié au pied de page`);
    assert.ok(!prerendu.includes(`"${chemin}"`), `${chemin} est pré-rendu`);
  }
});
