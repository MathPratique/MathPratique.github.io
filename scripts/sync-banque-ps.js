#!/usr/bin/env node
/**
 * Synchronise le contenu de la banque Probabilités et statistique — un seul
 * geste, deux destinations, un hash qui garantit l'identité entre les deux.
 *
 * Jumeau de sync-banque-cd.js. Même structure, mêmes garanties.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POURQUOI DEUX DESTINATIONS ?
 *
 * Le site sert les exercices gratuits à tout visiteur (bundle Vite public,
 * indispensable pour le SEO). Il sert la banque complète aux détenteurs
 * d'accès (Cloud Function protégée par verifierAcces côté serveur).
 *
 * Les gratuits existent donc à deux endroits :
 *   1. `src/data/probabilites-statistique/chXX.json` — bundle public
 *   2. dans le blob privé `functions/src/data/exercices-ps.json` — bundle
 *      Function (avec les réservés en plus)
 *
 * Divergence = incident. Ce script est l'UNIQUE chemin pour mettre les deux
 * à jour ; le contrôle de hash refuse d'écrire si les gratuits diffèrent
 * entre les deux sources.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ─── ÉTAT AU 2026-08-29 ───────────────────────────────────────────────────
 *
 * Zéro exercice gratuit : la sélection éditoriale n'a pas eu lieu, et tout
 * est réservé en attendant. Le bundle public ne contient donc que des
 * fichiers de chapitre vides, et le catalogue 451 fiches verrouillées.
 *
 * Le contrôle des gratuits porte sur un ensemble vide — il est trivialement
 * satisfait aujourd'hui, et deviendra utile le jour de la sélection. Il
 * reste en place pour cette raison : un contrôle qu'on retire « parce qu'il
 * ne sert à rien pour l'instant » n'est jamais remis.
 *
 * Usage :
 *   node scripts/sync-banque-ps.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE = resolve(__dirname, "..");

// Quatre niveaux, pas trois : le dépôt vit dans OneDrive\Documents\GitHub,
// alors que les projets de matériel sont dans Documents\ tout court. Remonter
// de trois aboutit à OneDrive\Documents, qui ne contient pas la banque.
// (sync-banque-cd.js remonte de trois et ne marche donc qu'avec sa variable
// d'environnement posée — voir DETTE-TECHNIQUE.md.)
const BANQUE_PROJET =
  process.env.BANQUE_PS_PATH ||
  resolve(
    SITE,
    "..",
    "..",
    "..",
    "..",
    "Documents",
    "Session Automne 2026",
    "Probabilité et statistiques",
    "exercices-prob-stat",
  );

if (!existsSync(BANQUE_PROJET)) {
  console.error(
    `Banque introuvable à ${BANQUE_PROJET}\n` +
      `Pose la variable BANQUE_PS_PATH sur le chemin du projet exercices-prob-stat.`,
  );
  process.exit(1);
}

const WEB = join(BANQUE_PROJET, "sorties", "web");
const BANQUE = join(BANQUE_PROJET, "banque");
const DEST_PUBLIC = join(SITE, "src", "data", "probabilites-statistique");
const DEST_PRIVE_DIR = join(SITE, "functions", "src", "data");
const DEST_PRIVE_JSON = join(DEST_PRIVE_DIR, "exercices-ps.json");
const DEST_PRIVE_HASH = join(DEST_PRIVE_DIR, "exercices-ps-version.ts");

// ─── Étape 1 : régénérer l'export web ──────────────────────────────────────
console.log("1. Régénération de l'export web…");
execSync("node scripts/generer-web.js", { cwd: BANQUE_PROJET, stdio: "inherit" });

// ─── Étape 2 : copier le bundle public ─────────────────────────────────────
console.log("\n2. Copie du bundle public…");
mkdirSync(DEST_PUBLIC, { recursive: true });

const chapitres = readdirSync(join(WEB, "chapitres"))
  .filter((f) => /^ch\d\d\.json$/.test(f))
  .sort();

let totalPublies = 0;
for (const nom of chapitres) {
  const data = JSON.parse(readFileSync(join(WEB, "chapitres", nom), "utf8"));
  totalPublies += data.exercices.length;
  writeFileSync(join(DEST_PUBLIC, nom), JSON.stringify(data, null, 2) + "\n", "utf8");
}

const index = JSON.parse(readFileSync(join(WEB, "index.json"), "utf8"));
writeFileSync(join(DEST_PUBLIC, "catalogue.json"), JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(
  `   ${chapitres.length} chapitres (${totalPublies} exercices publiés) + catalogue.json (${index.exercices.length} fiches)`,
);

// ─── Étape 3 : construire le blob privé ────────────────────────────────────
//
// Liste blanche, comme partout : on part d'un objet vide et on copie les
// champs autorisés. Le blob contient TOUT — gratuits et réservés — puisqu'il
// ne quitte le serveur qu'après vérification de l'accès.

const CHAMPS_FICHE = ["id", "chapitre", "section", "type", "difficulte", "tempsEstime", "acces"];
const CHAMPS_EN_PLUS = ["sectionNotes", "motsCles", "savoirFaire"];

function transformerExercice(ex) {
  const out = {};
  CHAMPS_FICHE.forEach((c) => {
    if (ex[c] !== undefined) out[c] = ex[c];
  });
  CHAMPS_EN_PLUS.forEach((c) => {
    if (ex[c] !== undefined) out[c] = ex[c];
  });

  const enonce = { etape: "enonce", titre: "Énoncé", texte: ex.enonce };
  if (ex.type === "qcm" && ex.choix) {
    enonce.choix = ex.choix.map((c) => ({ cle: c.cle, texte: c.texte }));
  }
  if (ex.type === "vrai-faux") {
    enonce.choix = [
      { cle: "v", texte: "Vrai" },
      { cle: "f", texte: "Faux" },
    ];
  }

  const demarche = { etape: "demarche", titre: "Démarche détaillée", lignes: ex.demarche };
  if (ex.type === "qcm" && ex.choix) {
    demarche.analyseChoix = ex.choix.map((c) => ({
      cle: c.cle,
      correct: c.correct,
      explication: c.explication,
    }));
  }
  if (ex.piegeCourant) demarche.piegeCourant = ex.piegeCourant;

  // L'étape « indice » n'est émise que si elle a du contenu : 97 des 160
  // exercices du chapitre 2 n'en ont pas, et aucun des autres chapitres.
  // Même règle que generer-web.js — les deux sorties doivent avoir la même
  // forme, sinon le contrôle de hash des gratuits ne tomberait jamais juste.
  const etapes = [enonce];
  if (ex.indice) etapes.push({ etape: "indice", titre: "Indice", texte: ex.indice });
  etapes.push({ etape: "reponse", titre: "Réponse finale", texte: ex.reponseFinale });
  etapes.push(demarche);

  out.etapes = etapes;
  return out;
}

console.log("\n3. Construction du blob privé…");
const ACCES_DEFAUT = "payant"; // même défaut que generer-web.js
const tousExos = [];
readdirSync(BANQUE)
  .filter((f) => /^ch\d\d.*\.json$/.test(f))
  .sort()
  .forEach((f) => {
    const data = JSON.parse(readFileSync(join(BANQUE, f), "utf8"));
    data.exercices.forEach((e) =>
      tousExos.push(transformerExercice({ ...e, acces: e.acces ?? ACCES_DEFAUT })),
    );
  });

/** Hash SHA-256 du blob canonique (JSON.stringify sans indentation). */
function hashCanonique(exercices) {
  return createHash("sha256").update(JSON.stringify(exercices)).digest("hex").slice(0, 16);
}

