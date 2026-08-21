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

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Timestamp } from "firebase-admin/firestore";
import { ajouterMois, DUREE_ACCES_MOIS } from "../src/acces/regles.ts";
import { initAdminOuMourir } from "./lib/admin.js";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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
  node scripts/acces-test.js --courriel <compte> --cours <coursId> --etat <valide|expire|aucun> [--heures N] [--niveau L]

Options :
  --heures N   Durée personnalisée en heures (entier positif), UNIQUEMENT
               avec --etat valide. Sans ce drapeau, l'accès dure 12 mois
               comme un vrai achat.
  --niveau L   Niveau d'accès aux documents : restreint | acheteur | enseignant.
               Défaut : « restreint » (le plus restrictif — un accès mal
               configuré doit donner trop peu, jamais trop). N'a d'effet
               qu'avec --etat valide ou expire (le doc est alors écrit).

Exemple :
  node scripts/acces-test.js --courriel test@exemple.com --cours calcul-differentiel --etat valide
  node scripts/acces-test.js --courriel test@exemple.com --cours calcul-differentiel --etat valide --heures 24
  node scripts/acces-test.js --courriel test@exemple.com --cours calcul-differentiel --etat valide --niveau acheteur
`);
  process.exit(2);
}

if (!["valide", "expire", "aucun"].includes(etatVoulu)) {
  console.error(`\n❌ --etat doit valoir « valide », « expire » ou « aucun ». Reçu : « ${etatVoulu} ».\n`);
  process.exit(2);
}

// --niveau : lu et validé strictement — écrire une valeur inconnue en
// Firestore laisserait `niveauDe` la ramener à « restreint » côté serveur,
// mais le doc en base serait faux, ce qui trompe l'admin qui le consulte.
// Rejet explicite = message d'erreur clair au moment de l'écriture.
const niveauVoulu = argOpt("niveau") ?? "restreint";
if (!["restreint", "acheteur", "enseignant"].includes(niveauVoulu)) {
  console.error(`\n❌ --niveau doit valoir « restreint », « acheteur » ou « enseignant ». Reçu : « ${niveauVoulu} ».\n`);
  process.exit(2);
}

// --heures : durée personnalisée en heures, pour --etat valide seulement.
// Absent → comportement d'origine (12 mois). Présent avec un autre --etat
// → erreur explicite plutôt qu'ignore silencieux — on ne veut pas qu'un
// « --heures 24 » sur --etat expire soit accepté et fasse croire à un
// résultat qui n'aura aucun effet.
const heuresBrut = argOpt("heures");
let dureeHeures = null;
if (heuresBrut !== null) {
  const n = Number(heuresBrut);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    console.error(`\n❌ --heures attend un entier positif. Reçu : « ${heuresBrut} ».\n`);
    process.exit(2);
  }
  if (etatVoulu !== "valide") {
    console.error(`\n❌ --heures ne s'utilise qu'avec --etat valide (reçu --etat ${etatVoulu}).\n`);
    process.exit(2);
  }
  dureeHeures = n;
}

// Init Firebase Admin : détection du mode émulateur, exigence de la clé
// de service en production, prompt PRODUCTION à taper à la main. Toute
// la mécanique du garde-fou vit dans lib/admin.js — partagée avec les
// autres scripts CLI pour ne jamais laisser une version affaiblie.
const actionDescriptive =
  etatVoulu === "aucun"
    ? `Ce script va SUPPRIMER l'accès de « ${courriel} » au cours « ${coursId} ».`
    : etatVoulu === "expire"
      ? `Ce script va poser un accès EXPIRÉ pour « ${courriel} » sur le cours « ${coursId} ».`
      : `Ce script va accorder un accès valide à « ${courriel} » sur le cours « ${coursId} » (niveau ${niveauVoulu}).`;
const { db, auth } = await initAdminOuMourir({ racineDepot: RACINE, action: actionDescriptive });

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
  if (dureeHeures !== null) {
    const HEURE_MS = 60 * 60 * 1000;
    dateFin = dateDebut + dureeHeures * HEURE_MS;
  } else {
    dateFin = ajouterMois(dateDebut, DUREE_ACCES_MOIS);
  }
} else {
  // « expire » : accès qui s'est terminé la veille.
  const JOUR_MS = 24 * 60 * 60 * 1000;
  dateFin = maintenant - JOUR_MS;
  dateDebut = ajouterMois(dateFin, -DUREE_ACCES_MOIS);
}

await ref.set({
  coursId,
  source: "test",
  niveau: niveauVoulu,
  dateDebut: Timestamp.fromMillis(dateDebut),
  dateFin: Timestamp.fromMillis(dateFin),
  aTelecharge: false,
  reference: `test-${Date.now()}`,
});

console.log(`✅ Accès écrit.`);
console.log(`   dateDebut : ${new Date(dateDebut).toISOString()}`);
console.log(`   dateFin   : ${new Date(dateFin).toISOString()}`);
console.log(`   source    : test`);
console.log(`   niveau    : ${niveauVoulu}`);
console.log(``);
console.log(`Pour retirer cet accès :`);
console.log(`   node scripts/acces-test.js --courriel ${courriel} --cours ${coursId} --etat aucun`);
process.exit(0);
