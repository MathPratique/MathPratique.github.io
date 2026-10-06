// ===========================================================================
//  Téléversement ciblé de documents de calcul différentiel
// ===========================================================================
//
// Script générique, pour arrêter la prolifération des `televerser-chNN-*.js`
// ad hoc — il y en avait cinq au 2026-10-06. Il prend un motif de chemin et
// ne téléverse que les documents qui correspondent ET dont le contenu diffère
// réellement du seau.
//
// Il couvre les DEUX arbres sources, parce que les PDF du cours ne vivent pas
// au même endroit : les notes sortent du projet `notes+exercices-…/build`,
// les cahiers et la révision du projet jumeau `exercices-…/sorties/build`.
// Le script cherche dans les deux et refuse si un nom existe dans les deux à
// la fois.
//
// `televerser-documents.js` ne peut pas servir : il exige que les ~70 sources
// du catalogue existent toutes, or celui-ci couvre aussi probabilités-
// statistique et calcul intégral, dont les PDF ne sont pas sur ce poste.
//
// Les destinations sont SÉLECTIONNÉES dans `src/acces/documents.ts`, jamais
// réécrites à la main : un chemin recopié finit par diverger du catalogue, et
// un PDF au mauvais endroit est un document introuvable pour un acheteur.
//
// Usage :
//   node scripts/televerser-cd.js ch04-3-corrige
//   node scripts/televerser-cd.js ch03-continuite --confirmer
//
// Le motif est une sous-chaîne du chemin dans le seau. Sans `--confirmer`,
// essai à blanc. Le récapitulatif affiche la catégorie de chaque document
// retenu, pour qu'un motif trop large se voie avant d'écrire.
// ===========================================================================

import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { DOCUMENTS } from "../src/acces/documents.ts";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHEMIN_CLE = resolve(RACINE, "serviceAccountKey.json");
const NOM_SEAU = "mathpratique-8dea1.firebasestorage.app";
// Les deux arbres de build du cours. L'ordre n'a pas d'importance : un nom
// présent dans les deux fait échouer le script plutôt que d'en choisir un.
const SOURCES = [
  "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/notes+exercices-calcul-differentiel/build",
  "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/exercices-calcul-differentiel/sorties/build",
];

const args = process.argv.slice(2);
const CONFIRMER = args.includes("--confirmer");
const MOTIF = args.find((a) => !a.startsWith("--"));

if (!MOTIF) {
  console.error("\nUsage : node scripts/televerser-cd.js <motif> [--confirmer]\n");
  process.exit(2);
}

const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("base64");
const ko = (n) => `${(Number(n) / 1024).toFixed(0)} Ko`;

const docs = DOCUMENTS.filter(
  (d) => d.coursId === "calcul-differentiel" && d.chemin.includes(MOTIF),
);

console.log(`\n=== Documents correspondant à « ${MOTIF} » ===\n`);
if (docs.length === 0) {
  console.error("  Aucun document ne correspond. Rien n'a été fait.\n");
  process.exit(1);
}
for (const d of docs) {
  console.log(`  [${d.categorie.padEnd(9)}] ${d.id.padEnd(34)} → ${d.chemin}`);
}

// ---------- Sources locales, cherchées dans les deux arbres ------------------

const items = [];
let probleme = false;
for (const d of docs) {
  const nom = basename(d.chemin);
  const trouves = SOURCES.map((s) => resolve(s, nom)).filter((p) => existsSync(p));

  if (trouves.length === 0) {
    console.error(`  ✗ INTROUVABLE dans les deux arbres : ${nom}`);
    probleme = true;
    continue;
  }
  if (trouves.length > 1) {
    // Deux fichiers du même nom dans deux projets différents : on ne devine
    // pas lequel est le bon. `ch01-3-corrige.pdf` existe par exemple en
    // calcul différentiel ET en prob-stat.
    console.error(`  ✗ AMBIGU : ${nom} existe dans plusieurs arbres —`);
    for (const p of trouves) console.error(`      ${p}`);
    probleme = true;
    continue;
  }
  const chemin = trouves[0];
  items.push({ dest: d.chemin, chemin, taille: statSync(chemin).size, md5: md5(chemin) });
}
if (probleme) {
  console.error("\nRien n'a été fait.\n");
  process.exit(1);
}

