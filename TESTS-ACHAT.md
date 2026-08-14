# Tests du parcours d'achat — mode Stripe test

Ce document est double : la **partie 1** liste ce qu'il faut mettre en place
une seule fois (les prérequis), et la **partie 2** liste les scénarios à
tester pour valider le parcours complet.

---

# Partie 1 — Configuration initiale (à faire une seule fois)

## 1.1 Créer le projet Firebase (si pas déjà fait)

**Un seul projet Firebase** — nom d'affichage `mathpratique`, ID
`mathpratique-8dea1` (suffixe généré par Firebase) — sert à la fois aux
tests et à la production. C'est **Stripe** qui bascule entre mode test et
mode live, pas Firebase.

1. [console.firebase.google.com](https://console.firebase.google.com/) → **Ajouter un projet**
2. Nom d'affichage : `mathpratique` (Firebase peut y ajouter un suffixe
   dans l'ID technique — dans ce projet, l'ID est `mathpratique-8dea1`).
3. Activer **Firestore**, **Authentication** (fournisseur « Courriel + mot de passe »),
   **Storage**, **Functions**
4. Pour Firestore et Storage, choisir l'emplacement **`northamerica-northeast1`** (Montréal) —
   même région que celle codée dans les Cloud Functions (`functions/src/index.ts`)
5. **⚠️ Passer au forfait Blaze** (Utilisation et facturation → mettre à niveau).
   Sans lui, les Cloud Functions ne peuvent pas appeler Stripe.
   Coût réel : quasi nul sous 2 M d'invocations/mois.

## 1.2 Récupérer la config Firebase pour le site

Console Firebase → **Paramètres du projet** → **Vos applications** → ajouter
une application Web si absent → **Configuration du SDK**.

Copier les six valeurs dans un fichier `.env.local` à la racine du dépôt :

