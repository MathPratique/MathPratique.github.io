import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import {
  CLES_CATALOGUE,
  CLES_INTERDITES_CATALOGUE,
  clesRefuseesCatalogue,
} from "../.tmp-test/data/banque-types.js";

// ---------------------------------------------------------------------------
//  Le catalogue public d'une banque ne porte que les clés du schéma.
// ---------------------------------------------------------------------------
//
// catalogue.json part dans le bundle servi à chaque visiteur. Un champ
// « code » y a déjà fait fuir un sigle de cours en ligne. Ces tests gardent
// la porte : la liste blanche, et en particulier les trois clés que les
// fichiers de structure des projets jumeaux contiennent réellement.

const minimal = { cours: "Cours", droits: "© 2026 MathPratique.ca.", totaux: {}, exercices: [] };

test("les trois clés des fichiers de structure sont refusées, chacune nommée", () => {
  for (const cle of ["code", "etablissement", "auteur"]) {
    const refus = clesRefuseesCatalogue({ ...minimal, [cle]: "valeur" });
    assert.equal(refus.length, 1, `« ${cle} » devrait être refusée`);
    assert.equal(refus[0].cle, cle);
    assert.equal(refus[0].raison, CLES_INTERDITES_CATALOGUE[cle]);
  }
});

test("un fichier de structure complet est refusé en entier sauf « cours »", () => {
  // Reproduit les clés de premier niveau du structure.json réel d'un projet
  // jumeau — la source la plus probable d'une future fuite.
  const structure = {
    cours: "Cours",
    code: "sigle",
    etablissement: "établissement",
    auteur: "personne",
    session: "Automne 2026",
    genereLe: "2026-07-24",
    chapitres: [],
    repartitionParChapitre: {},
    totalGlobal: 0,
  };
  const refusees = clesRefuseesCatalogue(structure).map((r) => r.cle).sort();
  assert.deepEqual(
    refusees,
    ["auteur", "chapitres", "code", "etablissement", "genereLe",
     "repartitionParChapitre", "session", "totalGlobal"],
  );
});

test("une clé inconnue est refusée même si elle n'est pas dans la liste noire", () => {
  const refus = clesRefuseesCatalogue({ ...minimal, sigle: "x" });
  assert.equal(refus.length, 1);
  assert.equal(refus[0].raison, "clé absente du schéma");
});

test("les clés interdites ne figurent pas dans la liste blanche", () => {
  for (const cle of Object.keys(CLES_INTERDITES_CATALOGUE)) {
    assert.ok(!CLES_CATALOGUE.includes(cle), `« ${cle} » ne doit jamais être permise`);
  }
});

test("chaque catalogue.json publié respecte le schéma", () => {
  // Parcourt tous les cours du site : un cours ajouté est couvert d'office.
  const racine = "src/data";
  const cours = readdirSync(racine, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(`${racine}/${d.name}/catalogue.json`))
    .map((d) => d.name);
  assert.ok(cours.length >= 2, "au moins deux catalogues attendus");
  for (const c of cours) {
    const catalogue = JSON.parse(readFileSync(`${racine}/${c}/catalogue.json`, "utf8"));
    assert.deepEqual(clesRefuseesCatalogue(catalogue), [], `${c}/catalogue.json porte une clé hors schéma`);
  }
});
