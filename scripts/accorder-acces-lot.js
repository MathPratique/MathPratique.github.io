#!/usr/bin/env node
// ============================================================================
//  Accorder un accès à une liste d'étudiants d'un coup — source « code-classe ».
// ============================================================================
//
// Lit un fichier texte d'adresses (une par ligne, ignore les vides et les
// lignes commençant par #), et ouvre l'accès en Firestore pour chacune.
//
// Le fichier d'adresses vit HORS du dépôt — c'est des renseignements
// personnels. Le motif `courriels*.txt` est dans .gitignore par précaution ;
// le vrai fichier reste dans un dossier privé sur ton disque.
//
// ─── Idempotence ────────────────────────────────────────────────────────
//
// Le comportement selon l'état de l'accès existant :
//
//   Aucun doc              → ACCORDER — le cas normal
//   Doc, dateFin dépassée  → REMPLACER — résurrection d'un accès expiré
//                             (typique : étudiant de la session précédente)
//   Doc, dateFin future    → IGNORER — l'accès existant est respecté.
//                             Empêche un lot de piétiner un vrai achat à
//                             12 mois. Pour repartir à zéro sur une adresse
//                             en particulier : `acces-test.js --etat aucun`.
//
// ─── Confidentialité ────────────────────────────────────────────────────
//
// Aucun fichier de log écrit. La liste des adresses n'apparaît qu'à
// l'écran, et uniquement dans deux cas :
//   - En essai à blanc : chaque adresse avec son statut prévu, pour te
//     laisser détecter une coquille de transcription.
//   - Après --confirmer : uniquement les adresses PROBLÉMATIQUES (compte
//     inexistant, format invalide, accès déjà actif). Les succès sont
//     comptés, pas nommés.
//
// ─── Usage ──────────────────────────────────────────────────────────────
//
//   node scripts/accorder-acces-lot.js --fichier <chemin> --cours <coursId>
//     [--niveau <restreint|acheteur|enseignant>]  (défaut restreint)
//     [--mois N | --heures N]                     (défaut 12 mois)
//     [--confirmer]                               (sinon dry-run)
//
// Exemples :
//   # Essai à blanc — voir ce qui serait fait, sans rien écrire
//   node scripts/accorder-acces-lot.js \\
//     --fichier "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/cohorte-a26.txt" \\
//     --cours calcul-differentiel \\
//     --niveau restreint \\
//     --mois 5
//
//   # Pour appliquer — ajouter --confirmer, prompt PRODUCTION à taper.
//
// ============================================================================

import { readFileSync, existsSync } from "node:fs";
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
function argFlag(nom) {
  return process.argv.includes(`--${nom}`);
}

const cheminFichier = argOpt("fichier");
const coursId = argOpt("cours");
const niveauVoulu = argOpt("niveau") ?? "restreint";
const moisBrut = argOpt("mois");
const heuresBrut = argOpt("heures");
const confirmer = argFlag("confirmer");

if (!cheminFichier || !coursId) {
  console.error(`
Usage :
  node scripts/accorder-acces-lot.js --fichier <chemin> --cours <coursId> [options]

Options :
  --niveau L    restreint | acheteur | enseignant  (défaut : restreint)
  --mois N      durée en mois (entier positif)
  --heures N    durée en heures (entier positif) — exclusif avec --mois
  --confirmer   procéder pour vrai (sinon essai à blanc, aucune écriture)

Sans --mois ni --heures, la durée par défaut est 12 mois (comme un achat).

Exemple :
  node scripts/accorder-acces-lot.js --fichier /chemin/cohorte.txt \\
    --cours calcul-differentiel --niveau restreint --mois 5
`);
  process.exit(2);
}

if (!["restreint", "acheteur", "enseignant"].includes(niveauVoulu)) {
  console.error(`\n❌ --niveau doit valoir « restreint », « acheteur » ou « enseignant ». Reçu : « ${niveauVoulu} ».\n`);
  process.exit(2);
}

