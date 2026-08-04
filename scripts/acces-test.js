#!/usr/bin/env node
// ============================================================================
//  Outil d'administration LOCAL — ouvre/expire/retire un accès dans Firestore.
// ============================================================================
//
// Écrit directement dans `utilisateurs/{uid}/acces/{coursId}` avec
// `source: "test"` pour permettre de vérifier les parcours d'accès sans
// passer par Stripe à chaque fois.
//
// ⚠️ USAGE LOCAL UNIQUEMENT. Ne pas déployer, ne pas embarquer, ne pas
// exécuter sur un serveur partagé : ce script court-circuite le webhook et
// signe avec la clé de service Firebase Admin — la plus puissante du projet.
//
// Prérequis :
//   1. Télécharger la clé de service Firebase :
//        Console Firebase → Paramètres du projet → Comptes de service
//        → « Générer une nouvelle clé privée » → sauver sous
//        `serviceAccountKey.json` À LA RACINE du dépôt.
//        Ce fichier est déjà dans .gitignore — vérifier qu'il n'apparaît
//        pas dans `git status` avant tout commit.
//   2. Installer firebase-admin si absent :
//        npm install --save-dev firebase-admin
//
// Usage :
//   node scripts/acces-test.js --courriel <compte> --cours calcul-differentiel --etat valide
//   node scripts/acces-test.js --courriel <compte> --cours calcul-differentiel --etat expire
//   node scripts/acces-test.js --courriel <compte> --cours calcul-differentiel --etat aucun
//
// Où :
//   --courriel  courriel du compte Firebase Auth (l'uid est résolu à partir)
//   --cours     identifiant du cours (« calcul-differentiel » pour l'instant)
//   --etat      valide  → ouvre un accès qui expire dans 12 mois
//               expire  → ouvre un accès dont la date de fin est déjà passée
//               aucun   → supprime l'accès existant
// ============================================================================

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";
import { ajouterMois, DUREE_ACCES_MOIS } from "../src/acces/regles.ts";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHEMIN_CLE = resolve(RACINE, "serviceAccountKey.json");

// ---------- Analyse des arguments -------------------------------------------

function argOpt(nom) {
  const idx = process.argv.indexOf(`--${nom}`);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

const courriel = argOpt("courriel");
const coursId = argOpt("cours");
const etatVoulu = argOpt("etat");

if (!courriel || !coursId || !etatVoulu) {
  console.error(`
Usage :
  node scripts/acces-test.js --courriel <compte> --cours <coursId> --etat <valide|expire|aucun>

Exemple :
  node scripts/acces-test.js --courriel test@exemple.com --cours calcul-differentiel --etat valide
`);
  process.exit(2);
}

if (!["valide", "expire", "aucun"].includes(etatVoulu)) {
  console.error(`\n❌ --etat doit valoir « valide », « expire » ou « aucun ». Reçu : « ${etatVoulu} ».\n`);
  process.exit(2);
}

if (!existsSync(CHEMIN_CLE)) {
  console.error(`
❌ Clé de service introuvable : ${CHEMIN_CLE}

Marche à suivre :
  1. Console Firebase → Paramètres du projet → Comptes de service
  2. « Générer une nouvelle clé privée »
  3. Enregistrer le fichier téléchargé sous :
       serviceAccountKey.json     (à la racine du dépôt)
  4. Vérifier que \`git status\` ne le voit pas (il est dans .gitignore).
`);
  process.exit(1);
}

// ---------- Initialisation Firebase Admin -----------------------------------

const cle = JSON.parse(readFileSync(CHEMIN_CLE, "utf-8"));
admin.initializeApp({
  credential: admin.credential.cert(cle),
});
const db = admin.firestore();
const auth = admin.auth();

// ---------- Résolution du courriel → uid ------------------------------------

let uid;
try {
  const user = await auth.getUserByEmail(courriel);
  uid = user.uid;
} catch (err) {
  console.error(`\n❌ Aucun utilisateur avec le courriel « ${courriel} ».\n`);
  console.error(`   Détail : ${err.message}\n`);
  console.error(`   Vérifie que le compte existe : Console Firebase → Authentication.\n`);
  process.exit(1);
}

console.log(`\nUtilisateur trouvé : ${courriel} → uid ${uid}`);
console.log(`Cours : ${coursId}`);
console.log(`État demandé : ${etatVoulu}\n`);

// ---------- Écriture Firestore ----------------------------------------------

const ref = db.doc(`utilisateurs/${uid}/acces/${coursId}`);

if (etatVoulu === "aucun") {
  const snap = await ref.get();
  if (!snap.exists) {
    console.log(`ℹ️  Rien à faire — aucun accès existant.`);
    process.exit(0);
  }
  await ref.delete();
  console.log(`✅ Accès supprimé.`);
  process.exit(0);
}

const maintenant = Date.now();
let dateDebut, dateFin;

if (etatVoulu === "valide") {
  dateDebut = maintenant;
  dateFin = ajouterMois(dateDebut, DUREE_ACCES_MOIS);
} else {
  // « expire » : accès qui s'est terminé la veille.
  const JOUR_MS = 24 * 60 * 60 * 1000;
  dateFin = maintenant - JOUR_MS;
  dateDebut = ajouterMois(dateFin, -DUREE_ACCES_MOIS);
}

await ref.set({
  coursId,
  source: "test",
  dateDebut: admin.firestore.Timestamp.fromMillis(dateDebut),
  dateFin: admin.firestore.Timestamp.fromMillis(dateFin),
  aTelecharge: false,
  reference: `test-${Date.now()}`,
});

console.log(`✅ Accès écrit.`);
console.log(`   dateDebut : ${new Date(dateDebut).toISOString()}`);
console.log(`   dateFin   : ${new Date(dateFin).toISOString()}`);
console.log(`   source    : test`);
console.log(``);
console.log(`Pour retirer cet accès :`);
console.log(`   node scripts/acces-test.js --courriel ${courriel} --cours ${coursId} --etat aucun`);
process.exit(0);
