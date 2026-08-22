# Dette technique

Notes des problèmes connus à corriger, dans l'ordre où on les rencontre.
Chaque entrée : date de découverte, problème, contexte reproductible, effet,
et le contournement utilisé en attendant.

---

## 2026-08-22 — `scripts/televerser-documents.js` inutilisable pour une mise à jour ciblée

**Contexte.** Mise à jour intra-session : seuls quelques PDF ont changé
(exemple ce jour, 5 sur 65 après le refactoring LaTeX du chapitre 1 et la
renumérotation des sections dans la banque JSON). L'outil officiel refuse
de partir ou irait téléverser la mauvaise version.

**Trois défauts distincts :**

1. **Pas de filtre.** Le script téléverse la totalité des documents du
   catalogue (`DOCUMENTS` dans `src/acces/documents.ts`), sans option
   `--ids` ni équivalent. Impossible de cibler un sous-ensemble.

2. **Mauvaise source pour les corrigés (et énoncés/indices).** Le mapping
   `SOURCE_PAR_CATEGORIE.exercices = RACINE_NOTES_EXOS` fait chercher les
   cahiers `chNN-1-exercices`, `chNN-2-indices`, `chNN-3-corrige` dans
   `notes+exercices-calcul-differentiel/` — le dossier racine alimenté à
   la main. Or ces cahiers sont produits par `exercices-calcul-differentiel/`
   et vivent dans `sorties/build/`. Un cahier recompilé mais non recopié
   à la racine serait téléversé dans son ancienne version, silencieusement.

3. **`existsSync` bloquant en global.** Le pré-flight vérifie l'existence
   des ~65 sources et arrête tout à la première absente (« aucun
   téléversement partiel »). Un seul fichier oublié à la racine (par
   exemple `ch01-1-exercices.pdf` qui manquait le 2026-08-22) empêche
   même les uploads corrects du reste.

**Contournement du 2026-08-22.** Script ad-hoc
`scratchpad/televerser-5.js` (hors dépôt) — 5 mappings en dur avec source
explicite par entrée, content-type `application/pdf`, aucun autre objet
du seau touché. Les 5 PDF périmés du ch1 ont été téléversés à 15:19 Mtl.

**Correctif attendu (septembre 2026).**
- Ajouter un flag `--ids <id1>,<id2>,…` (les ids du catalogue) pour
  cibler un sous-ensemble.
- Rendre le mapping source paramétrable par document, ou introduire une
  catégorie `corrige` distincte pointant vers `sorties/build/` — ne pas
  laisser une catégorie unique pour trois producteurs différents.
- Rendre le pré-flight `existsSync` non bloquant quand `--ids` est
  présent : ne vérifier que les sources demandées, pas les 65.
