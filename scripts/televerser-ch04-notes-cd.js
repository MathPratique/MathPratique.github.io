// ===========================================================================
//  Téléversement ciblé : les deux versions des notes du chapitre 4 (calcul diff.)
// ===========================================================================
//
// Script ad hoc, comme pour les lots précédents. `televerser-documents.js` ne
// sait pas cibler un sous-ensemble, et surtout il REFUSE DE PARTIR depuis que
// le catalogue couvre probabilités-statistique et calcul intégral : il exige
// que les ~65 sources existent toutes, or les PDF de ces deux cours ne sont
// pas sur ce poste. Il s'arrête donc avant d'écrire quoi que ce soit.
//
// Les deux objets existent déjà dans le seau : c'est un REMPLACEMENT, pas un
// ajout. Le catalogue déclare le chapitre 4 depuis toujours via
// `CHAPITRES_CALCUL` → `notesDeChapitre()` ; RIEN n'y est modifié, donc aucun
// `firebase deploy --only functions` n'est nécessaire — la fonction résout le
// même chemin qu'avant, seul l'octet au bout change.
//
// La politique d'accès ne bouge pas non plus :
//   - version ÉTUDIANT  → restreint + enseignant
//   - version PROF      → acheteur  + enseignant
//
// Les destinations ne sont PAS réécrites ici : elles sont lues dans
// `src/acces/documents.ts`, seule source de vérité. Un chemin recopié à la
// main finit toujours par diverger du catalogue, et un fichier téléversé au
// mauvais endroit est un document introuvable pour quelqu'un qui a payé.
//
// Source des PDF : `build/` du projet de notes. La racine de ce projet-là en
// contient des copies faites par `build.sh`, mais `build/` est l'original.
//
// Usage :
//   node scripts/televerser-ch04-notes-cd.js              (essai à blanc)
//   node scripts/televerser-ch04-notes-cd.js --confirmer  (écrit, après PRODUCTION)
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
  "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/notes+exercices-calcul-differentiel/build";

// Les deux documents visés, désignés par leur identifiant de catalogue.
const IDS = ["notes-ch04-derivee-definition-etudiant", "notes-ch04-derivee-definition-prof"];

const CONFIRMER = process.argv.includes("--confirmer");

const md5DeFichier = (chemin) =>
  createHash("md5").update(readFileSync(chemin)).digest("base64");

const ko = (n) => `${(Number(n) / 1024).toFixed(0)} Ko`;

const dateCourte = (iso) =>
  iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC" : "—";

// ---------- Résolution depuis le catalogue -----------------------------------

console.log("\n=== Documents visés, lus dans le catalogue ===\n");
const docs = [];
for (const id of IDS) {
  const d = DOCUMENTS.find((x) => x.id === id);
  if (!d) {
    console.error(`  ✗ Aucun document « ${id} » au catalogue. Rien n'a été fait.`);
    process.exit(1);
  }
  docs.push(d);
  console.log(`  ${d.id}`);
  console.log(`      titre   : ${d.titre}`);
  console.log(`      seau    : ${d.chemin}`);
  console.log(`      accès   : ${d.niveauxAutorises.join(", ")}`);
}

// Contrôle : on ne touche QUE des notes de calcul différentiel du chapitre 4.
const suspects = docs.filter(
  (d) => d.categorie !== "notes" || !d.chemin.includes("ch04-derivee-definition"),
);
if (suspects.length > 0) {
  console.error("\n❌ Un document visé n'est pas une note du chapitre 4 :");
  for (const d of suspects) console.error(`   ${d.id} → ${d.chemin}`);
  console.error("   Rien n'a été fait.\n");
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
  items.push({ dest: d.chemin, titre: d.titre, chemin, taille: st.size, md5: md5DeFichier(chemin) });
  console.log(
    `  ${basename(chemin).padEnd(38)} ${ko(st.size).padStart(9)}  modifié ${st.mtime
      .toISOString()
      .slice(0, 19)
      .replace("T", " ")}`,
  );
}
if (manquant) {
  console.error("\nAu moins un PDF source est introuvable. Rien n'a été fait.\n");
  console.error("Lancer `bash build.sh` dans le projet de notes, puis réessayer.\n");
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
    console.log(`  ${it.dest}\n      ABSENT du seau`);
    continue;
  }
  const [meta] = await seau.file(it.dest).getMetadata();
  avant[it.dest] = meta;
  const identique = meta.md5Hash === it.md5;
  console.log(`  ${it.dest}`);
  console.log(`      seau  : ${ko(meta.size).padStart(9)}   ${dateCourte(meta.updated)}`);
  console.log(`      local : ${ko(it.taille).padStart(9)}   ${identique ? "→ IDENTIQUE, téléversement inutile" : "→ DIFFÉRENT, sera remplacé"}`);
}

const aFaire = items.filter((it) => !avant[it.dest] || avant[it.dest].md5Hash !== it.md5);

if (aFaire.length === 0) {
  console.log("\nLes deux objets du seau sont déjà identiques aux fichiers locaux. Rien à faire.\n");
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
  console.log("\n  Pour procéder :  node scripts/televerser-ch04-notes-cd.js --confirmer\n");
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
let toutBon = true;
for (const it of items) {
  const [meta] = await seau.file(it.dest).getMetadata();
  const ok = meta.md5Hash === it.md5;
  if (!ok) toutBon = false;
  console.log(`  ${it.dest}`);
  console.log(
    `      ${ko(meta.size).padStart(9)}   ${dateCourte(meta.updated)}   MD5 = local : ${ok ? "✓ oui" : "✗ NON"}`,
  );
}
console.log();
if (toutBon) {
  console.log("  ✓ Les deux objets du seau correspondent aux fichiers locaux (MD5 comparés).\n");
} else {
  console.error("  ✗ Au moins un MD5 ne correspond pas. Vérifier avant d'aller plus loin.\n");
  process.exit(1);
}