```bash
cp .env.example .env.local
# puis coller les valeurs récupérées :
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`.env.local` est dans `.gitignore` — il ne partira jamais sur GitHub.

## 1.3 Créer un compte de test dans Firebase Auth

Console Firebase → **Authentication** → **Utilisateurs** → **Ajouter un utilisateur**.
Note le courriel et le mot de passe — tu t'en serviras pour tous les tests.

## 1.4 Configurer Stripe (mode test)

1. [dashboard.stripe.com](https://dashboard.stripe.com/) — **rester en mode test** (interrupteur en haut à droite : « Afficher les données de test »).
2. **Produits** → **Ajouter un produit** :
   - Nom : `Package — Calcul différentiel`
   - Prix : `49,00 CAD`, paiement unique
   - Copier l'**identifiant du prix** (commence par `price_...`)
3. **Coupons** → **Créer un coupon** (pour le prix de lancement) :
   - Type : montant fixe
   - Réduction : `1500` (15,00 $ pour tomber à 34 $)
   - Copier l'**identifiant du coupon** — l'ID est libre (Stripe génère un
     court identifiant aléatoire, tu peux aussi en choisir un lisible comme
     `LANCEMENT2026`). C'est l'ID, PAS un « code promotionnel » — les codes
     promos activables par le client sont un autre objet Stripe qu'on
     n'utilise pas ici.
4. **Clés API** → **Clés de développement** :
   - Copier la clé secrète `sk_test_...` (⚠️ jamais dans le repo)

## 1.5 Configurer les paramètres et secrets — pour l'émulateur local

Les fonctions déclarent `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` via
`defineSecret` (voir `functions/src/index.ts`). En production, ces secrets
vivent dans **Google Secret Manager**. Dans l'émulateur, Firebase les lit
depuis un fichier local **`functions/.secret.local`**.

Se connecter à Firebase (une seule fois) :

```bash
npx firebase login
npx firebase use --add   # sélectionner mathpratique-8dea1
```

Créer le fichier des secrets, à la racine du dossier `functions/` :

```bash
cat > functions/.secret.local <<'EOF'
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXX
# STRIPE_WEBHOOK_SECRET sera ajouté en §1.7 (une fois stripe listen lancé)
EOF
```

Colle la valeur `sk_test_...` récupérée en §1.4. `STRIPE_WEBHOOK_SECRET`
reste vide pour l'instant — on l'ajoutera en §1.7 quand Stripe CLI l'aura
généré.

Créer aussi le fichier des paramètres non secrets :

```bash
cat > functions/.env <<'EOF'
STRIPE_PRICE_ID=price_XXXXXXXXXXXX
STRIPE_COUPON_LANCEMENT=PROMOXXXXXXXX
URL_SITE=http://localhost:5173
STRIPE_TAXES_ACTIVES=non
EOF
```

**Vérification que Git ignore bien ces fichiers** :

```bash
git status --short | grep -E "\.secret\.local|functions/\.env"
# doit ne rien afficher
```

`.secret.local` est couvert par le pattern `*.local` (section « Dependencies »
de `.gitignore`), `functions/.env` par le pattern `.env`. Si l'un ou l'autre
apparaît dans `git status`, arrête tout et corrige le `.gitignore` avant de
continuer.

> **Pour la production**, ces mêmes secrets seront posés dans Secret Manager
> avec `firebase functions:secrets:set` — voir **Partie 4**.

## 1.6 Installer Stripe CLI (pour tester les webhooks localement)

Windows : `winget install --id Stripe.StripeCLI` — ou
[stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli).

Puis :

```bash
stripe login    # ouvre le navigateur pour lier ton compte Stripe
```

## 1.7 Récupérer le secret webhook — une fois, pour l'émulateur local

Étape en trois temps qui n'est faite qu'une fois. À la session suivante, on
suit directement §1.9.

**Étape 1 — démarrer temporairement l'émulateur des fonctions**

Dans un premier terminal, à la racine du dépôt :

```bash
npm --prefix functions run build
npx firebase emulators:start --only functions
```

**Étape 2 — lancer `stripe listen` dans un second terminal**

```bash
stripe listen --forward-to http://localhost:5001/mathpratique-8dea1/northamerica-northeast1/webhookStripe
```

La commande affiche au démarrage :

```
Your webhook signing secret is whsec_XXXXXXXXXXXXXXXXXXXX (^C to quit)
```

**Étape 3 — ajouter le secret à `.secret.local`**

Ouvre `functions/.secret.local` et **ajoute** la ligne
`STRIPE_WEBHOOK_SECRET=...` (retire la ligne commentée créée en §1.5). Le
fichier doit avoir cette forme :

```
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXX
```

**Étape 4 — arrêter tout**

Ctrl+C dans les deux terminaux. Ils seront relancés proprement en §1.9,
avec les valeurs bien chargées.

⚠️ **Le secret webhook change à chaque nouvelle exécution de `stripe listen`.**
Si tu redémarres cette commande demain, il faudra recopier la nouvelle valeur
dans `.secret.local` et relancer les émulateurs.

> **Pour la production**, un webhook permanent sera créé dans le dashboard
> Stripe pointant vers l'URL déployée — voir **Partie 4**.

## 1.8 Télécharger la clé de service (pour le script d'admin)

Console Firebase → **Paramètres du projet** → **Comptes de service** →
**Générer une nouvelle clé privée**.

Sauver le fichier téléchargé sous **`serviceAccountKey.json`** à la racine
du dépôt. **Vérifier immédiatement** :

```bash
git status | grep serviceAccountKey    # doit ne rien afficher — il est ignoré
```

## 1.9 Démarrer les émulateurs (à chaque session de test)

Dans trois terminaux distincts :

```bash
# Terminal 1 — les émulateurs Firebase
npm --prefix functions run build
npx firebase emulators:start --only functions,firestore,auth

# Terminal 2 — le forward Stripe → webhook local
stripe listen --forward-to http://localhost:5001/mathpratique-8dea1/northamerica-northeast1/webhookStripe

