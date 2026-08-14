#!/usr/bin/env node
/**
 * Contrôle post-build : aucun exercice payant ne se retrouve dans dist/.
 *
 * Le bundle Vite (dist/) est ce qui part sur GitHub Pages. Tout fichier
 * qui s'y trouve est téléchargeable par n'importe qui, quelles que soient
 * les règles Firestore. Le contenu payant, lui, ne doit JAMAIS y être —
 * il est servi exclusivement par la Cloud Function obtenirExercices() après
 * vérification d'accès côté serveur.
 *
 * Ce script cherche, pour chaque exercice payant, un fragment de texte
 * assez long et distinctif pour être unique. Il grep dist/ pour ces
 * fragments. Un seul match = fuite = build échoue.
 *
 * Fragments écartés : ceux qui apparaissent AUSSI dans un exercice gratuit.
 * Une phrase pédagogique partagée (« On dérive une première fois : … »)
 * peut se trouver légitimement dans un gratuit ET un payant ; sa présence
 * dans dist/ via le gratuit ne prouve rien.
 *
 * À lancer après `npm run build` — intégré dans le script npm.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE = resolve(__dirname, "..");

const DIST = join(SITE, "dist");
const BLOB_PRIVE = join(SITE, "functions", "src", "data", "exercices-cd.json");

if (!existsSync(DIST)) {
  console.error(`✗ Dossier dist/ introuvable. Lance d'abord \`npm run build\`.`);
  process.exit(1);
}
if (!existsSync(BLOB_PRIVE)) {
  console.error(`✗ Blob privé introuvable. Lance d'abord \`node scripts/sync-banque-cd.js\`.`);
  process.exit(1);
}

console.log("Contrôle post-build : aucun exo payant dans dist/…");

const banque = JSON.parse(readFileSync(BLOB_PRIVE, "utf8"));
const gratuits = banque.exercices.filter((e) => e.acces === "gratuit");
const payants = banque.exercices.filter((e) => e.acces !== "gratuit");

console.log(`   ${payants.length} exos payants à contrôler contre ${gratuits.length} gratuits.`);

// ─── Étape 1 : corpus concaténé des textes légitimes des gratuits ────────
// Un fragment payant peut être un préfixe ou une sous-chaîne d'une phrase
// d'un gratuit — auquel cas sa présence dans dist/ vient de ce gratuit,
// pas d'une fuite payante. On teste par INCLUSION dans le corpus, pas par
// égalité.
const normaliser = (s) => String(s).replace(/\s+/g, " ").trim();
const morceaux = [];
function ajouterGratuit(ex) {
  ex.etapes.forEach((e) => {
    if (e.texte) morceaux.push(normaliser(e.texte));
    if (e.lignes) e.lignes.forEach((l) => morceaux.push(normaliser(l)));
    if (e.piegeCourant) morceaux.push(normaliser(e.piegeCourant));
    if (e.choix) e.choix.forEach((c) => morceaux.push(normaliser(c.texte)));
    if (e.analyseChoix) e.analyseChoix.forEach((c) => morceaux.push(normaliser(c.explication)));
  });
}
gratuits.forEach(ajouterGratuit);
// Séparateur choisi pour rompre l'inclusion accidentelle d'un fragment à
// cheval entre deux morceaux voisins ; « | » ne peut pas apparaître au
// milieu d'une phrase mathématique française.
const corpusGratuit = " | " + morceaux.join(" | ") + " | ";

// ─── Étape 2 : collecter les fragments distinctifs des payants ────────────
const fragmentsPayants = []; // {id, champ, fragment}
function collecter(ex) {
  const collect = (champ, s) => {
    const v = normaliser(s);
    if (v.length >= 40 && !corpusGratuit.includes(v)) {
      fragmentsPayants.push({ id: ex.id, champ, fragment: v });
    }
  };
  ex.etapes.forEach((e, i) => {
    if (e.texte) collect(`etapes[${i}].texte`, e.texte);
    if (e.lignes) e.lignes.forEach((l, j) => collect(`etapes[${i}].lignes[${j}]`, l));
    if (e.piegeCourant) collect(`etapes[${i}].piegeCourant`, e.piegeCourant);
    if (e.choix) e.choix.forEach((c, j) => collect(`etapes[${i}].choix[${j}].texte`, c.texte));
    if (e.analyseChoix)
      e.analyseChoix.forEach((c, j) =>
        collect(`etapes[${i}].analyseChoix[${j}].explication`, c.explication),
      );
  });
}
payants.forEach(collecter);
console.log(`   ${fragmentsPayants.length} fragments distinctifs à chercher dans dist/.`);

// ─── Étape 3 : parcourir dist/ et chercher ────────────────────────────────
const fichiers = [];
function marcher(dir) {
  readdirSync(dir).forEach((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) marcher(p);
    else if (/\.(js|mjs|cjs|html|json|css|svg|txt)$/.test(n)) fichiers.push(p);
  });
}
marcher(DIST);
console.log(`   ${fichiers.length} fichiers à inspecter.`);

const fuites = [];
for (const f of fichiers) {
  const contenu = readFileSync(f, "utf8").replace(/\s+/g, " ");
  for (const { id, champ, fragment } of fragmentsPayants) {
    if (contenu.includes(fragment)) {
      fuites.push({
        fichier: relative(SITE, f),
        id,
        champ,
        extrait: fragment.slice(0, 80) + (fragment.length > 80 ? "…" : ""),
      });
    }
  }
}

if (fuites.length) {
  console.error(`\n✗ ${fuites.length} FUITE(S) DE CONTENU PAYANT DANS dist/ :\n`);
  fuites.forEach((f) => {
    console.error(`   ${f.fichier}`);
    console.error(`     ${f.id} · ${f.champ}`);
    console.error(`     « ${f.extrait} »\n`);
  });
  console.error(
    `Ce contenu part sur GitHub Pages tel quel. Ne pas déployer.`,
  );
  process.exit(1);
}

console.log(`\n✓ Aucune fuite. Les ${payants.length} exos payants sont bien absents de dist/.`);
