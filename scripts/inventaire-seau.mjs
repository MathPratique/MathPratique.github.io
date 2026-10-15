// ===========================================================================
//  Inventaire du seau — LECTURE SEULE
// ===========================================================================
//
// Avant de passer le projet Google Cloud au compte complet, on veut savoir
// ce que le seau contient et si chaque objet existe aussi sur ce poste.
// Un seau sans copie locale est un point de defaillance unique.
//
// Ce script NE MODIFIE RIEN : il liste, lit des metadonnees, et compare des
// MD5. Aucune ecriture, aucune suppression, aucun telechargement.
//
// Usage :  node scripts/inventaire-seau.mjs
// ===========================================================================

import { readFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHEMIN_CLE = resolve(RACINE, "serviceAccountKey.json");
const NOM_SEAU = "mathpratique-8dea1.firebasestorage.app";

// Les arbres sources, PAR COURS. Le decoupage est indispensable : des noms
// comme « ch02-1-exercices.pdf » existent dans plusieurs cours, et chercher
// par nom de fichier seul comparerait l'objet d'un cours au PDF d'un autre.
const SOURCES_PAR_COURS = {
  "calcul-differentiel": [
    "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/notes+exercices-calcul-differentiel/build",
    "C:/Users/simon/Documents/Session Automne 2026/Calcul différentiel/exercices-calcul-differentiel/sorties/build",
  ],
  // Les deux autres cours ne sont pas sur ce poste : aucun arbre declare,
  // donc aucun objet ne sera dit « present localement » a tort.
  "probabilites-statistique": [],
  "calcul-integral": [],
};

if (!existsSync(CHEMIN_CLE)) {
  console.error(`Cle de service introuvable : ${CHEMIN_CLE}`);
  process.exit(1);
}

initializeApp({
  credential: cert(JSON.parse(readFileSync(CHEMIN_CLE, "utf8"))),
  storageBucket: NOM_SEAU,
});

const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("base64");
const ko = (n) => `${Math.round(n / 1024)} Ko`;

function chercherLocal(cours, nom) {
  for (const racine of (SOURCES_PAR_COURS[cours] ?? [])) {
    const p = resolve(racine, nom);
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

const [objets] = await getStorage().bucket(NOM_SEAU).getFiles();

// Regroupe par prefixe de premier niveau : un « dossier » = un cours.
const parCours = new Map();
for (const o of objets) {
  const cours = o.name.includes("/") ? o.name.split("/")[0] : "(racine)";
  if (!parCours.has(cours)) parCours.set(cours, []);
  parCours.get(cours).push(o);
}

console.log("INVENTAIRE DU SEAU — lecture seule");
console.log("=".repeat(86));
console.log(`  ${objets.length} objets au total\n`);

let totalLocal = 0;
let totalAbsent = 0;
let totalDivergent = 0;
let octets = 0;

for (const [cours, liste] of [...parCours].sort()) {
  const tailleCours = liste.reduce((s, o) => s + Number(o.metadata.size || 0), 0);
  octets += tailleCours;
  console.log(`  ${cours}  —  ${liste.length} objets, ${ko(tailleCours)}`);
  console.log("  " + "-".repeat(82));

  let ok = 0;
  const absents = [];
  const divergents = [];

  for (const o of liste) {
    const nom = basename(o.name);
    const local = chercherLocal(cours, nom);
    if (!local) {
      absents.push(nom);
      continue;
    }
    if (md5(local) === o.metadata.md5Hash) ok++;
    else divergents.push(nom);
  }

  totalLocal += ok;
  totalAbsent += absents.length;
  totalDivergent += divergents.length;

  const connu = (SOURCES_PAR_COURS[cours] ?? []).length > 0;
  if (!connu) {
    console.log(`    AUCUN arbre source declare pour ce cours sur ce poste.`);
    console.log(`    Les ${liste.length} objets n'ont donc PAS de copie locale verifiee.`);
  } else {
    console.log(`    copie locale au MD5 identique : ${ok} / ${liste.length}`);
  }
  if (divergents.length) {
    console.log(`    MD5 divergent : ${divergents.length}`);
    divergents.forEach((n) => console.log(`        ${n}`));
  }
  if (absents.length) {
    console.log(`    SANS COPIE LOCALE : ${absents.length}`);
    absents.forEach((n) => console.log(`        ${n}`));
  }
  console.log();
}

console.log("=".repeat(86));
console.log(`  objets            : ${objets.length}`);
console.log(`  volume            : ${ko(octets)}`);
console.log(`  copie locale OK   : ${totalLocal}`);
console.log(`  MD5 divergent     : ${totalDivergent}`);
console.log(`  sans copie locale : ${totalAbsent}`);