# Terminal 3 — le site (dev)
npm run dev
```

Si `stripe listen` affiche un `whsec_...` **différent** de celui déjà dans
`functions/.secret.local`, mets à jour ce fichier et redémarre le terminal 1
— sinon les tests échoueront tous avec « signature invalide ».

### Le site se connecte automatiquement aux émulateurs

Le site en mode `npm run dev` détecte `import.meta.env.DEV` et branche
`Auth`, `Firestore` et `Functions` sur les émulateurs locaux
(`127.0.0.1:9099`, `:8080`, `:5001`) — voir `src/firebase/config.ts`.

**Aucune action de ta part.** Aucune variable d'environnement à changer,
aucun mode spécial à activer. Tant que tu utilises `npm run dev`, tu es
sur les émulateurs. Tant que tu utilises `npm run build`, tu es sur
Firebase en production.

Comment vérifier que ça a bien branché :
- Onglet **Console** des DevTools navigateur — aucune erreur de connexion
- Terminal 1 (émulateurs) — les requêtes apparaissent en direct dès qu'un
  bouton est cliqué (auth, création session, webhook…)
- Terminal 2 (`stripe listen`) — les événements apparaissent quand un
  paiement se termine
- **Signe qu'il y a un problème** : le bouton « Acheter » affiche « Le
  paiement est momentanément indisponible » sans qu'aucune ligne
  n'apparaisse dans le terminal 1 → le site parle à Firebase en prod
  au lieu de l'émulateur. Redémarre `npm run dev`.

---

# Partie 2 — Les scénarios de test

## Cartes Stripe test (à mémoriser)

| Carte | Effet |
|---|---|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 9995` | Carte refusée (fonds insuffisants) |
| `4000 0025 0000 3155` | Requiert authentification 3-D Secure |

Date d'expiration : n'importe quelle date future. CVC : n'importe quels 3
chiffres. Code postal : n'importe lequel.

## 2.1 Parcours nominal

### Test A — Visiteur non connecté clique « Acheter »
**Actions** :
1. Naviguer vers `/boutique/calcul-differentiel` en mode incognito
2. Cliquer « Acheter — 34 $ »

**Résultat attendu** :
- Redirection vers `/connexion` avec l'état `{ retour: "/boutique/calcul-differentiel" }`
- Après connexion, retour automatique sur `/boutique/calcul-differentiel`

### Test B — Paiement réussi
**Actions** :
1. Une fois connecté avec le compte test (1.3)
2. Cliquer « Acheter »
3. Sur Stripe Checkout : carte `4242 4242 4242 4242`, exp. `12/30`, CVC `123`
4. Valider

**Résultat attendu** :
- Redirection vers `/achat-confirme?produit=package-calcul-differentiel`
- Spinner « On active ton accès… » (webhook en route)
- Après ~1-3 s, apparition de « Ton accès est ouvert ! » avec la **date de
  fin exactement 12 mois** après le paiement
- Dans le terminal Stripe CLI : ligne `checkout.session.completed → 200`
- Dans les logs de l'émulateur Functions : `[webhook] octroi accès …`

### Test C — Quiz personnalisé après achat
**Actions** :
1. Depuis la page « Mon compte » (ou en allant à `/custom-quiz?topic=differential-calculus`)
2. Composer un quiz

**Résultat attendu (chantier P4 non fait dans ce prompt)** :
- ⚠️ Pour l'instant, le quiz sert toujours **65 exercices** (les gratuits).
- Le branchement au bassin de 305 est un chantier suivant — voir
  [DIAGNOSTIC-ACHAT.md §5](DIAGNOSTIC-ACHAT.md) (Option B non retenue).

### Test D — Téléchargement d'un PDF
**Actions** :
1. « Mon compte » → cliquer sur un document
2. Le lien doit s'ouvrir dans un nouvel onglet vers Cloud Storage

**Résultat attendu** :
- URL signée valide 15 min (regarder la query string `?X-Goog-...`)
- Dans Firestore : `utilisateurs/{uid}/acces/calcul-differentiel/aTelecharge = true` après le premier téléchargement
- Un second téléchargement ne re-pose pas le drapeau (déjà là)

## 2.2 Cas d'échec

### Test E — Carte refusée
**Actions** : carte `4000 0000 0000 9995` au Checkout.

**Résultat attendu** :
- Message d'erreur Stripe en clair (« Votre carte a été refusée »)
- Aucun événement `checkout.session.completed` dans le terminal Stripe
- Aucun document créé dans Firestore

### Test F — 3-D Secure
**Actions** : carte `4000 0025 0000 3155` → cliquer « Complete authentication » dans la fenêtre 3DS.

**Résultat attendu** :
- Parcours complet, comme le test B

### Test G — Paiement abandonné (retour par cancel)
**Actions** : cliquer « ← Retour » depuis Checkout au lieu de payer.

**Résultat attendu** :
- Redirection vers `/boutique?achat=annule`
- Aucun accès créé

### Test H — Navigateur fermé juste après paiement
**Actions** :
1. Payer avec `4242…` mais **fermer l'onglet immédiatement** avant la redirection
2. Rouvrir plus tard `/mon-compte`

