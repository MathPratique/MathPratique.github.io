// ===========================================================================
//  Suppression des 7 cahiers d'indices de calcul différentiel dans le seau
// ===========================================================================
//
// ⚠️ OPÉRATION IRRÉVERSIBLE. Un objet supprimé de Cloud Storage ne se récupère
// pas : il n'y a ni corbeille ni versionnage sur ce seau.
//
// Contexte : le cahier d'indices a été fusionné dans le corrigé le
// 2026-10-05. Les 7 entrées ont été retirées du catalogue (commit 3ff8394) et
// les Cloud Functions redéployées. Les objets du seau ne sont donc plus
// atteignables par personne — plus aucune carte ne les demande, et
// `obtenirLienTelechargement` répondrait `document-inconnu`. Ils ne coûtent
// que de l'espace et de la confusion pour la prochaine lecture.
//
// GARDE-FOU PARTICULIER À CE SCRIPT : il REFUSE de supprimer quoi que ce soit
// tant qu'une copie locale fidèle des 7 objets n'existe pas. Fidèle veut dire
// MD5 identique à celui du seau, pas « un fichier du même nom ». Un PDF
// recompilé localement porte le même contenu mais un autre binaire : ce n'est
// pas une copie de ce qu'on détruit.
//
// Usage :
//   node scripts/supprimer-indices-cd.js              (essai à blanc)
//   node scripts/supprimer-indices-cd.js --confirmer  (supprime, après PRODUCTION)
//
// ===========================================================================

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { DOCUMENTS } from "../src/acces/documents.ts";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHEMIN_CLE = resolve(RACINE, "serviceAccountKey.json");
const NOM_SEAU = "mathpratique-8dea1.firebasestorage.app";

const COPIE =
  "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/exercices-calcul-differentiel/sorties/retire-2026-10-05/depuis-le-seau";

const CIBLES = [1, 2, 3, 4, 5, 6, 7].map(
  (n) => `calcul-differentiel/exercices/ch0${n}-2-indices.pdf`,
);

const CONFIRMER = process.argv.includes("--confirmer");
const ko = (n) => `${(Number(n) / 1024).toFixed(0)} Ko`;

// ---------- Garde-fou 1 : le catalogue ne doit plus les déclarer -------------

const encoreDeclares = DOCUMENTS.filter((d) => CIBLES.includes(d.chemin));
if (encoreDeclares.length > 0) {
  console.error(
    `\n❌ REFUS : ${encoreDeclares.length} de ces objets sont ENCORE au catalogue.\n`,
  );
  for (const d of encoreDeclares) console.error(`   ${d.id} → ${d.chemin}`);
  console.error(
    `\n   Supprimer un fichier qu'une carte propose encore produit un bouton\n` +
      `   qui échoue, pour quelqu'un qui a payé. Retirer d'abord les entrées,\n` +
      `   redéployer les functions, et seulement ensuite revenir ici.\n`,
  );
  process.exit(1);
}
console.log("\n✓ Aucune des 7 cibles n'est déclarée au catalogue.");

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

// ---------- Garde-fou 2 : la copie locale doit être FIDÈLE -------------------

console.log("\n=== Contrôle de la copie locale ===\n");
console.log(`  dossier : ${COPIE}\n`);
const presents = [];
let copieManquante = false;
for (const cible of CIBLES) {
  const nom = cible.split("/").pop();
  const [existe] = await seau.file(cible).exists();
  if (!existe) {
    console.log(`  ${nom.padEnd(24)} déjà absent du seau — rien à supprimer`);
    continue;
  }
  const [meta] = await seau.file(cible).getMetadata();
  const local = resolve(COPIE, nom);
  if (!existsSync(local)) {
    console.error(`  ${nom.padEnd(24)} ✗ AUCUNE copie locale`);
    copieManquante = true;
    continue;
  }
  const md5 = createHash("md5").update(readFileSync(local)).digest("base64");
  const fidele = md5 === meta.md5Hash;
  if (!fidele) copieManquante = true;
  console.log(
    `  ${nom.padEnd(24)} ${ko(meta.size).padStart(9)}   copie locale ` +
      (fidele ? "fidèle (MD5 identique)" : "✗ DIFFÉRENTE du seau"),
  );
  if (fidele) presents.push({ cible, nom, taille: Number(meta.size) });
}

if (copieManquante) {
  console.error(
    `\n❌ REFUS : au moins un objet n'a pas de copie locale fidèle.\n` +
      `   Rien n'a été supprimé. Télécharger d'abord les 7 objets depuis le\n` +
      `   seau vers ${COPIE}\n`,
  );
  process.exit(1);
}

if (presents.length === 0) {
  console.log("\nAucun objet à supprimer : le seau est déjà propre.\n");
  process.exit(0);
}

// ---------- Essai à blanc ----------------------------------------------------

const totalKo = presents.reduce((s, p) => s + p.taille, 0);

if (!CONFIRMER) {
  console.log("\n=== ESSAI À BLANC — rien n'a été supprimé ===\n");
  console.log(`  ${presents.length} objet(s) seraient SUPPRIMÉS, ${ko(totalKo)} au total :\n`);
  for (const p of presents) console.log(`    ✗ ${p.cible}`);
  console.log(
    `\n  Copie locale fidèle vérifiée pour les ${presents.length}.\n` +
      `\n  Pour procéder :  node scripts/supprimer-indices-cd.js --confirmer\n`,
  );
  process.exit(0);
}

// ---------- Garde-fou PRODUCTION --------------------------------------------

console.log(`
⚠️  ATTENTION — SUPPRESSION EN PRODUCTION, IRRÉVERSIBLE

Ce script va SUPPRIMER ${presents.length} objet(s) du seau Cloud Storage de
production (${NOM_SEAU}), soit ${ko(totalKo)}.

Il n'y a ni corbeille ni versionnage. La seule copie sera celle de
${COPIE}

Tape PRODUCTION pour procéder, n'importe quoi d'autre pour annuler.
`);
const rl = createInterface({ input: process.stdin, output: process.stdout });
try {
  const reponse = (await rl.question("> ")).trim();
  if (reponse !== "PRODUCTION") {
    console.error("\nOpération annulée. Rien n'a été supprimé.\n");
    process.exit(0);
  }
} finally {
  rl.close();
}

// ---------- Suppression ------------------------------------------------------

console.log("\n=== Suppression ===\n");
for (const p of presents) {
  process.stdout.write(`  ✗ ${p.nom.padEnd(24)} … `);
  await seau.file(p.cible).delete();
  console.log("supprimé");
}

// ---------- Relecture depuis le seau -----------------------------------------

console.log("\n=== Relecture depuis le seau (après) ===\n");
let toutParti = true;
for (const cible of CIBLES) {
  const [existe] = await seau.file(cible).exists();
  if (existe) toutParti = false;
  console.log(`  ${cible.split("/").pop().padEnd(24)} ${existe ? "✗ TOUJOURS LÀ" : "absent ✓"}`);
}

// Et le reste du dossier est-il intact ?
const [restants] = await seau.getFiles({ prefix: "calcul-differentiel/exercices/" });
console.log(`\n  Objets restants dans calcul-differentiel/exercices/ : ${restants.length}`);
console.log("  (14 attendus : 7 énoncés + 7 corrigés)");

console.log();
if (toutParti && restants.length === 14) {
  console.log("  ✓ Les 7 cahiers d'indices sont supprimés, les 14 autres sont intacts.\n");
} else {
  console.error("  ✗ État inattendu. Vérifier avant d'aller plus loin.\n");
  process.exit(1);
}
