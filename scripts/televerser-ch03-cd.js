// ===========================================================================
//  Téléversement ciblé : les trois cahiers du chapitre 3 de Calcul différentiel
// ===========================================================================
//
// Script ad hoc, comme pour les lots précédents : `televerser-documents.js`
// ne sait pas cibler un sous-ensemble de documents. Les trois objets existent
// déjà dans le seau — c'est un REMPLACEMENT, pas un ajout. Le catalogue
// `src/acces/documents.ts` déclare déjà CAHIERS_COMPLETS pour ce chapitre :
// rien à y changer.
//
// Source des PDF : `sorties/build/` du projet jumeau d'exercices, jamais la
// racine de ce projet-là, qui n'en contient que des copies.
//
// Usage :
//   node scripts/televerser-ch03-cd.js              (essai à blanc)
//   node scripts/televerser-ch03-cd.js --confirmer  (écrit, après PRODUCTION)
//
// ===========================================================================

import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHEMIN_CLE = resolve(RACINE, "serviceAccountKey.json");
const NOM_SEAU = "mathpratique-8dea1.firebasestorage.app";

// Le dossier de build du projet d'exercices — la source de vérité des PDF.
const SOURCE = "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/exercices-calcul-differentiel/sorties/build";

// Les trois cahiers. La destination reprend exactement ce que construit
// `cahiersDeChapitre()` dans src/acces/documents.ts :
//   chemin = `${cours.id}/exercices/${num}-${fichier}.pdf`
const CAHIERS = [
  { local: "ch03-1-exercices.pdf", dest: "calcul-differentiel/exercices/ch03-1-exercices.pdf", libelle: "Exercices" },
  { local: "ch03-2-indices.pdf", dest: "calcul-differentiel/exercices/ch03-2-indices.pdf", libelle: "Indices" },
  { local: "ch03-3-corrige.pdf", dest: "calcul-differentiel/exercices/ch03-3-corrige.pdf", libelle: "Corrigé" },
];

const CONFIRMER = process.argv.includes("--confirmer");

const md5DeFichier = (chemin) =>
  createHash("md5").update(readFileSync(chemin)).digest("base64");

const ko = (n) => `${(Number(n) / 1024).toFixed(0)} Ko`;

const dateCourte = (iso) =>
  iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC" : "—";

// ---------- Contrôle des sources locales ------------------------------------

console.log("\n=== Sources locales ===\n");
const items = [];
let manquant = false;
for (const c of CAHIERS) {
  const chemin = resolve(SOURCE, c.local);
  if (!existsSync(chemin)) {
    console.error(`  ✗ INTROUVABLE : ${chemin}`);
    manquant = true;
    continue;
  }
  const st = statSync(chemin);
  const md5 = md5DeFichier(chemin);
  items.push({ ...c, chemin, taille: st.size, mtime: st.mtime, md5 });
  console.log(`  ${c.local.padEnd(24)} ${ko(st.size).padStart(9)}  modifié ${st.mtime.toISOString().slice(0, 19).replace("T", " ")}`);
}
if (manquant) {
  console.error("\nAu moins un PDF source est introuvable. Rien n'a été fait.\n");
  process.exit(1);
}

// ---------- Connexion au seau ------------------------------------------------

if (!existsSync(CHEMIN_CLE)) {
  console.error(`\n❌ Clé de service introuvable : ${CHEMIN_CLE}\n`);
  process.exit(1);
}
const cle = JSON.parse(readFileSync(CHEMIN_CLE, "utf-8"));
initializeApp({ credential: cert(cle), storageBucket: NOM_SEAU });
const seau = getStorage().bucket();

// ---------- État AVANT, lu depuis le seau ------------------------------------

console.log("\n=== État actuel dans le seau (avant) ===\n");
const avant = {};
for (const it of items) {
  const [existe] = await seau.file(it.dest).exists();
  if (!existe) {
    avant[it.dest] = null;
    console.log(`  ${it.dest}\n      ABSENT du seau`);
    continue;
  }
  const [meta] = await seau.file(it.dest).getMetadata();
  avant[it.dest] = meta;
  const identique = meta.md5Hash === it.md5;
  console.log(`  ${it.dest}`);
  console.log(`      ${ko(meta.size).padStart(9)}   ${dateCourte(meta.updated)}   md5 ${meta.md5Hash}`);
  console.log(`      local : ${ko(it.taille).padStart(9)}   md5 ${it.md5}   ${identique ? "→ IDENTIQUE, téléversement inutile" : "→ DIFFÉRENT, sera remplacé"}`);
}

const aFaire = items.filter((it) => !avant[it.dest] || avant[it.dest].md5Hash !== it.md5);

if (aFaire.length === 0) {
  console.log("\nLes trois objets du seau sont déjà identiques aux fichiers locaux. Rien à faire.\n");
  process.exit(0);
}

// ---------- Essai à blanc ----------------------------------------------------

if (!CONFIRMER) {
  console.log("\n=== ESSAI À BLANC — rien n'a été écrit ===\n");
  console.log(`  ${aFaire.length} fichier(s) seraient téléversés :\n`);
  for (const it of aFaire) {
    console.log(`    ↑ ${it.chemin}`);
    console.log(`      → ${it.dest}   (${ko(it.taille)})`);
  }
  console.log("\n  Pour procéder :  node scripts/televerser-ch03-cd.js --confirmer\n");
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
  process.stdout.write(`  ↑ ${it.dest} … `);
  await seau.upload(it.chemin, {
    destination: it.dest,
    metadata: { contentType: "application/pdf" },
  });
  console.log("ok");
}

// ---------- État APRÈS, relu depuis le seau ----------------------------------

console.log("\n=== État relu depuis le seau (après) ===\n");
console.log("  " + "Objet".padEnd(52) + "Taille".padStart(10) + "   " + "Modifié".padEnd(24) + "MD5 = local");
console.log("  " + "-".repeat(52) + " " + "-".repeat(9) + "   " + "-".repeat(23) + " " + "-".repeat(11));
let toutBon = true;
for (const it of items) {
  const [meta] = await seau.file(it.dest).getMetadata();
  const ok = meta.md5Hash === it.md5;
  if (!ok) toutBon = false;
  console.log(
    "  " + it.dest.padEnd(52) +
    ko(meta.size).padStart(10) + "   " +
    dateCourte(meta.updated).padEnd(24) +
    (ok ? "✓ oui" : "✗ NON")
  );
}
console.log();
if (toutBon) {
  console.log("  ✓ Les trois objets du seau correspondent aux fichiers locaux (MD5 comparés).\n");
} else {
  console.error("  ✗ Au moins un MD5 ne correspond pas. Vérifier avant d'aller plus loin.\n");
  process.exit(1);
}
