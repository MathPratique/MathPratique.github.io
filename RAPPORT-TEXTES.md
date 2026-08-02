# Rapport de contrôle des textes

Produit par `scripts/verifier-textes.sh`. Ce document est **écrasé** à
chaque exécution : ne l'annote pas, il ne survivra pas au prochain passage.

| Recherche | Occurrences | Bloquant |
|---|---|---|
| Vouvoiement — `vous` / `votre` / `vos` | 0 | non |
| Vouvoiement — verbes en `-ez` | 0 | non |
| Mentions d'accès à vie | 0 | **oui** |
| Adresses courriel hors du domaine | 0 | **oui** |

Les deux premières recherches demandent un jugement humain : un « vous »
dans une citation reste légitime, et tous les mots en `-ez` ne sont pas
des verbes. Les deux dernières ne tolèrent aucune occurrence.

Sont épargnés : `src/pages/Enseignants.tsx`, qui vouvoie délibérément, et
les lignes portant le marqueur `vouvoiement-assume`, qui s'adressent à un
enseignant depuis une page étudiante.

---

## Vouvoiement — pronoms et déterminants

Aucune occurrence hors des passages destinés aux enseignants.

## Vouvoiement — verbes en `-ez`

Aucun verbe conjugué à la deuxième personne du pluriel.

## Mentions d'accès à vie

Aucune. Le modèle à 12 mois est décrit partout de la même façon.

## Adresses courriel hors du domaine

Aucune. Toutes les adresses affichées sont au nom du site.

