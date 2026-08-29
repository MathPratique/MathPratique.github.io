#!/usr/bin/env node
/**
 * Synchronise le contenu de la banque Calcul différentiel — un seul geste,
 * deux destinations, un hash qui garantit l'identité entre les deux.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POURQUOI DEUX DESTINATIONS ?
 *
 * Le site sert 65 exercices gratuits à tout visiteur (bundle Vite public,
 * indispensable pour le SEO — les démarches doivent être dans le HTML).
 * Il sert aussi les 240 payants aux détenteurs d'accès (Cloud Function
 * protégée par verifierAcces côté serveur).
 *
 * Les 65 gratuits existent donc à deux endroits :
 *   1. `src/data/calcul-differentiel/chXX.json` — bundle public
 *   2. dans le blob privé `functions/src/data/exercices-cd.json` — bundle
 *      Function (avec les 240 payants en plus)
 *
 * Divergence = incident. Ce script est l'UNIQUE chemin pour mettre les
 * deux à jour ; le contrôle de hash refuse d'écrire si les 65 diffèrent
 * entre les deux sources.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Usage :
 *   node scripts/sync-banque-cd.js
 *
 * Prérequis : la banque source doit être générée (sorties/web/ à jour).
 * Le script relance `generer-web.js` et `generer-figures-svg.js` en tête
 * de course pour garantir la fraîcheur.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE = resolve(__dirname, "..");
// Quatre niveaux, pas trois : le dépôt vit dans OneDrive\Documents\GitHub,
// alors que les projets de matériel sont dans Documents\ tout court. Remonter
// de trois aboutissait à OneDrive\Documents\Session Automne 2026, qui
// n'existe pas — le chemin par défaut ne servait donc jamais, et le script
// exigeait en pratique BANQUE_CD_PATH.
const BANQUE_PROJET =
  process.env.BANQUE_CD_PATH ||
  resolve(SITE, "..", "..", "..", "..", "Documents", "Session Automne 2026", "Calcul différentiel", "exercices-calcul-differentiel");

if (!existsSync(BANQUE_PROJET)) {
  console.error(
    `Banque introuvable à ${BANQUE_PROJET}\n` +
      `Pose la variable BANQUE_CD_PATH sur le chemin du projet exercices-calcul-differentiel.`,
  );
  process.exit(1);
}

const WEB = join(BANQUE_PROJET, "sorties", "web");
const BANQUE_DIR = join(BANQUE_PROJET, "banque");
const DEST_PUBLIC = join(SITE, "src", "data", "calcul-differentiel");
const DEST_PRIVE_DIR = join(SITE, "functions", "src", "data");
const DEST_PRIVE_JSON = join(DEST_PRIVE_DIR, "exercices-cd.json");
const DEST_PRIVE_HASH = join(DEST_PRIVE_DIR, "exercices-cd-version.ts");

// ─── Étape 1 : régénérer les sorties de la banque ──────────────────────────
console.log("1. Régénération des sorties depuis la banque…");
execSync("node scripts/generer-figures-svg.js", { cwd: BANQUE_PROJET, stdio: "inherit" });
execSync("node scripts/generer-web.js", { cwd: BANQUE_PROJET, stdio: "inherit" });

// ─── Étape 2 : copie du contenu public vers le bundle site ─────────────────
console.log("\n2. Copie du contenu public vers le bundle site…");
["ch01.json", "ch02.json", "ch03.json", "ch04.json", "ch05.json", "ch06.json", "ch07.json"].forEach(
  (nom) => {
    copyFileSync(join(WEB, "chapitres", nom), join(DEST_PUBLIC, nom));
    console.log(`   ${nom}`);
  },
);
copyFileSync(join(WEB, "index.json"), join(DEST_PUBLIC, "catalogue.json"));
console.log("   catalogue.json");

const figuresSrc = join(WEB, "figures");
const figuresDst = join(DEST_PUBLIC, "figures");
mkdirSync(figuresDst, { recursive: true });
readdirSync(figuresSrc).forEach((f) => {
  copyFileSync(join(figuresSrc, f), join(figuresDst, f));
  console.log(`   figures/${f}`);
});

// ─── Étape 3 : construire le blob privé (305 avec contenu) ─────────────────
// On reprend la logique de generer-web.js/etapes() pour que la forme des
// exercices vus par la Function soit IDENTIQUE à celle vue dans les chXX.json
// gratuits — le client consomme les deux sources avec le même code.
console.log("\n3. Construction du blob privé (305 exos avec contenu)…");

const CHAMPS_FICHE = ["id", "chapitre", "section", "type", "difficulte", "tempsEstime", "acces"];
const CHAMPS_EN_PLUS = ["sectionNotes", "motsCles", "savoirFaire"];

// Ensemble des ids de gratuits dont le SVG est pré-rendu et publié.
// Utilisé pour décider comment porter la figure dans le blob : chemin SVG
// pour les gratuits (identique au bundle public), figureTikz brut pour les
// payants (le SVG n'existe pas côté public).
const figuresGratuitesRendues = existsSync(figuresSrc)
  ? new Set(readdirSync(figuresSrc).filter((f) => f.endsWith(".svg")).map((f) => f.replace(/\.svg$/, "")))
  : new Set();

/** Traduit un exercice de la banque en la forme consommée par le client. */
function transformerExercice(ex) {
  const out = {};
  CHAMPS_FICHE.forEach((c) => { if (ex[c] !== undefined) out[c] = ex[c]; });
  CHAMPS_EN_PLUS.forEach((c) => { if (ex[c] !== undefined) out[c] = ex[c]; });

  const enonce = { etape: "enonce", titre: "Énoncé", texte: ex.enonce };
  if (ex.figureTikz) {
    if (ex.acces === "gratuit" && figuresGratuitesRendues.has(ex.id)) {
      // Même forme que generer-web.js/etapes() : chemin vers le SVG public.
      // Nécessaire pour que la comparaison de hash gratuit avec le bundle
      // public tombe juste.
      enonce.figure = `figures/${ex.id}.svg`;
    } else {
      // Payant avec figure : on porte le source TikZ brut. Client affiche
      // un placeholder « voir le PDF » plutôt que de tenter un rendu.
      // À revoir : pré-rendre les SVG des payants dans un dir privé du
      // bundle Function.
      enonce.figureTikzBrut = ex.figureTikz;
    }
  }
  if (ex.type === "qcm" && ex.choix) {
    enonce.choix = ex.choix.map((c) => ({ cle: c.cle, texte: c.texte }));
  }
  if (ex.type === "vrai-faux") {
    enonce.choix = [{ cle: "v", texte: "Vrai" }, { cle: "f", texte: "Faux" }];
  }

  const demarche = { etape: "demarche", titre: "Démarche détaillée", lignes: ex.demarche };
  if (ex.type === "qcm" && ex.choix) {
    demarche.analyseChoix = ex.choix.map((c) => ({
      cle: c.cle, correct: c.correct, explication: c.explication,
    }));
  }
  if (ex.piegeCourant) demarche.piegeCourant = ex.piegeCourant;

  out.etapes = [
    enonce,
    { etape: "indice", titre: "Indice", texte: ex.indice },
    { etape: "reponse", titre: "Réponse finale", texte: ex.reponseFinale },
    demarche,
  ];
  return out;
}