**Résultat attendu** :
- L'accès **est bien créé** (le webhook a été traité indépendamment de la redirection)
- Visible sur `/mon-compte`

## 2.3 Robustesse

### Test I — Webhook rejoué 3 fois
**Actions** :

1. Récupère l'ID d'un événement récent — dans le terminal qui fait tourner
   `stripe listen`, chaque événement est affiché avec sa ligne :
   `--> checkout.session.completed [evt_1QXXXXXXXXXXXX]`.
   Copie la partie `evt_...`.
2. Rejoue-le 3 fois de suite :

```bash
stripe events resend evt_XXXXXXXXXXXX
stripe events resend evt_XXXXXXXXXXXX
stripe events resend evt_XXXXXXXXXXXX
```

**Résultat attendu** :
- Un **seul** document dans `utilisateurs/{uid}/acces/calcul-differentiel`
- `dateFin` inchangée (pas de prolongation)
- Dans les logs Functions : premier appel = « octroi accès », les 2 suivants = « déjà traité »
- Un seul document dans `evenementsStripe/{sessionId}`

### Test J — Signature invalide

⚠️ **Fais ce test EN DERNIER de ta session.** Il modifie temporairement
`.secret.local` — si tu enchaînes d'autres tests sans restaurer, ils
échoueront tous avec la même erreur « signature invalide » et tu perdras du
temps à chercher le vrai coupable.

**Étape 1 — noter le vrai secret**
Ouvre `functions/.secret.local` et copie la valeur actuelle de
`STRIPE_WEBHOOK_SECRET` (commence par `whsec_...`) quelque part —
Notepad, un post-it, peu importe.

**Étape 2 — poser une valeur invalide**
```bash
# Édite functions/.secret.local et remplace la ligne par :
STRIPE_WEBHOOK_SECRET=whsec_INVALIDE
```

Puis redémarre les émulateurs (Ctrl+C dans le terminal Functions, relance
`npx firebase emulators:start`).

**Étape 3 — provoquer un événement**
```bash
stripe trigger checkout.session.completed
```

**Résultat attendu** :
- Le terminal Stripe CLI affiche : `POST … → [400] signature invalide`
- Logs de l'émulateur Functions : `[webhook] signature invalide`
- Aucune écriture dans Firestore

**Étape 4 — RESTAURER le vrai secret**
```bash
# Édite functions/.secret.local et remets la valeur notée à l'étape 1
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXX
```

Puis redémarre les émulateurs une dernière fois. **Vérifie que ça marche**
avec un `stripe trigger checkout.session.completed` — tu dois voir un 200.

### Test K — Utilisateur avec accès valide qui tente de racheter
**Actions** :
1. Se connecter avec le compte test qui possède déjà un accès actif
2. Cliquer « Acheter »

**Résultat attendu** :
- Erreur claire (message venant de `messagePaiement`) : « Tu as déjà accès à ce cours. Retrouve-le dans ton compte. »
- Aucune session Checkout créée (bloqué en amont)

### Test L — Accès expiré (via script d'admin)
**Actions** :
```bash
node scripts/acces-test.js --courriel test@exemple.com --cours calcul-differentiel --etat expire
```

Puis se connecter avec ce compte et tenter de télécharger un document.

**Résultat attendu** :
- Bouton de téléchargement grisé côté client
- Si contourné : la Cloud Function refuse (code `permission-denied`, message « Ton accès est expiré »)

### Test M — Client envoie une fausse date
La Cloud Function `obtenirLienTelechargement` utilise `Date.now()` côté
**serveur**. Aucun paramètre de date n'est accepté. La fausse date d'un
client ne peut pas allonger un accès.

## 2.4 Vérifications transversales

### Test N — Parcours mobile
Faire les tests B, D, K sur téléphone (via Chrome DevTools → mode responsive
ou vrai appareil pointé sur `http://<ip-de-ton-poste>:5173`).

### Test O — Montant facturé
Vérifier dans le dashboard Stripe → **Paiements** que le montant capturé est
**34,00 CAD** (prix de lancement, coupon appliqué).

### Test P — Reçu Stripe
Ouvrir le courriel de reçu envoyé par Stripe → vérifier :
- Montant : 34,00 $
- Description du produit : « Package — Calcul différentiel »
- Mention de la durée de 12 mois (dans le `custom_text.submit.message`)

