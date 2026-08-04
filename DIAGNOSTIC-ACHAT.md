# Diagnostic — Parcours d'achat Stripe

**Date** : 2026-08-02

## 1. Ce qui existe déjà (excellente base)

### Backend (Cloud Functions)
`functions/src/index.ts` (340 lignes, très bien commenté) fournit :

| Fonction | Rôle | Statut |
|---|---|---|
| `creerSessionCheckout` (onCall) | Vérif auth → refus si accès valide → crée session Stripe avec metadata `{uid, coursId}` → renvoie URL. Applique le coupon de lancement, texte explicite (12 mois, remboursement 7j), locale fr-CA. | ✅ écrit |
| `webhookStripe` (onRequest) | Vérif signature (avec `rawBody`) → `deciderWebhook()` avec l'horloge serveur → **transaction Firestore idempotente** (relit le journal dans la même tx, `evenementsStripe/{sessionId}` comme clé de dédup) → écrit `acces` + `journal` ensemble ou pas du tout. | ✅ écrit |
| `obtenirLienTelechargement` (onCall) | `deciderTelechargement()` côté serveur → URL Storage signée 15 min → pose `aTelecharge=true` au premier téléchargement (verrouille le remboursement). | ✅ écrit |

### Logique métier partagée client/serveur
`src/acces/` :
- ✅ `regles.ts` — `verifierAcces`, `ajouterMois` (gère 31 jan → 28/29 fév), `DUREE_ACCES_MOIS=12`, `remboursementPossible`, `formaterDate`
- ✅ `webhook.ts` — `deciderWebhook` pure et testable
- ✅ `telechargement.ts` — `deciderTelechargement` pure
- ✅ `documents.ts` — catalogue des documents servis

### Client
- ✅ `src/firebase/{config,useAuth,useAcces,acces,paiement,telechargement,contexte,AuthContext}.tsx`
- ✅ Pages `/connexion`, `/mon-compte`, `/achat-confirme`
- ✅ La page `BoutiqueCalculDifferentiel.tsx` appelle `demarrerAchat(COURS_EN_VENTE)` quand `PAIEMENT_ACTIF=true`
- ✅ `useAcces(coursId)` — hook réactif avec état de chargement + gestion d'erreur

### Sécurité
- ✅ `.env.example` + `.gitignore` : `.env`, `.env.*`, `*-firebase-adminsdk-*.json`, `serviceAccountKey.json` exclus
- ✅ Clés Stripe via **Firebase Secret Manager** (`defineSecret`) — jamais dans le repo
- ✅ Séparation propre client/serveur : la clé Firebase publique dans `VITE_*`, le secret Stripe dans Secret Manager
- ✅ `firestore.rules` existe (à auditer)
- ✅ `firebase.json` avec emulators auth/functions/firestore

---

## 2. Ce qui manque

| Élément | Statut | Priorité |
|---|---|---|
| **`scripts/acces-test.js`** — outil d'admin local | ❌ absent | 🔴 requis §4 du prompt |
| **`TESTS-ACHAT.md`** — plan de test | ❌ absent | 🔴 requis §5 |
| **`AchatConfirme.tsx`** — attente du webhook + affichage date réelle | ⚠️ page statique actuellement, ne lit pas l'accès | 🔴 requis §3.3 |
| **`PAIEMENT_ACTIF`** dans BoutiqueCalculDifferentiel.tsx | ⚠️ actuellement `false` → bouton disabled | 🟡 à passer à `true` une fois Stripe testé |
| Effet sur le quiz : « 305 exercices au lieu de 68 » | ❌ non implémenté | 🔴 §3.4 (nouveau chantier — voir §5 de ce doc) |
| Séries méli-mélo cumulatives + mode chronométré | ❌ non implémenté | 🔴 §3.4 (nouveau chantier) |
| Compteurs « X autres avec le package » dans le quiz | ❌ non implémenté | 🔴 §3.4 (nouveau chantier) |

---

## 3. Prérequis à confirmer AVANT de coder

Je ne peux pas vérifier ces points depuis le repo — ils dépendent de la console Firebase et de ton dashboard Stripe. **Confirme-moi ce qui est fait** :

| # | Prérequis | Où le vérifier |
|---|---|---|
| **A** | Un projet Firebase existe avec Firestore + Auth + Storage activés | Console Firebase |
| **B** | **Le forfait Blaze est activé** (le forfait Spark interdit les appels sortants vers Stripe) | Console Firebase → « Utilisation et facturation » |
| **C** | `.env.local` créé à partir de `.env.example` avec les 6 variables `VITE_FIREBASE_*` | Sur ton poste local |
| **D** | Clé Stripe test définie : `firebase functions:secrets:set STRIPE_SECRET_KEY` (valeur `sk_test_...`) | Terminal |
| **E** | Secret webhook test défini : `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET` (valeur `whsec_...` que Stripe CLI génère) | Terminal |
| **F** | Product + Price créés dans Stripe test dashboard, puis `firebase functions:config:set params.stripe_price_id="price_..."` OU `defineString` initialisé | Terminal / Stripe dashboard |
| **G** | Compte Firebase Auth de test créé (courriel + mot de passe) | Console Firebase → Auth |
| **H** | Stripe CLI installée localement pour tester les webhooks : `stripe listen --forward-to localhost:5001/...` | `stripe --version` |
| **I** | Bucket Firebase Storage créé (pour les PDFs — même si vide au début) | Console Firebase → Storage |

