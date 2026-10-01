// ===========================================================================
//  Téléversement ciblé : les 7 cahiers « Énoncés » de calcul différentiel
// ===========================================================================
//
// Motif : le bandeau de chaque énoncé affichait « type · niveau ». Le niveau
// a été retiré (commit 3d436f3 du projet d'exercices), ce qui change le PDF.
//
// Pourquoi SEULEMENT les cahiers 1 : les 398 badges se trouvaient tous dans
// les cahiers « Énoncés ». `enteteExerciceSimple`, qui les produisait, n'est
// appelé que par `cahierExercices`. Les cahiers « Indices » et « Corrigé »
// n'en portaient aucun — les retéléverser serait du bruit, et chaque octet
// réécrit dans le seau est une occasion de se tromper de fichier.
//
// `televerser-documents.js` ne peut pas servir ici : il exige que les ~65
// sources du catalogue existent toutes, or celui-ci couvre maintenant
// probabilités-statistique et calcul intégral, dont les PDF ne sont pas sur
// ce poste. Il s'arrête avant d'écrire quoi que ce soit.
//
// Les destinations ne sont PAS réécrites ici : elles sont SÉLECTIONNÉES dans
// `src/acces/documents.ts`, seule source de vérité. Un chemin recopié à la
// main finit par diverger du catalogue, et un PDF au mauvais endroit est un
// document introuvable pour quelqu'un qui a payé.
//
// Le catalogue n'est pas modifié : aucun `firebase deploy --only functions`
// n'est requis. Seul l'octet au bout du chemin change.
//
// Usage :
//   node scripts/televerser-cahiers-enonces-cd.js              (essai à blanc)
//   node scripts/televerser-cahiers-enonces-cd.js --confirmer  (après PRODUCTION)
//
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

const SOURCE =
  "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/exercices-calcul-differentiel/sorties/build";

const CONFIRMER = process.argv.includes("--confirmer");

const md5DeFichier = (c) => createHash("md5").update(readFileSync(c)).digest("base64");
const ko = (n) => `${(Number(n) / 1024).toFixed(0)} Ko`;
const dateCourte = (iso) =>
  iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC" : "—";

// ---------- Sélection depuis le catalogue ------------------------------------

const docs = DOCUMENTS.filter(
  (d) =>
    d.coursId === "calcul-differentiel" &&
    d.categorie === "exercices" &&
    /\/ch\d\d-1-exercices\.pdf$/.test(d.chemin),
);

console.log("\n=== Documents sélectionnés dans le catalogue ===\n");
for (const d of docs) console.log(`  ${d.id.padEnd(20)} → ${d.chemin}`);

if (docs.length !== 7) {
  console.error(
    `\n❌ 7 cahiers attendus, ${docs.length} trouvé(s). Le catalogue a changé ?\n` +
      `   Rien n'a été fait.\n`,
  );
  process.exit(1);
}

// ---------- Contrôle des sources locales ------------------------------------

console.log("\n=== Sources locales ===\n");
const items = [];
let manquant = false;
for (const d of docs) {
  const chemin = resolve(SOURCE, basename(d.chemin));
  if (!existsSync(chemin)) {
    console.error(`  ✗ INTROUVABLE : ${chemin}`);
    manquant = true;
    continue;
  }
  const st = statSync(chemin);
  items.push({ dest: d.chemin, chemin, taille: st.size, md5: md5DeFichier(chemin) });
  console.log(
    `  ${basename(chemin).padEnd(24)} ${ko(st.size).padStart(9)}  modifié ${st.mtime
      .toISOString()
      .slice(0, 19)
      .replace("T", " ")}`,
  );
}
if (manquant) {
  console.error("\nAu moins un PDF source est introuvable. Rien n'a été fait.");
  console.error("Regénérer avec `node scripts/generer-cahiers.js` puis compiler.\n");
  process.exit(1);
}

// ---------- Connexion au seau ------------------------------------------------

if (!existsSync(CHEMIN_CLE)) {
  console.error(`\n❌ Clé de service introuvable : ${CHEMIN_CLE}\n`);
  process.exit(1);
}
initializeApp({
  credential: cert(JSON.parse(readFileSync(CHEMIN_CLE, "utf-8"))),
  storageBucket: NOM_SEAU,
});
const seau = getStorage().bucket();

// ---------- État AVANT, lu depuis le seau ------------------------------------

console.log("\n=== État actuel dans le seau (avant) ===\n");
const avant = {};
for (const it of items) {
  const [existe] = await seau.file(it.dest).exists();
  if (!existe) {
    avant[it.dest] = null;
    console.log(`  ${basename(it.dest).padEnd(24)} ABSENT du seau`);
    continue;
  }
  const [meta] = await seau.file(it.dest).getMetadata();
  avant[it.dest] = meta;
  console.log(
    `  ${basename(it.dest).padEnd(24)} seau ${ko(meta.size).padStart(9)}  ` +
      `local ${ko(it.taille).padStart(9)}  ` +
      (meta.md5Hash === it.md5 ? "→ IDENTIQUE" : "→ DIFFÉRENT, sera remplacé"),
  );
}

const aFaire = items.filter((it) => !avant[it.dest] || avant[it.dest].md5Hash !== it.md5);

if (aFaire.length === 0) {
  console.log("\nLes 7 objets du seau sont déjà identiques aux fichiers locaux. Rien à faire.\n");
  process.exit(0);
}

// ---------- Essai à blanc ----------------------------------------------------

if (!CONFIRMER) {
  console.log("\n=== ESSAI À BLANC — rien n'a été écrit ===\n");
  console.log(`  ${aFaire.length} fichier(s) seraient téléversés :\n`);
  for (const it of aFaire) console.log(`    ↑ ${basename(it.chemin)} → ${it.dest}`);
  console.log("\n  Pour procéder :  node scripts/televerser-cahiers-enonces-cd.js --confirmer\n");
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

// ---------- État APRÈS, relu depuis le seau ----------------------------------

console.log("\n=== État relu depuis le seau (après) ===\n");
let toutBon = true;
for (const it of items) {
  const [meta] = await seau.file(it.dest).getMetadata();
  const ok = meta.md5Hash === it.md5;
  if (!ok) toutBon = false;
  console.log(
    `  ${basename(it.dest).padEnd(24)} ${ko(meta.size).padStart(9)}  ` +
      `${dateCourte(meta.updated)}  MD5 = local : ${ok ? "✓ oui" : "✗ NON"}`,
  );
}
console.log();
if (toutBon) {
  console.log("  ✓ Les 7 objets du seau correspondent aux fichiers locaux (MD5 comparés).\n");
} else {
  console.error("  ✗ Au moins un MD5 ne correspond pas. Vérifier avant d'aller plus loin.\n");
  process.exit(1);
}
