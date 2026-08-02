# MathPratique 🧮

Site d'exercices de mathématiques et boutique de matériel de cours :
[mathpratique.ca](https://mathpratique.ca)

---

## Pile technique

React 19 + TypeScript + Vite, Tailwind 4, React Router 7, Framer Motion.
Déployé sur GitHub Pages par GitHub Actions, à chaque poussée sur `main`.

Firebase (authentification + Firestore) est **facultatif** : voir plus bas.

## Commandes

```bash
npm run dev      # serveur de développement
npm run build    # vérification des types, compilation, contrôle des fichiers statiques
npm run test     # tests des règles d'accès
npm run lint
```

`npm run build` échoue si un fichier statique attendu est absent — voir
[Fichiers statiques](#fichiers-statiques).

---

## Fichiers statiques

GitHub Pages sert `404.html` (une copie de l'accueil) pour toute URL inconnue.
Un lien `<a download>` vers un PDF manquant enregistre donc la page d'accueil
sous le nom du PDF, et le lecteur affiche du vide. Le serveur ayant répondu
« 200 OK », le site n'a aucun moyen de s'en apercevoir.

`scripts/verifier-fichiers-statiques.mjs` bloque le build dans ce cas. Il
contrôle la présence, la taille minimale et les octets de signature :

| Fichier | Sert à |
|---|---|
| `public/enseignants/echantillon.pdf` | échantillon de `/enseignants`, version enseignant |
| `public/boutique/echantillon.pdf` | aperçu gratuit de `/boutique`, version étudiant |

Les deux sont produits par le projet de matériel de cours
(`scripts/generer-echantillon.js`), qui les recopie ici à chaque build.

---

## Le modèle d'accès

Un accès à un cours dure **12 mois**, sans abonnement ni renouvellement
automatique.

### La règle

Toute la logique tient dans [`src/acces/regles.ts`](src/acces/regles.ts) —
un module **sans aucune dépendance**, qui ne manipule que des dates et des
nombres. C'est délibéré :

- la règle qui décide si quelqu'un a payé doit être lisible d'un seul tenant
  et vérifiable par des tests, sans émulateur ni compte de service ;
- le serveur devra appliquer exactement la même règle que le client. Un
  module sans dépendance se réutilise tel quel dans une Cloud Function.

```ts
verifierAcces(acces, maintenant) // → { actif, joursRestants, bientotExpire, seuilRappel }
```

`maintenant` est un paramètre plutôt qu'un `Date.now()` interne : c'est ce qui
rend la règle testable, et ce qui permettra au serveur de passer sa propre
horloge plutôt que de faire confiance à celle du navigateur.

Un accès acheté et un accès ouvert par code de classe ont **la même
structure** ; seul le champ `source` diffère. Aucune migration ne sera
nécessaire le jour où les codes de classe existeront.

```bash
npm run test
```

### Où c'est rangé

```
utilisateurs/{uid}/acces/{coursId}
```

Une sous-collection plutôt qu'une carte dans le document utilisateur : le
webhook écrit un seul document sans lire le reste, les règles de sécurité
s'écrivent par document, et un accès se révoque sans toucher au profil.

### ⚠️ Ce que le client vérifie ne protège rien

Le contrôle fait dans le navigateur sert à **afficher la bonne interface**.
Un utilisateur peut modifier ce que son navigateur exécute. La barrière réelle
est la Cloud Function de téléchargement, qui refait la vérification avec sa
propre horloge avant de signer la moindre URL. Aucun contenu payant ne doit se
trouver dans ce dépôt, même caché.

---

## Firebase

### État actuel : non configuré, et le site fonctionne quand même

Tant que les variables d'environnement sont absentes :

- `firebaseEstConfigure` vaut `false` ;
- `/connexion` et `/mon-compte` affichent un message honnête ;
- le lien de compte **n'apparaît pas** dans la barre de navigation ;
- **le SDK n'est pas téléchargé** — tous les imports sont dynamiques, et il
  n'est chargé que si la configuration existe. Importé statiquement, il
  ajoutait 511 ko à chaque visite pour une fonctionnalité inutilisable.

Tout le reste — exercices, quiz, boutique, aperçus, page enseignants —
continue de marcher exactement comme avant.

### Mise en service

Ces étapes se font dans la console Firebase et ne peuvent pas être scriptées
depuis le dépôt.

1. **Créer le projet** sur [console.firebase.google.com](https://console.firebase.google.com).
2. **Passer au forfait Blaze.** Le forfait gratuit Spark interdit les appels
   réseau sortants, or le webhook Stripe doit joindre l'API de Stripe. Le coût
   reste négligeable à ce volume, mais une carte est exigée.
3. **Activer l'authentification** : Authentication → Sign-in method →
   *Courriel/mot de passe* et *Google*. Les deux sont déjà gérés par
   `/connexion`.
4. **Créer la base Firestore** en mode production (règles fermées par défaut).
5. **Déployer les règles** :
   ```bash
   firebase deploy --only firestore:rules
   ```
6. **Renseigner la configuration** : copier `.env.example` en `.env.local` et
   remplir les six variables (console → Paramètres du projet → Vos
   applications → Configuration du SDK).
7. **Autoriser les domaines** : Authentication → Settings → Authorized
   domains → ajouter `mathpratique.ca`. `localhost` y est déjà.

Pour que les comptes fonctionnent **en production**, les six variables doivent
aussi exister au moment du build dans GitHub Actions : Settings → Secrets and
variables → Actions, puis les injecter dans l'étape `npm run build` du
workflow.

### Les clés du client ne sont pas des secrets

Les six variables `VITE_FIREBASE_*` partent dans le bundle : c'est le
fonctionnement normal d'un client Firebase. Ce qui protège les données, ce
sont [`firestore.rules`](firestore.rules) et les vérifications faites côté
serveur.

En revanche, **tout ce qui commence par `VITE_` est public**. La clé secrète
Stripe (`sk_…`), le secret de webhook (`whsec_…`) et les clés de compte de
service ne doivent jamais s'en approcher — ils vivront dans la configuration
des Cloud Functions. `.gitignore` bloque déjà `.env*` et les fichiers de
compte de service.

### Règles de sécurité

Le principe tient en une phrase : **le client lit ses propres accès, il n'en
écrit jamais.** Toute écriture passe par le webhook, qui utilise le SDK Admin
et n'est pas soumis aux règles. Si le navigateur pouvait écrire, n'importe qui
s'accorderait douze mois gratuits depuis la console — c'est le premier endroit
qu'un curieux essaie.

Tester les règles sans toucher à la production :

```bash
firebase emulators:start --only firestore
```

---

## Paiement

Pas encore implémenté. `PAIEMENT_ACTIF` vaut `false` dans
[`src/pages/Boutique.tsx`](src/pages/Boutique.tsx) : la page annonce le
produit sans prétendre le vendre.

Ce qui reste à construire, et la marche à suivre pour tester les webhooks en
local avec la CLI Stripe, sera documenté ici à l'étape suivante. Deux règles
sont déjà arrêtées :

- **l'accès est accordé par le webhook, jamais par la page de succès.** Un
  acheteur peut fermer son navigateur avant la redirection ; le paiement est
  quand même valide ;
- **le webhook doit être idempotent.** Stripe réessaie ; un double traitement
  ne doit ni créer deux accès ni prolonger la période. D'où la collection
  `evenementsStripe/{sessionId}`, qui sert de journal et de garde.

---

## Documents de travail

| Fichier | Contenu |
|---|---|
| [`AUDIT-BOUTIQUE.md`](AUDIT-BOUTIQUE.md) | état du dépôt avant la mise en vente, et plan d'intégration |
| [`DIAGNOSTIC-PDF.md`](DIAGNOSTIC-PDF.md) | pourquoi l'échantillon se téléchargeait vide, et le correctif |

---

*© 2026 MathPratique.ca. Tous droits réservés.*
