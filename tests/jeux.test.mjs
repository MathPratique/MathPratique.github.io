// Jeux : règles du classement (pseudonymes, temps), cohérence avec
// firestore.rules, avec le pré-rendu et avec le jeu lui-même.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PSEUDO_MAX, TEMPS_MAX, TEMPS_MIN, MESSAGE_PSEUDO_REFUSE, formaterTemps, rangTexte, tempsValide, verifierPseudo,
} from "../.tmp-test/jeux/regles.js";
import { JEUX } from "../.tmp-test/data/jeux.js";

const lire = (f) => readFileSync(f, "utf8");

test("pseudonymes ordinaires acceptés, espaces nettoyés", () => {
  for (const p of ["Loup des bois", "Marie_23", "Élodie", "Question", "Seconde", "Calcul", "Computer", "Constance",
    "Sébastien", "Festival", "Escargot", "Hancock", "Scunthorpe", "Cocotte", "x".repeat(PSEUDO_MAX)]) {
    const v = verifierPseudo(p);
    assert.ok(v.ok, `« ${p} » devrait être accepté`);
  }
  assert.deepEqual(verifierPseudo("  Loup   des  bois "), { ok: true, pseudo: "Loup des bois" });
});

test("pseudonymes vides, trop longs ou invisibles refusés", () => {
  for (const p of ["", "   ", "x".repeat(PSEUDO_MAX + 1), 42, null, undefined, "Loup​Blanc", "a\u0007b"]) {
    assert.equal(verifierPseudo(p).ok, false, `« ${String(p)} » devrait être refusé`);
  }
});

test("mots inappropriés refusés, même déguisés, avec un message poli", () => {
  for (const p of ["connard", "Le Connard", "C0nn4rd", "s.a.l.o.p.e", "fils de pute", "PUTAIN", "con", "c o n",
    "pute", "Gros cul", "FUCK you", "tabarnak", "ostie", "nazi", "MathPratique", "Admin", "Modérateur"]) {
    const v = verifierPseudo(p);
    assert.equal(v.ok, false, `« ${p} » devrait être refusé`);
    assert.equal(v.message, MESSAGE_PSEUDO_REFUSE);
  }
  assert.match(MESSAGE_PSEUDO_REFUSE, /s’il te plaît/);
});

test("temps : de 3 minutes à 10 heures seulement", () => {
  assert.equal(tempsValide(TEMPS_MIN - 0.1), false);
  assert.equal(tempsValide(TEMPS_MIN), true);
  assert.equal(tempsValide(TEMPS_MAX), true);
  assert.equal(tempsValide(TEMPS_MAX + 0.1), false);
  for (const v of [NaN, Infinity, "300", null]) assert.equal(tempsValide(v), false);
  assert.equal(formaterTemps(462.3), "07:42,3");
  assert.equal(formaterTemps(180), "03:00,0");
  assert.equal(rangTexte(1), "1er");
  assert.equal(rangTexte(14), "14e");
});

test("firestore.rules applique les mêmes bornes que src/jeux/regles.ts", () => {
  const rules = lire("firestore.rules");
  assert.ok(rules.includes(`e.temps >= ${TEMPS_MIN}`), "temps minimal différent");
  assert.ok(rules.includes(`e.temps <= ${TEMPS_MAX}`), "temps maximal différent");
  assert.ok(rules.includes(`e.pseudo.size() <= ${PSEUDO_MAX}`), "longueur du pseudonyme différente");
  for (const j of JEUX.filter((x) => x.classement)) assert.ok(rules.includes(`'${j.slug}'`), `${j.slug} absent de jeuConnu()`);
});

test("chaque jeu : page pré-rendue avec ses titre et description, fichier présent", () => {
  const prerendu = lire("scripts/prerendre.mjs");
  for (const j of JEUX) {
    assert.ok(prerendu.includes(`chemin: "/jeux/${j.slug}"`), `/jeux/${j.slug} n'est pas pré-rendu`);
    assert.ok(prerendu.includes(`titre: "${j.titrePage}"`), `titre de ${j.slug} différent dans prerendre.mjs`);
    assert.ok(prerendu.includes(`"${j.descriptionPage}"`), `description de ${j.slug} différente dans prerendre.mjs`);
    assert.ok(lire(`public${j.fichier}`).startsWith("<!DOCTYPE html>"), `${j.fichier} absent`);
  }
  const page = lire("src/pages/Jeux.tsx");
  const titre = page.match(/const TITRE = "([^"]+)";/)[1];
  const description = page.match(/const DESCRIPTION =\s*"([^"]+)";/)[1];
  assert.ok(prerendu.includes(`titre: "${titre}"`), "titre de /jeux différent dans prerendre.mjs");
  assert.ok(prerendu.includes(`"${description}"`), "description de /jeux différente dans prerendre.mjs");
});

test("la page Jeux est liée au pied de page", () => {
  assert.ok(lire("src/components/layout/Footer.tsx").includes('{ to: "/jeux", label: "Jeux" }'));
});

test("le jeu et la page parlent sur le même canal et vérifient l'origine des messages", () => {
  const jeu = lire("public/jeux/jardin-des-derivees/jeu.html");
  const pont = lire("src/jeux/usePontJeu.ts");
  const canalJeu = jeu.match(/const CANAL = '([^']+)';/)[1];
  const canalPage = pont.match(/export const CANAL_JEU = "([^"]+)";/)[1];
  assert.equal(canalJeu, canalPage);
  assert.ok(jeu.includes("e.origin !== location.origin || e.source !== window.parent"), "le jeu ne vérifie pas l'origine");
  assert.ok(pont.includes("e.origin !== window.location.origin"), "la page ne vérifie pas l'origine");
  assert.ok(pont.includes("e.source !== fenetre"), "la page ne vérifie pas la fenêtre");
  // Les envois désignent l'origine du site, jamais « * »
  assert.ok(!/postMessage\([^)]*['"]\*['"]/.test(jeu + pont), "postMessage vers « * »");
});

test("le jeu respecte les conventions du site", () => {
  const jeu = lire("public/jeux/jardin-des-derivees/jeu.html");
  assert.ok(jeu.includes("© 2026 MathPratique.ca"));
  assert.ok(jeu.includes('<meta name="robots" content="noindex">'));
  assert.ok(jeu.includes("Ce jeu se joue à l’ordinateur, avec un clavier et une souris."));
  // Tutoiement : aucun « vous / votre / vos » dans les textes du jeu
  const textes = jeu.replace(/<script type="module">[\s\S]*<\/script>/, "");
  assert.deepEqual(textes.match(/\b(vous|votre|vos)\b/gi) ?? [], []);
  // Plus aucun ancien niveau, ni l'ancien classement de claude.ai
  for (const ancien of ["Saint-Égaré", "maison hantée", "window.claude", "Extrême"]) assert.ok(!jeu.includes(ancien), ancien);
  // Les outils de test (joueur automatique) n'existent que sur localhost
  assert.ok(jeu.includes("if (OUTILS_TEST) window.LABY = LABY;"));
});
