// ===========================================================================
//  Téléversement ciblé : la série de révision pour l'examen 3 (Calcul différentiel)
// ===========================================================================
//
// Frère de `televerser-melange-ch05-cd.js`, pour les deux PDF de la série de
// révision pour l'examen 3 (55 exercices) : le recueil des énoncés et le
// document de solutions (tableau des réponses finales, puis solutions
// détaillées). Ce sont des objets NOUVEAUX, et le script refuse d'en
// remplacer un : si une destination existe déjà avec un contenu différent, il
// s'arrête sans rien écrire. Remplacer un PDF publié est une autre décision
// (sauvegarde préalable du seau, qui n'a pas de gestion de versions).
//
// Les chemins de destination reprennent exactement ce que déclare
// `src/acces/documents.ts` (accès « restreint » seulement).
//
// Source des PDF : `sorties/build/` du projet jumeau d'exercices, produits par
// `scripts/generer-revision-examen3.js` puis compilés (build-tout.sh) — jamais
// `sorties/tex/` ni la racine.
//
// Usage :
//   node scripts/televerser-revision-examen3-cd.mjs              (essai à blanc)
//   node scripts/televerser-revision-examen3-cd.mjs --confirmer  (écrit, après PRODUCTION)
//
// Sortie par `process.exitCode = await main()` plutôt que `process.exit()` :
// sous Windows (Node 24), `process.exit()` après des appels réseau peut faire
// planter le processus (code 127).
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
    local: "revision-examen3.pdf",
    dest: "calcul-differentiel/revision/revision-examen3.pdf",
    libelle: "Recueil (55 énoncés)",
  },
  {
    local: "revision-examen3-solutions.pdf",
    dest: "calcul-differentiel/revision/revision-examen3-solutions.pdf",
    libelle: "Solutions (réponses finales, puis solutions détaillées)",
  },
];

const CONFIRMER = process.argv.includes("--confirmer");

const md5DeFichier = (chemin) => createHash("md5").update(readFileSync(chemin)).digest("base64");
const ko = (n) => `${(Number(n) / 1024).toFixed(0)} Ko`;
const dateCourte = (iso) =>
  iso ? new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC" : "—";