// --mois et --heures sont mutuellement exclusifs — refuser explicitement
// plutôt que d'en choisir un en silence (Simon ne s'en apercevrait qu'en
// relisant les dates d'expiration après coup).
if (moisBrut !== null && heuresBrut !== null) {
  console.error(`\n❌ --mois et --heures ne peuvent pas être combinés. Choisis-en un.\n`);
  process.exit(2);
}

function entierPositif(brut, nom) {
  const n = Number(brut);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    console.error(`\n❌ --${nom} attend un entier positif. Reçu : « ${brut} ».\n`);
    process.exit(2);
  }
  return n;
}

let dureeMois = null;
let dureeHeures = null;
if (moisBrut !== null) dureeMois = entierPositif(moisBrut, "mois");
if (heuresBrut !== null) dureeHeures = entierPositif(heuresBrut, "heures");

// ---------- Lecture du fichier ----------------------------------------------
//
// Attentions :
//  - Chemin Windows avec accents et espaces : `readFileSync` avec un
//    chemin absolu UTF-8 marche depuis Node 10+, aucun préambule requis.
//  - BOM UTF-8 (0xFEFF) : le Bloc-notes de Windows en met parfois un en
//    tête. Si présent, il colle à la première adresse et fait échouer
//    silencieusement la validation. On le retire.
//  - Encodage foireux (fichier en ISO-8859 forcé en UTF-8) : Node insère
//    U+FFFD (REPLACEMENT CHARACTER) pour chaque octet non-décodable. Si
//    on en trouve, on refuse plutôt que de traiter un fichier corrompu
//    en silence.

if (!existsSync(cheminFichier)) {
  console.error(`\n❌ Fichier introuvable : ${cheminFichier}\n`);
  process.exit(1);
}

let contenu;
try {
  contenu = readFileSync(cheminFichier, "utf-8");
} catch (err) {
  console.error(`\n❌ Impossible de lire le fichier : ${(err instanceof Error) ? err.message : String(err)}\n`);
  process.exit(1);
}

if (contenu.charCodeAt(0) === 0xfeff) {
  contenu = contenu.slice(1);
}

if (contenu.includes("\uFFFD")) {
  console.error(`
❌ Le fichier ${cheminFichier} contient des caractères de remplacement
   (\\uFFFD). Il n'est probablement pas en UTF-8.

   Ré-enregistre-le en UTF-8 :
     Bloc-notes → Fichier → Enregistrer sous → Encodage : UTF-8

   ou :
     VS Code → coin bas-droit « UTF-8 with BOM » → « Save with Encoding » → UTF-8

   puis relance le script.
`);
  process.exit(1);
}

// ---------- Parsing et validation des adresses -----------------------------
//
// Normalisation : trim + lowercase. La dedup se fait sur la version
// normalisée — Alice@X et alice@X sont la même adresse pour Firebase.
// La regex email est délibérément simple : elle attrape les typos
// évidents (espace dans le domaine, arobase manquant) sans prétendre à
// RFC 5322. Un email techniquement bizarre mais valide passera ; c'est
// acceptable pour un usage interne où Simon voit ses étudiants.

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const lignesLues = contenu.split(/\r?\n/);
const adressesInvalides = []; // { ligneOriginale, raison }
const adressesUniques = new Map(); // key = normalisé, value = { normalise, ligneNumero }
const doublons = []; // pour info dans le rapport

for (let i = 0; i < lignesLues.length; i++) {
  const brut = lignesLues[i];
  const nettoye = brut.trim();
  if (nettoye === "" || nettoye.startsWith("#")) continue;
  const normalise = nettoye.toLowerCase();
  if (!RE_EMAIL.test(normalise)) {
    adressesInvalides.push({ ligneOriginale: nettoye, raison: "format invalide" });
    continue;
  }
  if (adressesUniques.has(normalise)) {
    doublons.push({ ligneOriginale: nettoye, ligneNumero: i + 1 });
    continue;
  }
  adressesUniques.set(normalise, { normalise, ligneNumero: i + 1 });
}

const totalUniques = adressesUniques.size;
const totalInvalides = adressesInvalides.length;

