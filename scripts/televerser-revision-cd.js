// ===========================================================================
//  Téléversement ciblé : la série de révision cumulative (Calcul différentiel)
// ===========================================================================
//
// Frère de `televerser-ch03-cd.js`, pour les deux PDF de la série de révision
// cumulative. Contrairement aux cahiers de chapitre, ce sont ici des objets
// NOUVEAUX : ils n'existent pas encore dans le seau.
//
// Les chemins de destination reprennent exactement ce que déclare
// `src/acces/documents.ts` — recopiés plutôt que devinés.
//
// Source des PDF : `sorties/build/` du projet jumeau d'exercices, jamais
// `sorties/tex/` ni la racine.
//
// Usage :
//   node scripts/televerser-revision-cd.js              (essai à blanc)
//   node scripts/televerser-revision-cd.js --confirmer  (écrit, après PRODUCTION)
//
// ===========================================================================

import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHEMIN_CLE = resolve(RACINE, "serviceAccountKey.json");
const NOM_SEAU = "mathpratique-8dea1.firebasestorage.app";

const SOURCE = "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/exercices-calcul-differentiel/sorties/build";

const DOCUMENTS = [
  {
    local: "revision-cumulative.pdf",
    dest: "calcul-differentiel/revision/revision-cumulative.pdf",
    libelle: "Recueil (50 énoncés)",
  },
  {
    local: "revision-cumulative-solutions.pdf",
    dest: "calcul-differentiel/revision/revision-cumulative-solutions.pdf",
    libelle: "Solutions détaillées",
  },
];

const CONFIRMER = process.argv.includes("--confirmer");

const md5DeFichier = (chemin) =>
  createHash("md5").update(readFileSync(chemin)).digest("base64");

const ko = (n) => `${(Number(n) / 1024).toFixed(0)} Ko`;

const dateCourte = (iso) =>
  iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC" : "—";

// ---------- Sources locales -------------------------------------------------

console.log("\n=== Sources locales ===\n");
const items = [];
let manquant = false;
for (const d of DOCUMENTS) {
  const chemin = resolve(SOURCE, d.local);
  if (!existsSync(chemin)) {
    console.error(`  ✗ INTROUVABLE : ${chemin}`);
    manquant = true;
    continue;
  }
  const st = statSync(chemin);
  items.push({ ...d, chemin, taille: st.size, md5: md5DeFichier(chemin) });
  console.log(
    `  ${d.local.padEnd(36)} ${ko(st.size).padStart(9)}  ` +
    `modifié ${st.mtime.toISOString().slice(0, 19).replace("T", " ")}`
  );
}
if (manquant) {
  console.error("\nAu moins un PDF source est introuvable.");
  console.error("Lancer d'abord : node scripts/generer-revision.js dans le projet d'exercices,");
  console.error("puis compiler vers sorties/build/.\n");
  process.exit(1);
}

// ---------- Connexion -------------------------------------------------------

if (!existsSync(CHEMIN_CLE)) {
  console.error(`\n❌ Clé de service introuvable : ${CHEMIN_CLE}\n`);
  process.exit(1);
}
initializeApp({
  credential: cert(JSON.parse(readFileSync(CHEMIN_CLE, "utf-8"))),
  storageBucket: NOM_SEAU,
});
const seau = getStorage().bucket();

// ---------- État avant ------------------------------------------------------

console.log("\n=== État actuel dans le seau (avant) ===\n");
const avant = {};
for (const it of items) {
  const [existe] = await seau.file(it.dest).exists();
  if (!existe) {
    avant[it.dest] = null;
    console.log(`  ${it.dest}`);
    console.log(`      ABSENT du seau — sera créé (${ko(it.taille)})`);
    continue;
  }
  const [meta] = await seau.file(it.dest).getMetadata();
  avant[it.dest] = meta;
  const identique = meta.md5Hash === it.md5;
  console.log(`  ${it.dest}`);
  console.log(`      ${ko(meta.size).padStart(9)}   ${dateCourte(meta.updated)}`);
  console.log(`      local : ${ko(it.taille).padStart(9)}   ${identique ? "→ IDENTIQUE, rien à faire" : "→ DIFFÉRENT, sera remplacé"}`);
}

const aFaire = items.filter((it) => !avant[it.dest] || avant[it.dest].md5Hash !== it.md5);

if (aFaire.length === 0) {
  console.log("\nLes deux objets sont déjà identiques aux fichiers locaux. Rien à faire.\n");
  process.exit(0);
}

// ---------- Essai à blanc ---------------------------------------------------

if (!CONFIRMER) {
  console.log("\n=== ESSAI À BLANC — rien n'a été écrit ===\n");
  console.log(`  ${aFaire.length} fichier(s) seraient téléversés :\n`);
  for (const it of aFaire) {
    const nouveau = !avant[it.dest];
    console.log(`    ↑ ${it.libelle}`);
    console.log(`      ${it.chemin}`);
    console.log(`      → ${it.dest}   (${ko(it.taille)}, ${nouveau ? "création" : "remplacement"})`);
  }
  console.log("\n  Pour procéder :  node scripts/televerser-revision-cd.js --confirmer\n");
  process.exit(0);
}

// ---------- Garde-fou -------------------------------------------------------

console.log(`
⚠️  ATTENTION — CIBLE : PRODUCTION

Ce script va écrire ${aFaire.length} objet(s) dans le seau Cloud Storage de
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

// ---------- Téléversement ---------------------------------------------------

console.log("\n=== Téléversement ===\n");
for (const it of aFaire) {
  process.stdout.write(`  ↑ ${it.dest} … `);
  await seau.upload(it.chemin, {
    destination: it.dest,
    metadata: { contentType: "application/pdf" },
  });
  console.log("ok");
}

// ---------- État après, relu depuis le seau ---------------------------------

console.log("\n=== État relu depuis le seau (après) ===\n");
console.log("  " + "Objet".padEnd(56) + "Taille".padStart(10) + "   " + "Modifié".padEnd(24) + "MD5 = local");
console.log("  " + "-".repeat(56) + " " + "-".repeat(9) + "   " + "-".repeat(23) + " " + "-".repeat(11));
let toutBon = true;
for (const it of items) {
  const [meta] = await seau.file(it.dest).getMetadata();
  const ok = meta.md5Hash === it.md5;
  if (!ok) toutBon = false;
  console.log(
    "  " + it.dest.padEnd(56) +
    ko(meta.size).padStart(10) + "   " +
    dateCourte(meta.updated).padEnd(24) +
    (ok ? "✓ oui" : "✗ NON")
  );
}
console.log();
if (toutBon) {
  console.log("  ✓ Les deux objets du seau correspondent aux fichiers locaux (MD5 comparés).\n");
  console.log("  Prochaine étape : déployer les fonctions, puis pousser.\n");
} else {
  console.error("  ✗ Au moins un MD5 ne correspond pas. Vérifier avant d'aller plus loin.\n");
  process.exit(1);
}
