# Tests du parcours d'achat — mode Stripe test

Ce document est double : la **partie 1** liste ce qu'il faut mettre en place
une seule fois (les prérequis), et la **partie 2** liste les scénarios à
tester pour valider le parcours complet.

---

# Partie 1 — Configuration initiale (à faire une seule fois)

## 1.1 Créer le projet Firebase (si pas déjà fait)

1. [console.firebase.google.com](https://console.firebase.google.com/) → **Ajouter un projet**
2. Nommer le projet (ex. `mathpratique-test` ou `mathpratique-prod`)
3. Activer **Firestore**, **Authentication** (avec le fournisseur « Courriel + mot de passe »),
   **Storage**, **Functions**
4. **⚠️ Passer au forfait Blaze** (Utilisation et facturation → mettre à niveau).
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
   - Réduction : `1500` (15,00 $ pour tomber à 34 $) — ou pourcentage
   - Copier l'**identifiant du coupon** (commence par `PROMO...`)
4. **Clés API** → **Clés de développement** :
   - Copier la clé secrète `sk_test_...` (⚠️ jamais dans le repo)

## 1.5 Configurer les secrets Firebase Functions

Depuis le terminal, à la racine du dépôt :

```bash
# Se connecter à Firebase (une seule fois)
npx firebase login
npx firebase use --add   # sélectionner le projet créé en 1.1

# Poser les secrets (interactif — colle la valeur quand demandé)
npx firebase functions:secrets:set STRIPE_SECRET_KEY
# → colle la valeur sk_test_... récupérée en 1.4

# Poser les paramètres non secrets (via .env dans functions/)
cat > functions/.env <<EOF
STRIPE_PRICE_ID=price_XXXXXXXXXXXX
STRIPE_COUPON_LANCEMENT=PROMOXXXXXXXX
URL_SITE=http://localhost:5173
STRIPE_TAXES_ACTIVES=non
EOF
```

Le fichier `functions/.env` est également ignoré par Git (couvert par
`.env.*` dans `.gitignore`).

## 1.6 Installer Stripe CLI (pour tester les webhooks localement)

Windows : `winget install --id Stripe.StripeCLI` — ou
[stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli).

Puis :

```bash
stripe login    # ouvre le navigateur pour lier ton compte Stripe
```

## 1.7 Récupérer le secret webhook

Dans un terminal séparé (à laisser tourner pendant les tests) :

```bash
stripe listen --forward-to http://localhost:5001/PROJET_ID/northamerica-northeast1/webhookStripe
```

Remplace `PROJET_ID` par l'id de ton projet Firebase (celui de la variable
`VITE_FIREBASE_PROJECT_ID`).

Cette commande affiche : `Your webhook signing secret is whsec_...`.
Copier cette valeur et la poser en secret :

```bash
npx firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# → colle la valeur whsec_...
```

## 1.8 Télécharger la clé de service (pour le script d'admin)

Console Firebase → **Paramètres du projet** → **Comptes de service** →
**Générer une nouvelle clé privée**.

Sauver le fichier téléchargé sous **`serviceAccountKey.json`** à la racine
du dépôt. **Vérifier immédiatement** :

```bash
git status | grep serviceAccountKey    # doit ne rien afficher — il est ignoré
```

## 1.9 Démarrer les émulateurs (à chaque session de test)

Dans deux terminaux distincts :

```bash
# Terminal 1 — les émulateurs Firebase
npm --prefix functions run build
npx firebase emulators:start --only functions,firestore,auth

# Terminal 2 — le forward Stripe → webhook local
stripe listen --forward-to http://localhost:5001/PROJET_ID/northamerica-northeast1/webhookStripe

# Terminal 3 — le site (dev)
npm run dev
```

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
```bash
# Depuis Stripe CLI, replay le dernier événement 3 fois
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
**Actions** :
```bash
# Poser un mauvais secret temporairement
npx firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# → coller « whsec_INVALIDE »
# puis relancer le forward stripe listen — il enverra avec l'ancienne signature
```

**Résultat attendu** :
- Réponse 400 « signature invalide »
- Aucune écriture Firestore
- Log : `[webhook] signature invalide`

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

Une fois tous les tests validés :

1. Passer `PAIEMENT_ACTIF = true` dans `src/pages/BoutiqueCalculDifferentiel.tsx`
2. Refaire la config §1.5 avec les clés **live** de Stripe (`sk_live_...`)
3. Créer un nouveau webhook dans le dashboard Stripe pointant vers l'URL
   de Cloud Function déployée (au lieu de `stripe listen`)
4. `npx firebase deploy --only functions`
5. Refaire le test B avec une vraie carte (ou une petite somme sur ta propre carte pour valider)