async function main() {
  // ---------- Sources locales -----------------------------------------------
  console.log("\n=== Sources locales ===\n");
  const items = [];
  for (const d of DOCUMENTS) {
    const chemin = resolve(SOURCE, d.local);
    if (!existsSync(chemin)) {
      console.error(`  ✗ INTROUVABLE : ${chemin}`);
      console.error("\nProduire d'abord les PDF : node scripts/generer-revision-examen3.js dans le projet");
      console.error("d'exercices, puis les compiler vers sorties/build/.\n");
      return 1;
    }
    const st = statSync(chemin);
    const md5 = md5DeFichier(chemin);
    items.push({ ...d, chemin, taille: st.size, md5 });
    console.log(
      `  ${d.local.padEnd(34)} ${ko(st.size).padStart(9)}  ` +
        `modifié ${st.mtime.toISOString().slice(0, 19).replace("T", " ")}  md5 ${md5}`,
    );
  }

  // ---------- Connexion ------------------------------------------------------
  if (!existsSync(CHEMIN_CLE)) {
    console.error(`\n❌ Clé de service introuvable : ${CHEMIN_CLE}\n`);
    return 1;
  }
  initializeApp({
    credential: cert(JSON.parse(readFileSync(CHEMIN_CLE, "utf-8"))),
    storageBucket: NOM_SEAU,
  });
  const seau = getStorage().bucket();

  // ---------- État avant -----------------------------------------------------
  console.log("\n=== État actuel dans le seau (avant) ===\n");
  const [dejaLa] = await seau.getFiles({ prefix: "calcul-differentiel/revision/" });
  console.log(`  calcul-differentiel/revision/ : ${dejaLa.length} objet(s)`);
  for (const f of dejaLa) console.log(`      ${f.name.padEnd(62)} ${ko(f.metadata.size).padStart(9)}`);
  console.log("");
  const avant = {};
  const occupes = [];
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
    if (!identique) occupes.push(it.dest);
    console.log(`  ${it.dest}`);
    console.log(`      ${ko(meta.size).padStart(9)}   ${dateCourte(meta.updated)}   md5 ${meta.md5Hash}`);
    console.log(`      local : ${ko(it.taille).padStart(9)}   ${identique ? "→ IDENTIQUE, rien à faire" : "→ DIFFÉRENT — REFUS de remplacer"}`);
  }
  if (occupes.length) {
    console.error(`\n✗ ${occupes.length} destination(s) déjà occupée(s) par un autre contenu.`);
    console.error("  Ce script ne crée que des objets nouveaux. Rien n'a été écrit.\n");
    return 1;
  }
  const aFaire = items.filter((it) => !avant[it.dest]);
  if (aFaire.length === 0) {
    console.log("\nLes deux objets sont déjà dans le seau, identiques (MD5) aux fichiers locaux. Rien à faire.\n");
    return 0;
  }

  // ---------- Essai à blanc --------------------------------------------------
  if (!CONFIRMER) {
    console.log("\n=== ESSAI À BLANC — rien n'a été écrit ===\n");
    console.log(`  ${aFaire.length} fichier(s) seraient téléversés :\n`);
    for (const it of aFaire) {
      console.log(`    ↑ ${it.libelle}`);
      console.log(`      ${it.chemin}`);
      console.log(`      → ${it.dest}   (${ko(it.taille)}, création)`);
    }
    console.log("\n  Pour procéder :  node scripts/televerser-revision-examen3-cd.mjs --confirmer\n");
    return 0;
  }

  // ---------- Garde-fou ------------------------------------------------------
  console.log(`
⚠️  ATTENTION — CIBLE : PRODUCTION

Ce script va écrire ${aFaire.length} objet(s) dans le seau Cloud Storage de
production (${NOM_SEAU}).

Tape PRODUCTION pour procéder, n'importe quoi d'autre pour annuler.
`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let reponse;
  try {
    reponse = (await rl.question("> ")).trim();
  } finally {
    rl.close();
  }
  if (reponse !== "PRODUCTION") {
    console.error("\nOpération annulée. Rien n'a été téléversé.\n");
    return 0;
  }

  // ---------- Téléversement --------------------------------------------------
  // `ifGenerationMatch: 0` : Cloud Storage refuse l'écriture si l'objet est
  // apparu entre la vérification ci-dessus et maintenant.
  console.log("\n=== Téléversement ===\n");
  for (const it of aFaire) {
    process.stdout.write(`  ↑ ${it.dest} … `);
    await seau.upload(it.chemin, {
      destination: it.dest,
      metadata: { contentType: "application/pdf" },
      preconditionOpts: { ifGenerationMatch: 0 },
    });
    console.log("ok");
  }

  // ---------- État après, relu depuis le seau --------------------------------
  console.log("\n=== État relu depuis le seau (après) ===\n");
  let toutBon = true;
  for (const it of items) {
    const [meta] = await seau.file(it.dest).getMetadata();
    const ok = meta.md5Hash === it.md5 && Number(meta.size) === it.taille;
    if (!ok) toutBon = false;
    console.log(`  ${it.dest.padEnd(60)} ${ko(meta.size).padStart(9)}   ${dateCourte(meta.updated)}   MD5 = local : ${ok ? "OUI" : "NON"}`);
  }
  const [apres] = await seau.getFiles({ prefix: "calcul-differentiel/revision/" });
  console.log(`\n  calcul-differentiel/revision/ : ${apres.length} objet(s) (avant : ${dejaLa.length})`);
  console.log(toutBon ? "\n✓ Les deux objets lus dans le seau sont identiques aux fichiers locaux.\n"
    : "\n✗ Au moins un objet diffère du fichier local : à examiner avant toute autre étape.\n");
  return toutBon ? 0 : 1;
}

process.exitCode = await main();