const tousExos = [];
readdirSync(BANQUE_DIR)
  .filter((f) => /^ch\d\d.*\.json$/.test(f))
  .sort()
  .forEach((f) => {
    const data = JSON.parse(readFileSync(join(BANQUE_DIR, f), "utf8"));
    data.exercices.forEach((e) => tousExos.push(transformerExercice(e)));
  });

// Hash SHA-256 du blob canonique (JSON.stringify sans indentation).
function hashCanonique(exercices) {
  const canonique = JSON.stringify(exercices);
  return createHash("sha256").update(canonique).digest("hex").slice(0, 16);
}

const contentHash = hashCanonique(tousExos);
console.log(`   ${tousExos.length} exercices — hash ${contentHash}`);

// ─── Étape 4 : contrôle mécanisme 2 — les 65 gratuits sont-ils identiques ? ─
console.log("\n4. Contrôle : les 65 gratuits sont-ils identiques dans les deux sources ?");

const gratuitsPublicParId = new Map();
["ch01.json", "ch02.json", "ch03.json", "ch04.json", "ch05.json", "ch06.json", "ch07.json"].forEach(
  (nom) => {
    const data = JSON.parse(readFileSync(join(DEST_PUBLIC, nom), "utf8"));
    data.exercices.forEach((e) => gratuitsPublicParId.set(e.id, e));
  },
);

const divergences = [];
tousExos
  .filter((e) => e.acces === "gratuit")
  .forEach((exPrive) => {
    const exPublic = gratuitsPublicParId.get(exPrive.id);
    if (!exPublic) {
      divergences.push(`${exPrive.id} : présent dans blob privé, absent du bundle public`);
      return;
    }
    // Comparaison canonique : identiques SI leurs sérialisations sans indent
    // sont égales. Ordre des clés préservé par JSON.stringify sur objet
    // construit dans le même code — les deux passent par transformerExercice.
    if (JSON.stringify(exPrive) !== JSON.stringify(exPublic)) {
      divergences.push(
        `${exPrive.id} : contenu différent entre blob privé et bundle public`,
      );
    }
  });

if (divergences.length) {
  console.error("\n   ✗ Divergences détectées :");
  divergences.forEach((d) => console.error(`     - ${d}`));
  console.error(
    "\n   Refuse d'écrire le blob privé — corriger la banque source puis relancer.",
  );
  process.exit(1);
}
console.log(`   ✓ Les 65 gratuits sont identiques entre les deux sources.`);

// ─── Étape 5 : écriture du blob privé + constante de version ───────────────
console.log("\n5. Écriture du blob privé et de la constante de version…");
mkdirSync(DEST_PRIVE_DIR, { recursive: true });
writeFileSync(
  DEST_PRIVE_JSON,
  JSON.stringify({ cours: "calcul-differentiel", contentHash, exercices: tousExos }, null, 2) + "\n",
  "utf8",
);
console.log(`   ${relative(SITE, DEST_PRIVE_JSON)}  (${tousExos.length} exos, hash ${contentHash})`);

const versionTs =
  `// Généré par scripts/sync-banque-cd.js — NE PAS ÉDITER À LA MAIN.\n` +
  `// Ce hash est le contrat entre le bundle client et le blob Function.\n` +
  `// Il est vérifié au build par scripts/verifier-synchro-banque.js.\n` +
  `export const CONTENT_HASH_CD = "${contentHash}";\n`;
writeFileSync(DEST_PRIVE_HASH, versionTs, "utf8");
console.log(`   ${relative(SITE, DEST_PRIVE_HASH)}`);

// Même constante côté bundle client (miroir pour le contrôle post-build).
const versionClientTs =
  `// Généré par scripts/sync-banque-cd.js — NE PAS ÉDITER À LA MAIN.\n` +
  `export const CONTENT_HASH_CD = "${contentHash}";\n`;
writeFileSync(join(DEST_PUBLIC, "version.ts"), versionClientTs, "utf8");
console.log(`   src/data/calcul-differentiel/version.ts`);

console.log("\n✓ Synchronisation terminée.");