### Test Q — Drapeau `aTelecharge`
Après le premier téléchargement (test D), inspecter le document Firestore
`utilisateurs/{uid}/acces/calcul-differentiel` → `aTelecharge = true`,
`premierTelechargementLe` = horodatage.

Ceci ferme le droit au remboursement (voir `src/acces/regles.ts`
`remboursementPossible`).

### Test R — Bassin de 305 exercices sur la page Exercices et le quiz

**Objet** : garantir que la Cloud Function `obtenirExercices` refuse tout ce
qui n'est pas un accès valide côté serveur, et que le contenu payant n'existe
JAMAIS dans le bundle publié.

**Séquence à respecter** — la sync passe en premier, sinon les émulateurs
Functions embarquent un blob vide ou périmé et le cas « accès valide » du
test R.1 échoue.

1. **Sync de la banque** (bundle client + bundle Function) :

   ```powershell
   $env:BANQUE_CD_PATH = "C:\Users\simon\Documents\Session Automne 2026\Calcul différentiel\exercices-calcul-differentiel"
   node scripts/sync-banque-cd.js
   ```

2. **Build des Functions** (compile TypeScript + intègre le nouveau blob) :

   ```powershell
   npm --prefix functions run build
   ```

3. **Démarrer les émulateurs — Auth + Firestore + Functions** (dans un
   terminal dédié, à laisser tourner) :

   ```powershell
   firebase emulators:start --only auth,firestore,functions
   ```

   ⚠️ Ne PAS utiliser `npm --prefix functions run serve` : cette commande
   ne démarre que Functions, sans Auth ni Firestore, et le test R.1 échoue
   à `creerCompte`.

4. **Contrôle automatisé (R.1)** :

   ```powershell
   node scripts/test-securite-exercices.js
   ```

   Le script exécute 4 appels à `obtenirExercices` et compare la réponse
   au comportement attendu :

   | Configuration               | Attendu                          |
   |---|---|
   | Sans authentification       | `functions/unauthenticated`      |
   | Auth sans doc d'accès       | `functions/permission-denied`    |
   | Auth + accès EXPIRÉ         | `functions/permission-denied`    |
   | Auth + accès valide         | 305 exercices                    |

   Exit code 0 = les 4 tests passent. Exit code 1 = au moins un cas ne
   respecte pas le contrat de sécurité — **ne pas déployer avant
   correction**. Exit code 2 = le test lui-même est cassé (Function
   `not-found`, `internal` ou erreur infra) — vérifier les émulateurs
   et le build avant de tirer une conclusion sur la sécurité.

5. **Vérification manuelle end-to-end (R.3)** — dans le browser, sur le
   site en `npm run dev` :

   1. Créer un compte test dans Firebase Auth émulateur (Console
      émulateur `http://127.0.0.1:4000` ou via le formulaire d'inscription
      du site)
   2. `node scripts/acces-test.js --courriel test@exemple.com --cours calcul-differentiel --etat valide`
   3. Se connecter dans le browser au même compte
   4. Naviguer sur `/exercices/calcul-differentiel` :
      - Le compteur en tête indique « 305 sur 305 »
      - Le bandeau « Ta banque complète se charge… » apparaît quelques
        secondes puis disparaît
      - Un chapitre affiche tous ses exos (ex. ch2 en montre 60, dont
        les 12 gratuits)
      - Les messages « X autres avec le package » ont disparu
      - Les boutons progression (case + drapeau) sont visibles sur chaque
        carte
   5. Naviguer sur `/custom-quiz`, choisir Calcul différentiel :
      - Tous les inputs sont actifs pour tous les chapitres (les 305
        couvrent tous les types)
      - Configurer un quiz de 5 exos, démarrer
      - Le quiz peut piocher parmi les 305 (constate en rafraîchissant
        plusieurs fois — des IDs `CD-CXX-EYYY` avec un numéro dépassant
        le plus grand gratuit du chapitre doivent apparaître au moins une
        fois)
   6. Après `--etat expire` puis rafraîchissement :
      - La page revient à « 65 sur 305 »
      - Le cache localStorage `mp:banque:calcul-differentiel` est purgé
        (vérifiable dans DevTools > Application > Local Storage)