if (totalUniques === 0 && totalInvalides === 0) {
  console.error(`\n❌ Aucune adresse dans le fichier (${cheminFichier}). Vérifie le contenu.\n`);
  process.exit(1);
}

// ---------- Calcul des dates ------------------------------------------------

const maintenant = Date.now();
const dateDebut = maintenant;
let dateFin;
let descriptionDuree;
if (dureeMois !== null) {
  dateFin = ajouterMois(dateDebut, dureeMois);
  descriptionDuree = `${dureeMois} mois`;
} else if (dureeHeures !== null) {
  dateFin = dateDebut + dureeHeures * 60 * 60 * 1000;
  descriptionDuree = `${dureeHeures} heure${dureeHeures > 1 ? "s" : ""}`;
} else {
  dateFin = ajouterMois(dateDebut, DUREE_ACCES_MOIS);
  descriptionDuree = `${DUREE_ACCES_MOIS} mois (défaut)`;
}
const dateFinLisible = new Date(dateFin).toISOString().slice(0, 10);

// ---------- Init Firebase Admin --------------------------------------------
//
// En essai à blanc, on lit Firebase Auth pour dire à Simon quels
// comptes existent — mais on n'écrit RIEN dans Firestore. Le prompt
// PRODUCTION est réservé aux runs --confirmer, sinon Simon devrait
// taper PRODUCTION juste pour voir un plan.

const action =
  `Ce script va accorder un accès de ${descriptionDuree} (niveau ${niveauVoulu}) ` +
  `sur le cours « ${coursId} » à ${totalUniques} adresse${totalUniques > 1 ? "s" : ""} ` +
  `distincte${totalUniques > 1 ? "s" : ""} lue${totalUniques > 1 ? "s" : ""} depuis ${cheminFichier}.`;

const { db, auth, modeEmulateur } = await initAdminOuMourir({
  racineDepot: RACINE,
  action,
  confirmerProduction: confirmer, // pas de prompt en dry-run (lecture seule)
});

// ---------- Résolution + classification -------------------------------------
//
// Pour chaque adresse valide, on résout l'uid via Firebase Auth. Un
// compte inexistant est un cas d'usage normal (Simon récolte les
// adresses avant que les étudiants s'inscrivent) — journalisé comme
// « à re-lancer après leur inscription », pas comme une erreur.
//
// Puis, pour les adresses avec uid, on lit le doc acces existant et on
// classe : accorder / remplacer (accès expiré) / ignorer (accès actif).

const ACCORDER = "accorder";
const REMPLACER = "remplacer";
const IGNORER = "ignorer";
const SANS_COMPTE = "sans-compte";
const ERREUR_AUTH = "erreur-auth";

// { normalise, statut, uid?, dateFinExistante?, err? }
const classees = [];

for (const [normalise] of adressesUniques) {
  let uid;
  try {
    const user = await auth.getUserByEmail(normalise);
    uid = user.uid;
  } catch (err) {
    const code = (err && typeof err === "object" && "code" in err) ? String(err.code) : "";
    if (code === "auth/user-not-found") {
      classees.push({ normalise, statut: SANS_COMPTE });
    } else {
      classees.push({ normalise, statut: ERREUR_AUTH, err: (err instanceof Error) ? err.message : String(err) });
    }
    continue;
  }

  const ref = db.doc(`utilisateurs/${uid}/acces/${coursId}`);
  const snap = await ref.get();
  if (!snap.exists) {
    classees.push({ normalise, statut: ACCORDER, uid });
    continue;
  }
  const donnees = snap.data() || {};
  const dateFinExistante = donnees.dateFin && typeof donnees.dateFin.toMillis === "function"
    ? donnees.dateFin.toMillis()
    : 0;
  if (dateFinExistante > maintenant) {
    classees.push({ normalise, statut: IGNORER, uid, dateFinExistante });
  } else {
    classees.push({ normalise, statut: REMPLACER, uid, dateFinExistante });
  }
}

// ---------- Sortie dry-run ou application -----------------------------------