const contentHash = hashCanonique(tousExos);
console.log(`   ${tousExos.length} exercices — hash ${contentHash}`);

// ─── Étape 4 : les gratuits sont-ils identiques dans les deux sources ? ────
console.log("\n4. Contrôle : les gratuits sont-ils identiques dans les deux sources ?");

const gratuitsPublicParId = new Map();
for (const nom of chapitres) {
  const data = JSON.parse(readFileSync(join(DEST_PUBLIC, nom), "utf8"));
  data.exercices.forEach((e) => gratuitsPublicParId.set(e.id, e));
}

const divergences = [];
tousExos
  .filter((e) => e.acces === "gratuit")
  .forEach((prive) => {
    const publie = gratuitsPublicParId.get(prive.id);
    if (!publie) {
      divergences.push(`${prive.id} est gratuit dans le blob mais absent du bundle public`);
      return;
    }
    // On compare les étapes, qui portent le contenu réellement servi.
    if (JSON.stringify(prive.etapes) !== JSON.stringify(publie.etapes)) {
      divergences.push(`${prive.id} : les étapes diffèrent entre le blob et le bundle public`);
    }
  });

for (const id of gratuitsPublicParId.keys()) {
  if (!tousExos.some((e) => e.id === id && e.acces === "gratuit")) {
    divergences.push(`${id} est publié en clair mais n'est pas gratuit dans la banque`);
  }
}

if (divergences.length) {
  console.error(`\n❌ ${divergences.length} divergence(s) — rien n'est écrit :\n`);
  divergences.slice(0, 20).forEach((d) => console.error(`   ${d}`));
  process.exit(1);
}
console.log(`   ${gratuitsPublicParId.size} gratuit(s) — aucune divergence.`);

// ─── Étape 5 : écriture du blob privé + constantes de version ──────────────
console.log("\n5. Écriture du blob privé et des constantes de version…");
mkdirSync(DEST_PRIVE_DIR, { recursive: true });
writeFileSync(
  DEST_PRIVE_JSON,
  JSON.stringify({ cours: "probabilites-statistique", contentHash, exercices: tousExos }, null, 2) +
    "\n",
  "utf8",
);
console.log(`   ${relative(SITE, DEST_PRIVE_JSON)}  (${tousExos.length} exos, hash ${contentHash})`);

const versionTs =
  `// Généré par scripts/sync-banque-ps.js — NE PAS ÉDITER À LA MAIN.\n` +
  `// Ce hash est le contrat entre le bundle client et le blob Function.\n` +
  `export const CONTENT_HASH_PS = "${contentHash}";\n`;
writeFileSync(DEST_PRIVE_HASH, versionTs, "utf8");
console.log(`   ${relative(SITE, DEST_PRIVE_HASH)}`);

const versionClientTs =
  `// Généré par scripts/sync-banque-ps.js — NE PAS ÉDITER À LA MAIN.\n` +
  `export const CONTENT_HASH_PS = "${contentHash}";\n`;
writeFileSync(join(DEST_PUBLIC, "version.ts"), versionClientTs, "utf8");
console.log(`   src/data/probabilites-statistique/version.ts`);

console.log("\n✓ Synchronisation terminée.");