6. **Rafraîchissement automatique après sync (R.5)** — vérifie que le
   cache s'invalide quand le contenu de la banque change, SANS
   déconnexion. Suppose que l'étape 5 vient d'être exécutée (accès valide,
   banque en cache). Sans se déconnecter du compte test :

   1. Dans la banque source, modifier un exercice qui apparaît côté site
      (par ex. reformuler l'énoncé de `CD-C01-E003` — c'est un gratuit,
      donc visible immédiatement à côté du cache serveur)
   2. Relancer la sync + le build Functions :

      ```powershell
      $env:BANQUE_CD_PATH = "C:\Users\simon\Documents\Session Automne 2026\Calcul différentiel\exercices-calcul-differentiel"
      node scripts/sync-banque-cd.js
      npm --prefix functions run build
      ```

      Le hash miroir bundlé côté client (`src/data/calcul-differentiel/version.ts`,
      export `CONTENT_HASH_CD`) change à chaque sync qui modifie un exo.

   3. Le HMR Vite recharge la page — ou recharger à la main.

   4. Constater dans DevTools > Application > Local Storage que la clé
      `mp:banque:calcul-differentiel` a été purgée puis réécrite ;
      son champ `hashClient` correspond maintenant au nouveau
      `CONTENT_HASH_CD` visible dans le fichier `version.ts`.

   5. Vérifier que l'énoncé modifié apparaît sur la page Exercices sans
      qu'il ait fallu se déconnecter.

   Ce cycle valide la promesse « mises à jour incluses » : un
   redéploiement du site suffit à propager le nouveau contenu à tous les
   étudiants déjà chargés, en un seul refetch par étudiant.

**Contrôle statique post-build (indépendant, à passer avant tout push)** :

```powershell
npm run build
node scripts/verifier-synchro-banque.js
```

Vérifie qu'aucun fragment distinctif d'un exercice payant (≥ 40 caractères,
absent des 65 gratuits) ne se trouve dans `dist/`. Prévient qu'un ajout de
code fasse fuiter par inadvertance du contenu payant dans le bundle Vite
publié sur GitHub Pages.

**⚠️ Node : émulateur ≠ production.** Les émulateurs Firebase tournent sous
la version de Node installée localement (Node 24 chez Simon), alors que la
runtime déclarée pour les Cloud Functions déployées est Node 20
(`firebase.json` → `"runtime": "nodejs20"`). Certains comportements JSON
imports, syntaxes récentes ou API expérimentales peuvent passer en local
et échouer en prod. **Le Test R doit être repassé après déploiement**
(mode Stripe live, contre les vraies Functions déployées) pour valider que
la Function `obtenirExercices` répond identiquement en prod.

---

# Partie 3 — Utilisation du script d'admin

## Usage

```bash
# Ouvrir un accès valide pour 12 mois
node scripts/acces-test.js --courriel test@exemple.com --cours calcul-differentiel --etat valide

# Simuler un accès qui s'est terminé la veille
node scripts/acces-test.js --courriel test@exemple.com --cours calcul-differentiel --etat expire

# Retirer complètement l'accès
node scripts/acces-test.js --courriel test@exemple.com --cours calcul-differentiel --etat aucun
```

Le script :
- Résout le courriel → uid via Firebase Auth
- Écrit directement dans `utilisateurs/{uid}/acces/{coursId}` avec `source: "test"`
- Utilise `ajouterMois()` (la même fonction que le webhook — cohérence garantie)

**Prérequis** : `serviceAccountKey.json` à la racine (§1.8).

**Ne jamais déployer** ce script — c'est un outil de développement.

---

# Partie 4 — Activation en production

Une fois tous les tests de la Partie 2 validés, voici l'ordre exact pour
passer du mode test au mode live. **Prends ton temps** — chaque erreur ici
coûte un vrai paiement à quelqu'un.

## 4.1 Recréer les objets Stripe en mode live

**Les objets créés en mode test n'existent pas en mode live** — Stripe les
sépare complètement. Tout est à refaire.

Bascule le dashboard Stripe en **mode live** (interrupteur en haut à droite :
désactiver « Afficher les données de test »).

1. **Produits** → **Ajouter un produit** :
   - Nom : `Package — Calcul différentiel`
   - Prix : `49,00 CAD`, paiement unique
   - Copier le nouvel identifiant `price_...` (**différent** de celui du mode test)
2. **Coupons** → **Créer un coupon** :
   - Type : montant fixe
   - Réduction : `1500` (pour arriver à 34 $)
   - Copier le nouvel identifiant (comme en §1.4, c'est un ID libre — peut
     être personnalisé, ex. `LANCEMENT2026-LIVE`)
