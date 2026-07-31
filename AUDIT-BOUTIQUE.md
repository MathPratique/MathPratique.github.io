# Audit — mise en vente du package « Calcul différentiel »

Dépôt audité : `MathPratique.github.io`, branche `main`, commit `0e865a1`.
Date : 30 juillet 2026. Aucun code n'a été modifié.

---

## Résumé

Sur les cinq éléments à auditer, **quatre n'existent pas**. Le dépôt est un
site statique React sans back-end, sans authentification et sans base de
données. Il n'y a ni Stripe, ni Firebase, ni Cloud Storage, ni notion
d'utilisateur.

| À auditer | État |
|---|---|
| 1. Intégration Stripe | **inexistante** — un champ `stripeUrl` vide, jamais rempli |
| 2. Modèle d'accès | **inexistant** — aucun utilisateur, aucun compte, aucune vérification |
| 3. Fonction de téléchargement (URL signées) | **inexistante** — aucun Cloud Storage |
| 4. Page Boutique | **existe** — analysée en §4 |
| 5. Conventions visuelles | **existent et sont cohérentes** — relevées en §5 |

Le travail demandé n'est donc pas une intégration dans une architecture
existante : c'est la **construction de cette architecture**. Cela change
l'ampleur, le coût et l'ordre des étapes. Le détail est en §7.

Bonne nouvelle en revanche : **le contenu du package existe réellement et en
entier**. J'ai vérifié fichier par fichier (§6). Les promesses de la page
produit seront exactes.

---

## 1. L'intégration Stripe

**Elle n'existe pas.** Ni dépendance, ni clé, ni webhook, ni serveur.

```
$ grep -ril stripe src/            → 3 fichiers, tous du texte ou un champ vide
$ grep -ri "sk_\|pk_\|whsec_" .    → aucun résultat
```

`package.json` ne contient que React, React Router, Framer Motion, clsx,
Tailwind et Vite. Aucune dépendance Stripe, aucune dépendance serveur.

### Ce qui existe : une intention, et pour un autre modèle

[src/data/products.ts:33](src/data/products.ts) définit un champ, et le
commentaire d'en-tête décrit la marche à suivre prévue :

```
//   1. Créer un Payment Link dans le dashboard Stripe (attache les 7 PDF).
//   2. Coller l'URL dans `stripeUrl`.
//   3. Passer `active: true`.
```

Les quatre produits sont `active: false` et `stripeUrl: ""` :

| `id` | `courseName` | `price` | `active` |
|---|---|---|---|
| `package-calcul-differentiel` | Calcul différentiel | 49 | `false` |
| `package-calcul-integral` | Calcul intégral | 49 | `false` |
| `package-algebre-lineaire` | Algèbre linéaire | 49 | `false` |
| `package-probabilites-statistique` | Probabilités et statistique | 49 | `false` |

`getActiveProducts()` filtre sur `active && stripeUrl !== ""` : la boutique
est vide par construction, et c'est pour cela qu'on voit « La boutique arrive
bientôt ».

### Le point important

Le modèle prévu dans le code est un **Payment Link avec les PDF en pièces
jointes** — livraison par courriel, sans compte. C'est ce que raconte aussi la
page de confirmation : *« Les PDF ont été envoyés à l'adresse utilisée lors du
paiement »* ([src/pages/AchatConfirme.tsx:38](src/pages/AchatConfirme.tsx)).

Le modèle demandé — Checkout Session avec `metadata`, webhook, octroi d'accès
en base, contenu servi par URL signée — est **incompatible avec un Payment
Link tel qu'il est conçu ici**, et surtout il exige un serveur. Le champ
`stripeUrl` disparaîtra au profit d'un appel à une Cloud Function.

Rien n'est perdu : il n'y avait rien à défaire.

---

## 2. Le modèle d'accès

**Il n'existe pas.** Il n'y a pas d'utilisateur du tout.

| Cherché | Trouvé |
|---|---|
| Firebase / Firestore | 0 occurrence dans tout `src/` |
| Authentification (connexion, inscription, session) | aucune |
| Document utilisateur, profil, compte | aucun |
| Fonction de vérification d'accès | aucune |
| Règles de sécurité Firestore | aucun fichier |

Le site est intégralement public. Les exercices gratuits sont compilés dans le
bundle JavaScript ([src/data/exercises.ts](src/data/exercises.ts)) et servis à
tout le monde.

### Le « code de classe » n'existe pas non plus