**Si un de ces points n'est pas fait**, je te fournis les commandes exactes dans la marche à suivre.

---

## 4. Ce qu'il faut construire (chantiers du prompt)

### Chantier P1 — Refonte de `AchatConfirme.tsx`
- Utiliser `useAcces("calcul-differentiel")` pour lire l'état réel côté client
- Trois états visibles :
  1. **En attente** — spinner + « Ton paiement est reçu. On active ton accès… » — refresh toutes les 3 s pendant max 60 s
  2. **Accès actif** — date de fin réelle (via `formaterDate(acces.dateFin)`) + lien vers `/practice`
  3. **Timeout** — après 60 s sans accès, message clair + adresse contact (`EMAIL_CONTACT`)
- ⚠️ **Ne jamais** afficher « tu n'as pas accès » pendant l'attente normale.

### Chantier P2 — Script d'admin `scripts/acces-test.js`
Node.js, utilise `firebase-admin` avec `serviceAccountKey.json` local. Options :
```
--courriel <compte>         (obligatoire)
--cours calcul-differentiel (obligatoire)
--etat valide|expire|aucun  (obligatoire)
```
Écrit dans `utilisateurs/{uid}/acces/{coursId}` avec `source: "test"`.
Le fichier `serviceAccountKey.json` est déjà dans `.gitignore` — pas de risque de fuite.

### Chantier P3 — Documentation `TESTS-ACHAT.md`
Le doc complet des scénarios (11 tests listés au §5 du prompt), avec :
- Commandes exactes (`stripe listen`, cartes de test)
- Résultat attendu par scénario
- Instructions pour utiliser `scripts/acces-test.js`

### Chantier P4 — Activation
Une fois P1/P2/P3 validés :
- Passer `PAIEMENT_ACTIF = true` dans `BoutiqueCalculDifferentiel.tsx`
- Vérifier le build + preview

---

## 5. ⚠️ Points hors périmètre à trancher

Le prompt §3.4 mentionne : *« Le quiz personnalisé pioche dans les 305 exercices au lieu des 68 »*, *« Séries méli-mélo cumulatives et mode chronométré »*, *« Les compteurs "X autres avec le package" disparaissent »*.

**Tu m'avais dit « plus tard » pour ce chantier dans le prompt précédent** (Quiz personnalisé Calcul différentiel). Voici l'état :

- Le picker `calcDiffPicker.ts` ne connaît que les 65 gratuits (banque JSON locale)
- Les 240 payants n'existent PAS dans les fichiers publics — leur contenu doit venir d'une Cloud Function ou de Firestore
- Le mode méli-mélo cumulatif et le mode chronométré sont **de nouvelles features**, pas des réparations
- Le compteur « X autres avec le package » nécessite d'exposer les métadonnées des 240 payants côté client

**Deux options** :

- **Option A** — Scope réduit : ce prompt couvre **uniquement le paiement** (P1-P4 ci-dessus). Le contenu servi reste 65 gratuits + accès à venir. Les 4 points du §3.4 restent pour un chantier suivant.
- **Option B** — Scope complet : on branche aussi le contenu payant (Cloud Function qui expose les 240 exos aux utilisateurs authentifiés+accès). Effort ~3× plus important.

**Recommandation : A**. Un parcours d'achat validé est déjà un livrable substantiel. Livrer la moitié du §3.4 sans les 240 payants réels rendrait l'achat « qui ne débloque rien » — pire que rien. Autant faire le paiement propre d'abord, puis le contenu payant en chantier dédié.

---

## 6. Plan de code (une fois validé)

Ordre proposé, chaque étape testable indépendamment :

1. **P1** — Refonte `AchatConfirme.tsx` (30 min)
2. **P2** — Script `scripts/acces-test.js` (45 min)
3. **P3** — `TESTS-ACHAT.md` (45 min)
4. **P4** — Passage de `PAIEMENT_ACTIF` à `true` + build final (10 min)

Total : ~2 h de code + tes tests manuels (30-60 min avec la CLI Stripe).

---

## 7. Questions à trancher — POINT DE CONTRÔLE 1

**Merci de répondre à ces 3 blocs avant que je code** :

### Bloc A — Prérequis (§3 ci-dessus)
Confirme l'état des points A à I. Pour chaque « ❌ pas fait », je te fournirai les commandes exactes plutôt que de te laisser sans piste.

### Bloc B — Scope
Option A (paiement seul) ou Option B (paiement + contenu payant) ? Recommandation A.

### Bloc C — Ordre d'exécution
Je code P1 → P2 → P3 → P4 dans cet ordre, ou tu veux une variante (ex. P3 en premier pour tester avant que je code P1/P2) ?

---

**Point d'arrêt : j'attends tes réponses avant de toucher au code.**