3. **Clés API** → **Clés de production** :
   - Copier la clé secrète `sk_live_...`
   - ⚠️ Cette clé donne accès à ton compte en production — jamais dans le
     repo, jamais partagée, jamais dans un courriel

## 4.2 Poser les secrets et paramètres pour la production

Les secrets de production vivent dans **Google Secret Manager** (pas dans
`.secret.local`) :

```bash
# Depuis la racine du dépôt
npx firebase functions:secrets:set STRIPE_SECRET_KEY
# → colle la valeur sk_live_... récupérée en 4.1
```

Pour `STRIPE_WEBHOOK_SECRET`, il faut d'abord créer l'endpoint webhook
(§4.3) — reviens ici après.

Mettre à jour `functions/.env` avec les identifiants **live** :

```bash
cat > functions/.env <<'EOF'
STRIPE_PRICE_ID=price_XXXXXXXXXXXX_LIVE
STRIPE_COUPON_LANCEMENT=PROMOXXXXXXXX_LIVE
URL_SITE=https://mathpratique.ca
STRIPE_TAXES_ACTIVES=non
EOF
```

⚠️ **`URL_SITE` doit passer à `https://mathpratique.ca`** — sinon Stripe
renvoie les acheteurs sur `http://localhost:5173/achat-confirme` qui n'existe
nulle part. C'est l'erreur qui gâche l'expérience de tes premiers acheteurs.

## 4.3 Créer le webhook Stripe en mode live

En mode test, `stripe listen` faisait le relais. En production, Stripe
appelle directement l'URL déployée de la Cloud Function.

**L'URL exacte** de la fonction `webhookStripe` déployée est affichée à la
fin de `firebase deploy --only functions` (§4.4), et visible dans le
dashboard Firebase → **Fonctions** → cliquer sur `webhookStripe`. Elle a la
forme :

```
https://northamerica-northeast1-mathpratique-8dea1.cloudfunctions.net/webhookStripe
```

**Il vaut mieux faire §4.4 (déploiement) AVANT §4.3, pour copier l'URL
exacte** — la deviner mène souvent à un webhook qui pointe dans le vide.

Une fois l'URL en main :

1. Dashboard Stripe (mode live) → **Développeurs** → **Webhooks** → **Ajouter un endpoint**
2. URL d'écoute : coller l'URL copiée du dashboard Firebase
3. Événement à écouter : `checkout.session.completed`
4. Créer, puis **révéler et copier le secret de signature** (`whsec_...`)

Poser ce secret dans Secret Manager :

```bash
npx firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# → colle la valeur whsec_... récupérée à l'étape 4
```

## 4.4 Déployer les Cloud Functions

```bash
npx firebase deploy --only functions
```

Vérifie dans le dashboard Firebase (Fonctions) que les 3 fonctions
apparaissent, en région `northamerica-northeast1`.

## 4.5 Activer le paiement côté site

Dans `src/pages/BoutiqueCalculDifferentiel.tsx`, ligne du haut :

```ts
const PAIEMENT_ACTIF = true;  // était false
```

Commit et push. Le site en prod (GitHub Pages) prendra la nouvelle version
au prochain build.

## 4.6 Validation en live

**Fais un vrai achat avec ta propre carte** (test B, mais avec `sk_live_...`
et le vrai formulaire de paiement) :

- Vérifie que tu es facturé de `34,00 $` (le coupon de lancement s'applique)
- Vérifie que ton accès apparaît sur `/mon-compte` avec la bonne date de fin
- Rembourse-toi via le dashboard Stripe (Paiements → ton paiement → Rembourser)

Ce test coûte 34 $ pendant quelques jours (délai de remboursement Stripe),
et te confirme que la chaîne complète fonctionne — bien moins cher qu'un
premier client qui ne reçoit rien.

## 4.7 Rester vigilant les premiers jours

- Surveille les logs Firebase Functions (`npx firebase functions:log`) après
  chaque achat pendant la première semaine
- Vérifie qu'aucun événement Stripe n'échoue (dashboard → Webhooks → ton
  endpoint → onglet « Tentatives »)
- Sois disponible sur ton adresse de contact — les premiers acheteurs
  peuvent tomber sur des cas non anticipés