La consigne dit : *« L'accès accordé doit être structurellement identique à
celui d'un code de classe, avec une simple différence de `source`. »*

J'ai cherché — `code de classe`, `codeClasse`, `classCode`, `licence`,
`groupe` — **il n'y a aucun mécanisme de ce genre dans le dépôt**. Les seules
occurrences de « groupe » et « classe » sont dans des énoncés de statistiques.

Ce n'est donc pas un modèle existant à imiter : c'est un modèle à concevoir.
Je le note parce que la consigne suppose un point de référence qui n'est pas
là, et je préfère le dire maintenant plutôt que d'inventer une structure en
prétendant m'aligner sur quelque chose.

La conséquence est plutôt favorable : je peux définir la forme une seule fois,
avec `source: 'achat' | 'code-classe'` dès le départ, pour que l'ajout des
codes de classe plus tard ne demande aucune migration.

Le seul endroit du site qui parle de licence enseignant est
[src/pages/Enseignants.tsx:10](src/pages/Enseignants.tsx) — `PRIX_LICENCE_MIN
= 400` — mais c'est un montant affiché dans un formulaire de contact, sans
aucune mécanique derrière.

---

## 3. La fonction de téléchargement

**Elle n'existe pas.** Aucun Cloud Storage, aucune URL signée, aucun `fetch`
vers un service de fichiers.

Le seul téléchargement du site est un lien statique, ajouté aujourd'hui :

| | |
|---|---|
| Fichier servi | `public/enseignants/echantillon.pdf` (30 pages, 529 ko) |
| Lien | [src/pages/Enseignants.tsx:18](src/pages/Enseignants.tsx) |
| Protection | aucune, et c'est voulu — c'est l'échantillon gratuit |
| Garde-fou | [scripts/verifier-fichiers-statiques.mjs](scripts/verifier-fichiers-statiques.mjs), le build échoue si le fichier manque |

Tout le reste du matériel — 43 PDF d'exercices et d'examens, 16 PDF de notes —
est aujourd'hui **hors du dépôt**, sur le poste local uniquement. C'est la
bonne situation de départ : rien de payant n'a jamais été publié, et la règle
« pas de contenu protégé dans le dépôt GitHub Pages » est déjà respectée.

---

## 4. La page Boutique actuelle

[src/pages/Boutique.tsx](src/pages/Boutique.tsx) — 135 lignes, un seul
composant local `Step`, plus [ProductCard](src/components/shop/ProductCard.tsx).

### Structure

| Lignes | Bloc | Devient quoi |
|---|---|---|
| 12–23 | Accroche : badge « Boutique », titre, sous-titre | conservé, **texte à corriger** (§4.1) |
| 25–32 | Grille de produits, affichée si `hasProducts` | remplacé par la page produit unique |
| 33–80 | Bloc « La boutique arrive bientôt » | **supprimé** |
| 82–107 | « Comment ça fonctionne ? » en 3 étapes | conservé dans l'esprit, **contenu faux** (§4.1) |
| 109–119 | Contact | **adresse personnelle à remplacer** (§4.2) |

`ProductCard` est une carte pleine couleur, une teinte par cours
(`indigo` pour le calcul différentiel), avec icône, badge, liste à puces,
prix et bouton. Elle reste utilisable pour la vue « une carte par cours »
quand il y aura plusieurs produits, mais la page produit demandée est
beaucoup plus riche : je ne compte pas la forcer dans ce moule.

### 4.1 Ce que la page affirme aujourd'hui et qui est faux

C'est le point le plus urgent, indépendamment de Stripe.

| Où | Texte actuel | Problème |
|---|---|---|
| [Boutique.tsx:21](src/pages/Boutique.tsx) | « un seul paiement, **accès à vie** » | faux depuis le passage à 12 mois |
| [Boutique.tsx:101](src/pages/Boutique.tsx) | Étape 3 : « **Accès à vie** » | idem |
| [Boutique.tsx:92](src/pages/Boutique.tsx) | « **Aucune inscription requise** » | contredit le flux demandé, où le compte est obligatoire |
| [Boutique.tsx:97](src/pages/Boutique.tsx) | « Les PDF arrivent dans ta boîte email » | décrit l'ancien modèle de livraison |
| [ProductCard.tsx:30](src/components/shop/ProductCard.tsx) | « **Accès à vie** au contenu du site » | faux |
| [AchatConfirme.tsx:66](src/pages/AchatConfirme.tsx) | « accessibles **à vie** » | faux |
| [products.ts:5](src/data/products.ts) | commentaire « Accès à vie » | faux |

