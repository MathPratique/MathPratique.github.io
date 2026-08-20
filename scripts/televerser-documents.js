#!/usr/bin/env node
// ============================================================================
//  Téléverse les 65 PDF de calcul différentiel vers Cloud Storage PROD.
// ============================================================================
//
// Reprend le patron de acces-test.js :
//   - clé de service à la racine (serviceAccountKey.json)
//   - garde-fou PRODUCTION à taper à la main
//   - refus explicite de partir sans la clé
//
// Le catalogue src/acces/documents.ts est la SEULE source de vérité pour :
//   - la liste des fichiers à téléverser
//   - le chemin de destination dans le seau
//   - la catégorie qui détermine le sous-dossier de destination
//
// Le mapping vers les SOURCES sur disque se fait par catégorie : notes et
// exercices vivent dans un dossier, revision et examens dans un autre. Le
// nom du fichier sur disque = le basename du chemin de destination.
//
// Usage :
//   node scripts/televerser-documents.js               (essai à blanc)
//   node scripts/televerser-documents.js --confirmer   (téléverse pour vrai)
//
// Prérequis :
//   - serviceAccountKey.json à la racine (voir scripts/acces-test.js pour
//     la marche à suivre) — dans .gitignore, à vérifier avant tout commit.
//   - firebase-admin déjà en devDependency.
//   - Les 65 fichiers PDF présents aux deux emplacements sources ci-dessous.
//
// Ce que le script fait :
//   1. Résout chaque doc du catalogue vers son fichier source local.
//   2. Vérifie que les 65 sources existent — s'il en manque, arrête tout et
//      liste les manquants. Aucun téléversement partiel.
//   3. Mode --confirmer absent : imprime le plan (dest ← source, tailles).
//   4. Mode --confirmer présent : exige la clé, prompt PRODUCTION, puis
//      téléverse séquentiellement avec content-type application/pdf.
//   5. Écrase silencieusement un fichier existant — le script est
//      relançable sans conséquence.
//   6. Rapport final : réussis / total, taille totale, liste des échecs.
// ============================================================================

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { DOCUMENTS } from "../src/acces/documents.ts";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHEMIN_CLE = resolve(RACINE, "serviceAccountKey.json");
const NOM_SEAU = "mathpratique-8dea1.firebasestorage.app";

// Deux dossiers sources sur ton disque. La catégorie du document dans le
// catalogue (notes / exercices / revision / examens) détermine lequel.
// Chemins écrits en forward slash — Node accepte les deux sur Windows.
const RACINE_NOTES_EXOS =
  "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/notes+exercices-calcul-differentiel";
const RACINE_REVISION_EXAMENS =
  "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/exercices-calcul-differentiel/sorties/build";

const SOURCE_PAR_CATEGORIE = {
  notes: RACINE_NOTES_EXOS,
  exercices: RACINE_NOTES_EXOS,
  revision: RACINE_REVISION_EXAMENS,
  examens: RACINE_REVISION_EXAMENS,
};

// ---------- Analyse des arguments -------------------------------------------

const confirmer = process.argv.includes("--confirmer");

// ---------- Résolution des sources locales pour chaque document ------------

/**
 * Pour chaque doc du catalogue, associe le chemin source local attendu.
 * Le nom du fichier sur disque = le basename du chemin de destination
 * dans le seau. Il n'y a pas de renommage à cette étape.
 */
function resoudreSources() {
  return DOCUMENTS.map((doc) => {
    const nomFichier = basename(doc.chemin);
    const dossierLocal = SOURCE_PAR_CATEGORIE[doc.categorie];
    if (!dossierLocal) {
      return { doc, source: null, existe: false, raison: `catégorie inconnue: ${doc.categorie}` };
    }
    const source = resolve(dossierLocal, nomFichier);
    const existe = existsSync(source);
    return { doc, source, existe, raison: existe ? null : "fichier introuvable sur disque" };
  });
}

const items = resoudreSources();

// ---------- Vérification préalable : tout ou rien --------------------------

const manquants = items.filter((i) => !i.existe);
if (manquants.length > 0) {
  console.error(`\n❌ ${manquants.length} fichier(s) source(s) introuvable(s) — rien ne sera téléversé.\n`);
  for (const m of manquants) {
    console.error(`  ${m.doc.id}`);
    console.error(`    dest attendue  : ${m.doc.chemin}`);
    console.error(`    source cherchée: ${m.source ?? "(pas de mapping)"}`);
    console.error(`    raison         : ${m.raison}`);
    console.error("");
  }
  process.exit(1);
}

// Taille totale, calculée une fois.
let tailleTotaleOctets = 0;
for (const i of items) tailleTotaleOctets += statSync(i.source).size;
const tailleTotaleMio = (tailleTotaleOctets / 1024 / 1024).toFixed(2);

// ---------- Mode essai à blanc (par défaut) --------------------------------

