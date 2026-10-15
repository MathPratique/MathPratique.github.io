#!/usr/bin/env node
/**
 * Dérive la STRUCTURE du catalogue de notions depuis les banques.
 *
 * Une « notion » est une section de la banque : « 3.3 — Théorème central
 * limite ». Ce découpage existe déjà dans les exercices (champs `section` et
 * `sectionNotes`) ; ce script ne fait que le relever, il n'invente rien.
 *
 * Ce qu'il écrit :
 *   functions/src/notes/notions-<cours>.generated.ts
 *       id, chapitre, section, titre — et rien d'autre. Aucun énoncé, aucune
 *       solution : le catalogue vit dans le code de la Cloud Function et doit
 *       pouvoir y vivre sans risque.
 *
 * Ce qu'il n'écrit PAS : les mots-clés. Ils sont rédigés à la main dans
 * motsCles-<cours>.ts, relus par l'enseignant, et ne doivent jamais être
 * écrasés par une régénération. index.ts marie les deux et refuse de démarrer
 * si l'appariement est incomplet.
 *
 * Usage :
 *   node scripts/generer-catalogue-notions.mjs            # écrit
 *   node scripts/generer-catalogue-notions.mjs --verifier # compare seulement
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SORTIE = resolve(SITE, "functions/src/notes");
const verifierSeulement = process.argv.includes("--verifier");

const COURS = [
  {
    id: "calcul-differentiel",
    prefixe: "CD",
    blob: "functions/src/data/exercices-cd.json",
    fichier: "notions-calcul-differentiel.generated.ts",
    constante: "NOTIONS_CALCUL_DIFFERENTIEL",
  },
  {
    id: "probabilites-statistique",
    prefixe: "PS",
    blob: "functions/src/data/exercices-ps.json",
    fichier: "notions-probabilites-statistique.generated.ts",
    constante: "NOTIONS_PROBABILITES_STATISTIQUE",
  },
];

/**
 * Libellés canoniques — une entrée par section dont les exercices ne
 * s'accordent pas sur un seul `sectionNotes`.
 *
 * CD-2.7 porte dix variantes de « Formes indéterminées — <technique> ». La
 * technique est un choix de résolution, pas une notion distincte : dans ses
 * notes, l'étudiant a un seul titre et une liste de cas. Les techniques
 * descendent donc dans les mots-clés, où elles servent à la détection.
 *
 * Toute section à libellés multiples SANS entrée ici fait échouer le script.
 * Choisir au hasard le libellé le plus fréquent donnerait un catalogue
 * plausible et faux, qui se corrigerait tout seul au prochain exercice ajouté.
 */
const LIBELLES_CANONIQUES = {
  "CD-2.7": "Formes indéterminées",
};

function notionsDuCours(cours) {
  const ex = JSON.parse(readFileSync(resolve(SITE, cours.blob), "utf8")).exercices;
  const parSection = new Map();
  for (const e of ex) {
    if (typeof e.section !== "string" || e.section.length === 0) {
      throw new Error(`${cours.id} : l'exercice ${e.id} n'a pas de section.`);
    }
    const cle = `${cours.prefixe}-${e.section}`;
    if (!parSection.has(cle)) {
      parSection.set(cle, { id: cle, chapitre: e.chapitre, section: e.section, libelles: new Map() });
    }
    const s = parSection.get(cle);
    if (s.chapitre !== e.chapitre) {
      throw new Error(`${cle} : section partagée entre les chapitres ${s.chapitre} et ${e.chapitre}.`);
    }
    const lib = e.sectionNotes;
    if (typeof lib !== "string" || lib.length === 0) {
      throw new Error(`${cours.id} : l'exercice ${e.id} n'a pas de sectionNotes.`);
    }
    s.libelles.set(lib, (s.libelles.get(lib) ?? 0) + 1);
  }

  const notions = [];
  const aArbitrer = [];
  for (const s of parSection.values()) {
    let titre;
    if (s.libelles.size === 1) {
      titre = [...s.libelles.keys()][0];
    } else if (LIBELLES_CANONIQUES[s.id]) {
      titre = LIBELLES_CANONIQUES[s.id];
    } else {
      aArbitrer.push(`${s.id} → ${[...s.libelles.keys()].join(" / ")}`);
      continue;
    }
    notions.push({ id: s.id, chapitre: s.chapitre, section: s.section, titre });
  }
  if (aArbitrer.length) {
    throw new Error(
      `${cours.id} : ${aArbitrer.length} section(s) à libellés multiples sans libellé canonique.\n` +
        aArbitrer.map((l) => `    ${l}`).join("\n") +
        `\n  Ajoute-les à LIBELLES_CANONIQUES après arbitrage de l'enseignant.`,
    );
  }
  // Ordre de lecture : chapitre, puis numéro de section.
  notions.sort(
    (a, b) =>
      a.chapitre - b.chapitre ||
      parseFloat(a.section) - parseFloat(b.section) ||
      a.section.localeCompare(b.section, "fr"),
  );
  return notions;
}

function rendre(cours, notions) {
  const lignes = notions.map(
    (n) =>
      `  { id: ${JSON.stringify(n.id)}, chapitre: ${n.chapitre}, ` +
      `section: ${JSON.stringify(n.section)}, titre: ${JSON.stringify(n.titre)} },`,
  );
  return (
    `// Généré par scripts/generer-catalogue-notions.mjs — NE PAS ÉDITER À LA MAIN.\n` +
    `//\n` +
    `// Les ${notions.length} sections de la banque « ${cours.id} ». Les mots-clés qui servent\n` +
    `// à la détection sont ailleurs : voir motsCles-${cours.id}.ts.\n` +
    `\n` +
    `import type { Notion } from "./types.js";\n` +
    `\n` +
    `export const ${cours.constante}: Notion[] = [\n` +
    lignes.join("\n") +
    `\n];\n`
  );
}

if (!existsSync(SORTIE)) mkdirSync(SORTIE, { recursive: true });

let ecarts = 0;
for (const cours of COURS) {
  const notions = notionsDuCours(cours);
  const contenu = rendre(cours, notions);
  const chemin = resolve(SORTIE, cours.fichier);
  const avant = existsSync(chemin) ? readFileSync(chemin, "utf8") : null;
  const identique = avant === contenu;

  if (verifierSeulement) {
    console.log(`  ${cours.id.padEnd(26)} ${notions.length} notions   ${identique ? "à jour" : "DIFFÉRENT du fichier sur disque"}`);
    if (!identique) ecarts++;
  } else {
    writeFileSync(chemin, contenu, "utf8");
    console.log(`  ${cours.id.padEnd(26)} ${notions.length} notions → ${cours.fichier}${identique ? " (inchangé)" : ""}`);
  }
  const parCh = new Map();
  for (const n of notions) parCh.set(n.chapitre, (parCh.get(n.chapitre) ?? 0) + 1);
  console.log(
    `      ${[...parCh.entries()].sort((a, b) => a[0] - b[0]).map(([c, k]) => `ch${c} : ${k}`).join("   ")}`,
  );
}

if (verifierSeulement && ecarts) {
  console.error(`\n❌ ${ecarts} fichier(s) à régénérer : node scripts/generer-catalogue-notions.mjs\n`);
  process.exit(1);
}