// ---------- Connexion --------------------------------------------------------

if (!existsSync(CHEMIN_CLE)) {
  console.error(`\n❌ Clé de service introuvable : ${CHEMIN_CLE}\n`);
  process.exit(1);
}
initializeApp({
  credential: cert(JSON.parse(readFileSync(CHEMIN_CLE, "utf-8"))),
  storageBucket: NOM_SEAU,
});
const seau = getStorage().bucket();

// ---------- État avant -------------------------------------------------------

console.log("\n=== État actuel dans le seau ===\n");
const aFaire = [];
for (const it of items) {
  const [existe] = await seau.file(it.dest).exists();
  if (!existe) {
    console.log(`  ${basename(it.dest).padEnd(24)} ABSENT du seau — sera créé`);
    aFaire.push(it);
    continue;
  }
  const [meta] = await seau.file(it.dest).getMetadata();
  const identique = meta.md5Hash === it.md5;
  console.log(
    `  ${basename(it.dest).padEnd(24)} seau ${ko(meta.size).padStart(8)} (${meta.updated.slice(0, 10)})` +
      `  local ${ko(it.taille).padStart(8)}  ${identique ? "→ IDENTIQUE, ignoré" : "→ DIFFÉRENT, sera remplacé"}`,
  );
  if (!identique) aFaire.push(it);
}

if (aFaire.length === 0) {
  console.log("\nTout est déjà à jour dans le seau. Rien à faire.\n");
  process.exit(0);
}

// ---------- Essai à blanc ----------------------------------------------------

if (!CONFIRMER) {
  console.log("\n=== ESSAI À BLANC — rien n'a été écrit ===\n");
  for (const it of aFaire) console.log(`    ↑ ${basename(it.chemin)} → ${it.dest}`);
  console.log(`\n  Pour procéder :  node scripts/televerser-cd.js ${MOTIF} --confirmer\n`);
  process.exit(0);
}

// ---------- Garde-fou PRODUCTION --------------------------------------------

console.log(`
⚠️  ATTENTION — CIBLE : PRODUCTION

Ce script va REMPLACER ${aFaire.length} objet(s) dans le seau Cloud Storage de
production (${NOM_SEAU}).

Tape PRODUCTION pour procéder, n'importe quoi d'autre pour annuler.
`);
const rl = createInterface({ input: process.stdin, output: process.stdout });
try {
  const reponse = (await rl.question("> ")).trim();
  if (reponse !== "PRODUCTION") {
    console.error("\nOpération annulée. Rien n'a été téléversé.\n");
    process.exit(0);
  }
} finally {
  rl.close();
}

// ---------- Téléversement ----------------------------------------------------

console.log("\n=== Téléversement ===\n");
for (const it of aFaire) {
  process.stdout.write(`  ↑ ${basename(it.dest).padEnd(24)} … `);
  await seau.upload(it.chemin, {
    destination: it.dest,
    metadata: { contentType: "application/pdf" },
  });
  console.log("ok");
}

// ---------- Relecture --------------------------------------------------------

console.log("\n=== État relu depuis le seau (après) ===\n");
let bon = true;
for (const it of aFaire) {
  const [meta] = await seau.file(it.dest).getMetadata();
  const ok = meta.md5Hash === it.md5;
  if (!ok) bon = false;
  console.log(
    `  ${basename(it.dest).padEnd(24)} ${ko(meta.size).padStart(8)}  ` +
      `${meta.updated.replace("T", " ").slice(0, 19)} UTC  MD5 = local : ${ok ? "✓ oui" : "✗ NON"}`,
  );
}
console.log();
if (bon) console.log("  ✓ Le seau correspond aux fichiers locaux (MD5 comparés).\n");
else {
  console.error("  ✗ Au moins un MD5 ne correspond pas.\n");
  process.exit(1);
}
