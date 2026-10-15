// ===========================================================================
//  Export Firestore + Auth — LECTURE SEULE
// ===========================================================================
//
// Sauvegarde avant le passage du projet Google Cloud au compte complet.
// Aujourd'hui il n'existe aucune copie de ces donnees ailleurs que dans le
// projet : comptes, acces payes et progressions des etudiants.
//
// AUCUNE ECRITURE vers Firestore ou Auth. Le script lit, serialise, et
// ecrit UNIQUEMENT dans le dossier de destination local.
//
// DONNEES PERSONNELLES — l'export contient les adresses courriel des
// etudiants. La destination est hors de tout depot Git, volontairement :
// ces fichiers ne doivent jamais etre versionnes ni televerses.
//
// Piege connu : dans Firestore, un document parent peut etre « virtuel ».
// `utilisateurs/{uid}` peut ne pas exister comme document alors que sa
// sous-collection `acces` contient des documents. Un `.get()` sur la
// collection renvoie alors 0. Il faut `listDocuments()`, qui revele aussi
// les parents virtuels.
// ===========================================================================

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEST = process.argv[2];

if (!DEST) {
  console.error("Usage : node scripts/exporter-firestore-auth.mjs <dossier>");
  process.exit(1);
}

// Garde-fou : refuser une destination qui serait dans un depot Git.
let d = resolve(DEST);
while (d && d !== dirname(d)) {
  if (existsSync(join(d, ".git"))) {
    console.error(
      `REFUS : ${DEST} est dans le depot Git ${d}.\n` +
        `L'export contient des adresses courriel ; il ne doit pas etre versionne.`,
    );
    process.exit(1);
  }
  d = dirname(d);
}

mkdirSync(DEST, { recursive: true });

initializeApp({
  credential: cert(
    JSON.parse(readFileSync(resolve(RACINE, "serviceAccountKey.json"), "utf8")),
  ),
});

const db = getFirestore();
const auth = getAuth();

console.log("EXPORT FIRESTORE + AUTH — lecture seule");
console.log("=".repeat(78));
console.log(`  destination : ${DEST}\n`);

// ── Firestore ────────────────────────────────────────────────────────────
// On descend recursivement : pour chaque document, ses sous-collections.
async function exporterDoc(ref, profondeur = 0) {
  const snap = await ref.get();
  const noeud = {
    chemin: ref.path,
    existe: snap.exists,            // un parent virtuel donne false
    donnees: snap.exists ? snap.data() : null,
    sousCollections: {},
  };
  for (const sous of await ref.listCollections()) {
    noeud.sousCollections[sous.id] = await exporterCollection(sous, profondeur + 1);
  }
  return noeud;
}

async function exporterCollection(ref, profondeur = 0) {
  // listDocuments() revele les parents virtuels, contrairement a get().
  const refs = await ref.listDocuments();
  const docs = [];
  for (const r of refs) docs.push(await exporterDoc(r, profondeur));
  return docs;
}

const racines = await db.listCollections();
const firestore = {};
const compte = {};

for (const col of racines) {
  const docs = await exporterCollection(col);
  firestore[col.id] = docs;
  // compte les documents REELS, a tous les niveaux
  let reels = 0;
  let virtuels = 0;
  const parcourir = (liste) => {
    for (const n of liste) {
      n.existe ? reels++ : virtuels++;
      for (const s of Object.values(n.sousCollections)) parcourir(s);
    }
  };
  parcourir(docs);
  compte[col.id] = { racine: docs.length, reels, virtuels };
}

console.log("  FIRESTORE");
console.log("  " + "-".repeat(74));
for (const [nom, c] of Object.entries(compte)) {
  console.log(
    `    ${nom.padEnd(24)} ${String(c.racine).padStart(4)} a la racine` +
      `   ${String(c.reels).padStart(4)} documents reels` +
      `   ${String(c.virtuels).padStart(3)} parents virtuels`,
  );
}

const fFirestore = join(DEST, "firestore.json");
writeFileSync(fFirestore, JSON.stringify(firestore, null, 2) + "\n", "utf8");

// ── Auth ─────────────────────────────────────────────────────────────────
const comptes = [];
let page = await auth.listUsers(1000);
comptes.push(...page.users.map((u) => u.toJSON()));
while (page.pageToken) {
  page = await auth.listUsers(1000, page.pageToken);
  comptes.push(...page.users.map((u) => u.toJSON()));
}

const avecCourriel = comptes.filter((u) => u.email).length;
const verifies = comptes.filter((u) => u.emailVerified).length;

console.log("\n  AUTH");
console.log("  " + "-".repeat(74));
console.log(`    comptes                  ${String(comptes.length).padStart(4)}`);
console.log(`    avec adresse courriel    ${String(avecCourriel).padStart(4)}`);
console.log(`    courriel verifie         ${String(verifies).padStart(4)}`);

const fAuth = join(DEST, "auth.json");
writeFileSync(fAuth, JSON.stringify(comptes, null, 2) + "\n", "utf8");

// ── Relecture : l'export est-il reutilisable ? ────────────────────────────
console.log("\n  RELECTURE DE L'EXPORT");
console.log("  " + "-".repeat(74));
let ko = 0;
for (const [nom, chemin, attendu] of [
  ["firestore.json", fFirestore, Object.keys(firestore).length],
  ["auth.json", fAuth, comptes.length],
]) {
  try {
    const relu = JSON.parse(readFileSync(chemin, "utf8"));
    const n = Array.isArray(relu) ? relu.length : Object.keys(relu).length;
    const bon = n === attendu;
    if (!bon) ko++;
    console.log(
      `    ${nom.padEnd(18)} ${String(Math.round(statSync(chemin).size / 1024)).padStart(5)} Ko` +
        `   ${String(n).padStart(4)} entrees de premier niveau   ${bon ? "OK" : "*** ECART ***"}`,
    );
  } catch (e) {
    ko++;
    console.log(`    ${nom.padEnd(18)} *** ILLISIBLE : ${e.message} ***`);
  }
}

console.log("\n" + "=".repeat(78));
console.log(ko === 0
  ? "  Export complet et relu sans erreur."
  : `  *** ${ko} probleme(s) a la relecture ***`);