const cible = modeEmulateur ? "ÉMULATEUR" : "PRODUCTION";

function isoJour(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function libelleStatut(s) {
  switch (s) {
    case ACCORDER: return "ACCORDER ";
    case REMPLACER: return "REMPLACER"; // accès expiré, sera écrasé
    case IGNORER: return "IGNORER  ";   // accès actif préservé
    case SANS_COMPTE: return "ATTENDRE ";
    case ERREUR_AUTH: return "ERREUR   ";
    default: return s;
  }
}

if (!confirmer) {
  console.log(`\nMode ESSAI À BLANC — aucune écriture (drapeau --confirmer absent).\n`);
  console.log(`Fichier : ${cheminFichier} (${totalUniques} adresse${totalUniques > 1 ? "s" : ""} unique${totalUniques > 1 ? "s" : ""}, ${lignesLues.length} ligne${lignesLues.length > 1 ? "s" : ""} lue${lignesLues.length > 1 ? "s" : ""})`);
  console.log(`Cible   : ${cible}, cours ${coursId}`);
  console.log(`Niveau  : ${niveauVoulu}`);
  console.log(`Durée   : ${descriptionDuree} (accès jusqu'au ${dateFinLisible})`);
  console.log(``);
  console.log(`Adresses à traiter (relis chaque ligne pour repérer une coquille) :\n`);
  for (const c of classees) {
    let extra = "";
    if (c.statut === IGNORER) extra = `  (déjà actif jusqu'au ${isoJour(c.dateFinExistante)})`;
    else if (c.statut === REMPLACER) extra = `  (accès expiré depuis ${isoJour(c.dateFinExistante)}, sera remplacé)`;
    else if (c.statut === SANS_COMPTE) extra = `  (compte Firebase inexistant — accès accordé à l'inscription si tu relances)`;
    else if (c.statut === ERREUR_AUTH) extra = `  (erreur Auth : ${c.err})`;
    console.log(`  ${libelleStatut(c.statut)}  ${c.normalise}${extra}`);
  }
  if (adressesInvalides.length > 0) {
    console.log(``);
    console.log(`Adresses invalides (ignorées) :\n`);
    for (const a of adressesInvalides) {
      console.log(`  INVALIDE   « ${a.ligneOriginale} »  (${a.raison})`);
    }
  }
  if (doublons.length > 0) {
    console.log(``);
    console.log(`Doublons dans le fichier (déjà comptés une seule fois) :\n`);
    for (const d of doublons) {
      console.log(`  DOUBLON    « ${d.ligneOriginale} »  (ligne ${d.ligneNumero})`);
    }
  }

  const nParStatut = { [ACCORDER]: 0, [REMPLACER]: 0, [IGNORER]: 0, [SANS_COMPTE]: 0, [ERREUR_AUTH]: 0 };
  for (const c of classees) nParStatut[c.statut]++;

  console.log(``);
  console.log(`Résumé prévu :`);
  console.log(`  Accès à accorder                         : ${nParStatut[ACCORDER]}`);
  console.log(`  Accès expirés à remplacer                : ${nParStatut[REMPLACER]}`);
  console.log(`  Accès actifs à ignorer                   : ${nParStatut[IGNORER]}`);
  console.log(`  Comptes inexistants (à recycler)         : ${nParStatut[SANS_COMPTE]}`);
  console.log(`  Erreurs Auth                             : ${nParStatut[ERREUR_AUTH]}`);
  console.log(`  Adresses invalides                       : ${adressesInvalides.length}`);
  console.log(``);
  console.log(`Pour appliquer :`);
  console.log(`  node scripts/accorder-acces-lot.js --fichier <chemin> --cours ${coursId} --niveau ${niveauVoulu} \\`);
  console.log(`    ${dureeMois !== null ? `--mois ${dureeMois}` : dureeHeures !== null ? `--heures ${dureeHeures}` : ""} --confirmer`);
  console.log(``);
  process.exit(0);
}

// ---------- Application (--confirmer) ---------------------------------------

const dateDebutTs = Timestamp.fromMillis(dateDebut);
const dateFinTs = Timestamp.fromMillis(dateFin);

const echecsEcriture = [];
let nAccordes = 0;
let nRemplaces = 0;

for (const c of classees) {
  if (c.statut === ACCORDER || c.statut === REMPLACER) {
    try {
      await db.doc(`utilisateurs/${c.uid}/acces/${coursId}`).set({
        coursId,
        source: "code-classe",
        niveau: niveauVoulu,
        dateDebut: dateDebutTs,
        dateFin: dateFinTs,
        aTelecharge: false,
      });
      if (c.statut === ACCORDER) nAccordes++;
      else nRemplaces++;
    } catch (err) {
      echecsEcriture.push({
        normalise: c.normalise,
        err: (err instanceof Error) ? err.message : String(err),
      });
    }
  }
}

// ---------- Rapport final --------------------------------------------------

const nIgnores = classees.filter((c) => c.statut === IGNORER).length;
const nSansCompte = classees.filter((c) => c.statut === SANS_COMPTE).length;
const nErreurAuth = classees.filter((c) => c.statut === ERREUR_AUTH).length;

console.log(`\n━━━ Rapport final ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Fichier : ${cheminFichier}`);
console.log(`Cible   : ${cible}, cours ${coursId}, niveau ${niveauVoulu}`);
console.log(`Durée   : ${descriptionDuree} (jusqu'au ${dateFinLisible})`);
console.log(``);
console.log(`Résultats :`);
console.log(`  Accès accordés                           : ${nAccordes}`);
console.log(`  Accès expirés remplacés                  : ${nRemplaces}`);
console.log(`  Accès actifs, ignorés                    : ${nIgnores}`);
console.log(`  Comptes inexistants                      : ${nSansCompte}`);
console.log(`  Erreurs Auth                             : ${nErreurAuth}`);
console.log(`  Erreurs Firestore (à réessayer)          : ${echecsEcriture.length}`);
console.log(`  Adresses invalides                       : ${adressesInvalides.length}`);

// Adresses problématiques uniquement — les succès sont comptés, pas nommés
// (confidentialité minimale : ne pas repeindre 42 adresses en clair).
const aCorriger =
  nSansCompte > 0 || nErreurAuth > 0 || echecsEcriture.length > 0 || adressesInvalides.length > 0 || nIgnores > 0;

if (aCorriger) {
  console.log(``);
  console.log(`Adresses à examiner :`);
  const sansCompte = classees.filter((c) => c.statut === SANS_COMPTE);
  if (sansCompte.length > 0) {
    console.log(``);
    console.log(`  Comptes inexistants (relance après leur inscription) :`);
    for (const c of sansCompte) console.log(`    - ${c.normalise}`);
  }
  const erreursAuth = classees.filter((c) => c.statut === ERREUR_AUTH);
  if (erreursAuth.length > 0) {
    console.log(``);
    console.log(`  Erreurs Auth :`);
    for (const c of erreursAuth) console.log(`    - ${c.normalise}  (${c.err})`);
  }
  if (echecsEcriture.length > 0) {
    console.log(``);
    console.log(`  Erreurs Firestore (relance le script pour retenter) :`);
    for (const e of echecsEcriture) console.log(`    - ${e.normalise}  (${e.err})`);
  }
  if (adressesInvalides.length > 0) {
    console.log(``);
    console.log(`  Formats invalides (à corriger dans le fichier) :`);
    for (const a of adressesInvalides) console.log(`    - « ${a.ligneOriginale} »`);
  }
  const ignores = classees.filter((c) => c.statut === IGNORER);
  if (ignores.length > 0) {
    console.log(``);
    console.log(`  Accès déjà actifs (info seulement, non écrasés) :`);
    for (const c of ignores) console.log(`    - ${c.normalise}  (jusqu'au ${isoJour(c.dateFinExistante)})`);
  }
}

console.log(``);
process.exit(echecsEcriture.length + nErreurAuth > 0 ? 1 : 0);