**Cinq mentions d'accès à vie sur quatre fichiers**, pas seulement celle de
l'accroche. La consigne §10 dit « aucune mention d'accès à vie sur le site » :
il faudra les traiter toutes, y compris sur `/achat-confirme`.

### 4.2 Trois autres écarts avec les contraintes de contenu (§8)

**L'adresse personnelle est affichée à trois endroits** —
[Boutique.tsx:113](src/pages/Boutique.tsx),
[AchatConfirme.tsx:109](src/pages/AchatConfirme.tsx),
[Enseignants.tsx:27](src/pages/Enseignants.tsx) — sous la forme
`simonboileauenseignement@gmail.com`. La consigne demande une adresse au nom
du site. Il faudra en créer une (`info@mathpratique.ca` ou similaire) : je ne
peux pas la configurer moi-même.

**La mention de droit d'auteur ne correspond pas.**
[Footer.tsx:29](src/components/layout/Footer.tsx) affiche :

> © {année} MathPratique. Conçu pour les étudiants, par d'anciens étudiants.

Ce n'est pas `© 2026 MathPratique.ca. Tous droits réservés.`, et le pluriel
« d'anciens étudiants » décrit une équipe qui n'existe pas.

**Des témoignages fabriqués sont encore dans le dépôt.**
[src/data/testimonials.ts](src/data/testimonials.ts) contient quatre
témoignages avec noms inventés — « Priya N., L2 Mathématiques appliquées »,
« Marcus T., L3 Informatique ». Les mentions « L2 / L3 » sont d'ailleurs de la
nomenclature universitaire française, pas québécoise.

Ils **ne sont plus affichés** : [Testimonials.tsx](src/components/home/Testimonials.tsx)
ne rend plus que le titre. Mais ce titre subsiste sur la page d'accueil :

> « Approuvé par les étudiants qui préfèrent comprendre plutôt qu'apprendre par cœur »

C'est une preuve sociale sans preuve, au-dessus d'une section vide. La
consigne §4.7 et §10 est claire : pas de témoignage inventé, et une section
sans témoignage ne s'affiche pas. Le fichier de données devrait être vidé et
le titre retiré tant qu'il n'y a rien à montrer.

Dernier point lié : [src/data/stats.ts](src/data/stats.ts) affiche sur
l'accueil « **100 % gratuit, sans compte requis** ». Ça devient faux le jour
où un produit payant demande un compte.

---

## 5. Les conventions visuelles

Elles sont cohérentes et bien tenues. Tout est dans
[src/index.css](src/index.css), en Tailwind 4 avec un bloc `@theme` — pas de
`tailwind.config.js`. Il n'y a **aucune bibliothèque d'interface** : ni
shadcn, ni Radix, ni Headless UI. Les icônes sont des `<svg>` écrits à la
main, trait de 2 à 2,5, `strokeLinecap="round"`. Je n'introduirai rien.

### Typographie

| Rôle | Police | Usage |
|---|---|---|
| `--font-display` | **Outfit** | tous les titres, via `font-display`; `h1`–`h6` l'héritent, avec `letter-spacing: -0.02em` et `color: brand-900` |
| `--font-body` | **Work Sans** | corps de texte, `color: ink-700` |
| `--font-mono` | **JetBrains Mono** | mathématiques et code |

### Palette

- `brand-50` → `brand-950` : indigo (`#eef2ff` … `#1e1b4b`). `brand-600`
  (`#4f46e5`) est la couleur des boutons pleins, `brand-700` leur survol.
- `accent-300` → `accent-600` : vert (`#22c55e` en 500), usage ponctuel.
- `ink-600` / `ink-700` / `ink-900` : gris de texte.
- Le calcul différentiel a sa teinte propre dans la boutique : **`indigo-500`**
  ([ProductCard.tsx:5](src/components/shop/ProductCard.tsx)).

### Motifs récurrents à réutiliser

| Élément | Classes |
|---|---|
| Largeur de page | `.container-page` → `mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10` |
| Bouton principal | `rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-brand-700` |
| Bouton secondaire | `rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50` |
| Carte / encadré | `rounded-3xl border border-brand-100 bg-brand-50/40 p-8 sm:p-10` |
| Badge de section | `rounded-full bg-brand-100 px-4 py-1.5 text-sm font-semibold text-brand-700` |
| Pastille numérotée | `h-10 w-10 rounded-full bg-brand-600 font-display text-lg font-bold text-white` |
| Titre de page | `text-balance text-4xl font-bold sm:text-5xl` |
| Apparition au défilement | `<AnimatedSection delay={…}>` ([ui/AnimatedSection.tsx](src/components/ui/AnimatedSection.tsx)) |