if (!confirmer) {
  console.log(`\nMode ESSAI À BLANC — aucun téléversement (drapeau --confirmer absent).\n`);
  console.log(`Seau cible : ${NOM_SEAU}`);
  console.log(`Fichiers   : ${items.length}`);
  console.log(`Taille     : ${tailleTotaleMio} Mio\n`);
  console.log(`Plan de téléversement :\n`);
  // Groupé par catégorie pour être lisible malgré la longueur.
  const parCategorie = {};
  for (const i of items) {
    (parCategorie[i.doc.categorie] ||= []).push(i);
  }
  for (const cat of Object.keys(parCategorie)) {
    console.log(`  [${cat}] ${parCategorie[cat].length} fichier(s)`);
    for (const i of parCategorie[cat]) {
      const ko = (statSync(i.source).size / 1024).toFixed(0);
      console.log(`    ${i.doc.chemin}`);
      console.log(`      ← ${i.source}  (${ko} Ko)`);
    }
    console.log("");
  }
  console.log(`Pour procéder pour vrai :`);
  console.log(`  node scripts/televerser-documents.js --confirmer\n`);
  process.exit(0);
}

// ---------- Refus explicite sans clé de service ----------------------------

if (!existsSync(CHEMIN_CLE)) {
  console.error(`
❌ Clé de service introuvable : ${CHEMIN_CLE}

Ce script écrirait dans le Cloud Storage de PRODUCTION et il ne peut
pas s'y authentifier sans la clé de service.

Marche à suivre (identique à scripts/acces-test.js) :
  1. Console Firebase → Paramètres du projet → Comptes de service
  2. « Générer une nouvelle clé privée »
  3. Enregistrer sous : serviceAccountKey.json  (à la racine du dépôt)
  4. Vérifier que \`git status\` ne le voit pas (il est dans .gitignore).
`);
  process.exit(1);
}

// ---------- Confirmation PRODUCTION à taper à la main ----------------------

await confirmerProduction();

async function confirmerProduction() {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ATTENTION — CIBLE : PRODUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ce script va téléverser ${items.length} fichiers (${tailleTotaleMio} Mio) dans
le seau Cloud Storage de PRODUCTION :

  ${NOM_SEAU}

Les fichiers existants sous les mêmes noms seront ÉCRASÉS.

Pour continuer, tape PRODUCTION (en majuscules) puis Entrée.
Toute autre saisie annule l'opération.
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
}

// ---------- Initialisation Firebase Admin ----------------------------------
//
// On passe explicitement `storageBucket` : sans lui, `getStorage().bucket()`
// utiliserait le default bucket dérivé du projet, qui peut différer selon
// l'âge du projet (`.appspot.com` ancien vs `.firebasestorage.app` récent).
// En le fixant ici on aligne avec ce que le client attend en prod.

const cle = JSON.parse(readFileSync(CHEMIN_CLE, "utf-8"));
initializeApp({ credential: cert(cle), storageBucket: NOM_SEAU });
const seau = getStorage().bucket();

// ---------- Téléversement séquentiel ---------------------------------------
//
// Séquentiel plutôt que parallèle : 65 fichiers, un ordre prévisible dans
// les logs et un échec facile à localiser. La parallélisation ferait gagner
// quelques dizaines de secondes au mieux — pas de valeur à ce prix.

const debutTotal = Date.now();
const echecs = [];
let reussis = 0;
let octetsTeleverses = 0;

console.log(`\nTéléversement en cours…\n`);

for (const item of items) {
  const debutFichier = Date.now();
  const taille = statSync(item.source).size;
  process.stdout.write(`  ↑ ${item.doc.chemin} … `);
  try {
    await seau.upload(item.source, {
      destination: item.doc.chemin,
      // `resumable` par défaut si > 5 Mo — laissé à la valeur par défaut.
      metadata: {
        contentType: "application/pdf",
      },
    });
    octetsTeleverses += taille;
    reussis++;
    const dureeS = ((Date.now() - debutFichier) / 1000).toFixed(1);
    console.log(`ok (${(taille / 1024).toFixed(0)} Ko, ${dureeS} s)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`ÉCHEC — ${message}`);
    echecs.push({ doc: item.doc, source: item.source, message });
  }
}

// ---------- Rapport final --------------------------------------------------

const dureeTotaleS = ((Date.now() - debutTotal) / 1000).toFixed(1);
const octetsMio = (octetsTeleverses / 1024 / 1024).toFixed(2);

console.log(`\n━━━ Rapport ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Seau       : ${NOM_SEAU}`);
console.log(`Réussis    : ${reussis} / ${items.length}`);
console.log(`Taille     : ${octetsMio} Mio téléversés`);
console.log(`Durée      : ${dureeTotaleS} s`);

if (echecs.length > 0) {
  console.log(`\n❌ ${echecs.length} échec(s) :`);
  for (const e of echecs) {
    console.log(`  ${e.doc.chemin}`);
    console.log(`    source : ${e.source}`);
    console.log(`    erreur : ${e.message}`);
  }
  console.log(`\nRelance le script — l'écrasement est autorisé et les`);
  console.log(`fichiers déjà téléversés seront simplement remplacés.\n`);
  process.exit(1);
}

console.log(`\n✅ Tous les fichiers ont été téléversés.\n`);
process.exit(0);
