# Données bundlées avec les Cloud Functions

## `exercices-cd.json` — banque Calcul différentiel complète (305 exos)

**⚠️ A1 provisoire.** Banque bundlée dans les Cloud Functions (option A1).
À migrer vers un document Firestore (A2) avant novembre 2026 : toute
correction de contenu exige actuellement un redéploiement des fonctions de
paiement (`creerSessionCheckout`, `webhookStripe`,
`obtenirLienTelechargement`, `obtenirExercices`).

**Ne pas éditer à la main.** Ce fichier est généré par
`scripts/sync-banque-cd.js` (à la racine du site). Toute édition manuelle
sera écrasée à la prochaine sync, et surtout, elle sera détectée à
l'exécution par la Function : `contentHash` du blob ≠ `CONTENT_HASH_CD` de
la constante, la Function répond `internal` et refuse de servir le contenu.

## `exercices-cd-version.ts` — hash de contenu, source unique de vérité

Également généré par `sync-banque-cd.js`. Contient une seule constante
`CONTENT_HASH_CD` qui doit correspondre exactement au champ `contentHash`
du JSON ci-dessus. Contrat vérifié à chaque appel de `obtenirExercices`.