`prefers-reduced-motion` est respecté globalement dans `index.css`. Le
`Navbar` est responsive avec un menu mobile. Aucune convention de mode sombre.

---

## 6. Le contenu du package existe — vérifié

C'est la partie où je peux être catégorique, parce que j'ai produit ce
matériel et que je viens de recompter les fichiers.

| Promesse de la §3 | Réalité | Verdict |
|---|---|---|
| Notes version étudiant **et** enseignant | 7 chapitres × 2 versions + 2 recueils complets = **16 PDF** | ✅ |
| Plus de 300 exercices classés | **305 exercices**, 7 chapitres, 3 niveaux, 14 PDF (recueil + solutions) | ✅ |
| Séries mélangées de révision | **5 séries** (A–E), 10 PDF | ✅ |
| 4 intras + 2 finaux, corrigés détaillés | **6 examens**, chacun en énoncé + corrigé + grille = 18 PDF | ✅ |
| Documents PDF téléchargeables | **59 PDF** au total, compilés et vérifiés | ✅ |
| **Accès en ligne** | **n'existe pas** | ❌ |

Les 305 exercices ont été vérifiés indépendamment par SymPy (248 vérifiables,
0 échec), les examens contrôlés pour le barème et l'absence de reprise, et
l'ensemble passe le contrôle de marque : aucun sigle, aucun établissement,
aucun nom de personne, texte comme métadonnées.

**Le seul élément non livrable aujourd'hui est l'accès en ligne au contenu
payant** — il n'existe aucun mécanisme pour le servir. C'est précisément ce
que la section « Ce qui est disponible aujourd'hui » (§4.3) doit dire.

L'export web existe (`sorties/web/index.json`) mais il est construit par
liste blanche et ne contient **que les exercices gratuits** — c'est ce qui
alimente déjà `/practice`.

### Une nuance sur l'aperçu gratuit (§4.5)

La consigne demande *« un chapitre complet en version étudiant »*. L'échantillon
publié aujourd'hui est en version **enseignant** — c'est le bon choix pour la
page `/enseignants`, qui s'adresse à des profs, mais pas pour la boutique.

Il faudra donc **un second PDF**, version étudiant. C'est une recompilation,
pas une rédaction : une demi-heure de travail, aucune difficulté.

---

## 7. Ce que l'implémentation demande réellement

Voici le point à trancher avant tout code. Les §5 à §7 de la consigne
supposent une infrastructure qui n'existe pas. La construire est faisable,
mais ce n'est pas un ajout à la marge.

### Ce qu'il faut créer de zéro

| # | Composant | Pourquoi il n'y a pas d'alternative |
|---|---|---|
| 1 | **Projet Firebase** | rien n'existe : ni projet, ni clés, ni règles |
| 2 | **Authentification** | l'achat doit être rattaché à un compte (§5.1) |
| 3 | **Firestore** + règles de sécurité | stocker l'accès et sa date de fin |
| 4 | **Cloud Function** création de session Checkout | une clé secrète Stripe ne peut pas vivre dans un site statique |
| 5 | **Cloud Function** webhook | vérification de signature, idempotence, octroi |
| 6 | **Cloud Storage** privé + URL signées | servir les 59 PDF sans les publier |
| 7 | **Cloud Function** de téléchargement | vérifier l'accès et la date à chaque demande |
| 8 | Pages **connexion / inscription / mon compte** | trois écrans qui n'existent pas |
| 9 | Bandeaux d'expiration à 30 et 7 jours | dépend de 3 |
| 10 | Indicateur « a téléchargé au moins un document » | dépend de 7 |

### Trois contraintes matérielles à connaître

**GitHub Pages ne sert que des fichiers.** Le front-end peut y rester, mais
les points 4 à 7 tournent ailleurs. Firebase Functions est le choix cohérent
avec la pile annoncée.

**Cloud Functions exige le forfait Blaze.** Le forfait gratuit Spark interdit
les appels réseau sortants, or le webhook doit joindre l'API Stripe. Il faut
donc une carte au dossier sur Firebase. Le coût réel restera négligeable à ce
volume, mais ce n'est plus zéro et c'est une décision, pas un détail technique.

**Aucun mécanisme d'envoi de courriel n'existe.** La consigne §6 le prévoyait :
*« s'il existe déjà un mécanisme d'envoi; sinon, signale-le-moi plutôt que
d'en construire un »*. Je le signale — **il n'y en a aucun**. Le rappel à
30 jours par courriel n'est pas réalisable sans en ajouter un (extension
Firebase « Trigger Email », ou un service tiers). Les bandeaux dans le site,
eux, ne posent aucun problème.

### Deux remarques sur la consigne elle-même

**Le prix dans la comparaison (§4.4).** La phrase demandée contient « 34 $ »
en toutes lettres, alors que §10 interdit de coder un prix ailleurs que dans
`TARIFS`. Je composerai la phrase à partir de la constante, pour qu'un
changement de prix ne laisse pas un montant périmé dans le texte.

**Le prix de lancement par code promotionnel (§5.3).** Un code promo Stripe
s'applique *dans* Checkout : le client voit 49 $ sur la page produit et 34 $
après avoir entré un code. Ce n'est pas ce que décrit §3, qui veut « 34 $
affiché, 49 $ barré à côté ». Pour obtenir cet affichage avec un rabais
désactivable sans déploiement, il faut soit **deux Price Stripe** et un
basculement, soit un coupon appliqué automatiquement à la session par la
Cloud Function. Je recommande la seconde : l'affichage reste honnête, le
rabais reste pilotable depuis le tableau de bord. À valider.

---

## 8. Plan d'intégration proposé

L'ordre suit tes points de contrôle, avec une modification : je propose de
**livrer la page produit statique en premier et de la mettre en ligne**, avant
toute infrastructure. Elle corrige déjà cinq mentions fausses, et elle ne
dépend de rien.

| Étape | Contenu | Dépendances | Peut être déployé seul |
|---|---|---|---|
| **A** — page produit | Sections 4.1 à 4.7, constantes `TARIFS` et « disponible aujourd'hui », bouton inactif. Correction des 5 « accès à vie », de l'adresse de contact, du pied de page, des témoignages inventés. Second échantillon en version étudiant. | aucune | **oui** |
| **B** — socle Firebase | Projet, authentification, Firestore, règles, pages connexion / inscription / mon compte, fonction unique `verifierAcces()` | forfait Blaze | non |
| **C** — paiement | Cloud Function Checkout, webhook signé et idempotent, octroi à 12 mois, tests de la §9 en mode test | B | non |
| **D** — contenu protégé | Cloud Storage privé, fonction de téléchargement contrôlant la date, indicateur de téléchargement, bandeaux 30 / 7 jours | B, C | non |
| **E** — production | Clés vivantes, webhook de production, vérification mobile complète | tout | — |

L'étape A seule règle le problème le plus visible : aujourd'hui, la boutique
promet un accès à vie qu'elle ne donnera pas.

---

## 9. Ce dont j'ai besoin de toi

Sept décisions. Les quatre premières bloquent l'étape B ; l'étape A peut
démarrer dès que tu valides les points 5 à 7.

1. **Firebase** — un projet existe-t-il déjà quelque part, ou faut-il le créer ?
   Acceptes-tu le passage au forfait Blaze, indispensable au webhook ?
2. **Adresse de contact au nom du site** — laquelle ? Elle doit exister avant
   que je remplace l'adresse personnelle à trois endroits.
3. **Le rappel par courriel à 30 jours** — aucun mécanisme d'envoi n'existe.
   Bandeaux dans le site seulement, ou j'en ajoute un (à te signaler avant) ?
4. **Le prix de lancement** — coupon appliqué automatiquement par la Cloud
   Function (affichage « 34 $, 49 $ barré » honnête et rabais désactivable
   sans déploiement), ou deux Price Stripe ? Ma recommandation : le coupon.
5. **Politique de remboursement** — je reprends ta proposition telle quelle :
   *remboursement complet dans les 7 jours suivant l'achat, si aucun document
   n'a été téléchargé*. Confirme, ou reformule.
6. **La section « disponible aujourd'hui »** — d'après l'inventaire §6, tout le
   contenu PDF est prêt ; seul l'accès en ligne manque. Confirmes-tu qu'on
   annonce les 59 PDF comme disponibles dès le premier jour, et l'accès en
   ligne comme « à venir » ? Avec quel mois indicatif ?
7. **Les témoignages inventés et la statistique « 100 % gratuit »** — je les
   retire ? Ils sortent du périmètre strict de la boutique, mais ils sont
   contraires à la §10 et ils sont en ligne en ce moment.

---

*© 2026 MathPratique.ca. Tous droits réservés.*
