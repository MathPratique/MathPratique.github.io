# MathPratique.ca — notes pour Claude Code

## Historique des modifications de l'interface

### Bilan au 2026-10-20

**Périmètre.** Tout ce qui a changé à l'écran sur mathpratique.ca entre le
premier commit (2026-06-17) et le dernier (2026-10-15). Aucun commit
d'interface depuis. Trois sources croisées : la conversation de travail
principale (101 demandes ayant touché l'interface), `git log` (54 commits sur
les fichiers d'interface) et `git status` du 2026-10-20.

**Légende.** Sans marque : fait dans la conversation principale. **◆** : fait
hors de cette conversation (autre session Claude ou commit direct du
propriétaire) ; la raison vient alors du message de commit. Les dates sont
celles des commits.

#### Accueil — `src/pages/Home.tsx`, `src/components/home/`

- **2026-06-20** — `Hero.tsx` : le bouton principal devient « Choisir une
  matière » et « Parcourir les matières » disparaît. *Raison : un seul chemin
  vers les exercices.*
- **2026-06-20** — `Features.tsx` : « Niveau universitaire » devient « Niveau
  collégial et universitaire ».
- **2026-06-26** — `Testimonials.tsx` : le titre « Approuvé par les
  étudiants » reste, mais les témoignages fictifs sont retirés.
- **2026-06-27** — `TopicsShowcase.tsx` : les cartes de matières prennent les
  mêmes couleurs que sur la page Exercices.
- **2026-08-02 ◆** — `Hero.tsx`, `Features.tsx`, `CallToAction.tsx`,
  `TopicsShowcase.tsx` : le registre est uniformisé (tutoiement pour les
  étudiants, vouvoiement pour les enseignants).
- **2026-08-02** — `Features.tsx`, `TopicsShowcase.tsx`, `index.html` : le site
  vise désormais le collégial seulement, et la méta-description nomme les vraies
  matières. *Raison : le matériel suit le programme collégial ; viser deux
  publics n'en servait aucun.*
- **2026-08-14** — `Hero.tsx`, `TopicsShowcase.tsx` : le bandeau de chiffres
  agrégés disparaît et l'accueil parle de « Trois matières ». Chaque carte porte
  maintenant son propre compteur, et Calcul intégral revient avec la mention
  « À venir ». *Raison : un acheteur voyait « 65 sur 305 », et une carte vide
  côtoyait le package mis en vente.*

#### Navigation et gabarit — `Navbar.tsx`, `Footer.tsx`, `Layout.tsx`, `index.html`

- **2026-06-20** — `index.html` : ajout de la mesure d'audience Google
  Analytics.
- **2026-06-20** — `Navbar.tsx` : le bouton « Commencer » est retiré ; seuls
  Accueil et Exercices restent.
- **2026-06-23 / 07-09 / 07-30** — `Navbar.tsx` : ajout des onglets « Quiz
  personnalisé », « Boutique » et « Enseignants ».
- **2026-07-07** — `Footer.tsx` : la phrase qui présentait le site comme fait
  par des étudiants est corrigée. *Raison : c'était faux.*
- **2026-08-02 ◆** — `Navbar.tsx` : ajout de l'accès au compte. Dans
  `Layout.tsx`, `BandeauExpiration.tsx` affiche sur toutes les pages un rappel
  30 jours, puis 7 jours, avant la fin de l'accès. *Raison : le site n'a aucun
  envoi de courriel, et deux rappels par an ne justifient pas d'en ajouter un.*

#### Exercices : choix de la matière et cartes — `Practice.tsx`, `TopicPicker.tsx`, `ExerciseCard.tsx`, `MCQCard.tsx`, `TFCard.tsx`

- **2026-06-20** — `Practice.tsx`, `TopicPicker.tsx` (nouveau), `TopicFilter.tsx`
  (supprimé) : l'étudiant choisit d'abord une matière parmi de grandes cartes
  colorées, et un bouton « ← Changer de matière » permet de revenir.
  « Toutes les matières » n'existe plus. *Raison : demande explicite.*
- **2026-06-20 → 07-09** — Algèbre linéaire et probabilités (`exercises.ts`,
  `lessons.ts`, `RichContent.tsx`, `Matrix.tsx`, `LessonNav.tsx`) :
  - ajout de thèmes, de QCM et de vrai-ou-faux dans chaque leçon ;
  - flèches sur les vecteurs, notation de la projection, flèches sur i, j, k
    dans les déterminants ;
  - vocabulaire des positions relatives (« parallèles », « équations
    paramétriques ») ;
  - plus de numéros de chapitre dans la navigation des leçons.
- **2026-06-26** — `MCQCard.tsx` : l'ordre des choix est mélangé. *Raison : la
  bonne réponse était toujours la première.*
- **2026-07-24 → 07-26** — probabilités et statistique : ajout de 4 chapitres de
  97 exercices numérotés. Seule la case « Statistiques descriptives » reste dans
  le menu.
- **2026-07-25** — cartes :
  - les niveaux s'appellent désormais Facile, Moyen et Difficile (au lieu de
    Fondamental, Intermédiaire et Avancé), en vert, jaune et rouge ;
  - ajout d'une pastille « Exercice #N » ;
  - la réponse peut s'étendre sur plusieurs lignes.
- **2026-07-30** — `Practice.tsx` : ajout d'un lien vers la page Enseignants.
- **2026-08-03** — cartes : les figures SVG s'affichent sous l'énoncé, et les
  formules des réponses sont rendues en KaTeX.
- **2026-08-13** — `Mathematiques.tsx`, `ContenuExercice.tsx` : le HTML des
  banques est interprété par défaut. *Raison : `\dfrac`, `<em>` et d'autres
  balises s'affichaient tels quels.*
- **2026-08-14** — `TopicPicker.tsx`, `topics.ts` : le compteur est uniformisé
  (« X exercices »). Un cours en vente affiche « X gratuits · Y avec le
  package », et Calcul intégral affiche « À venir » sans être cliquable.
- **2026-08-14** — `latex-vers-html.ts` : le `~` des espaces insécables ne
  s'affiche plus comme une petite vague entre le nombre et l'unité.
- **2026-08-29 ◆** — `exercises.ts` : les 388 exercices de probabilités copiés
  à la main sont retirés ; c'est la banque qui les fournit. *Raison : la copie
  était figée (le chapitre 2 restait à 97 exercices au lieu de 160).*
- **2026-09-10 ◆** — `topics.ts` et les pages concernées : les compteurs sont
  lus dans le catalogue. *Raison : « 65 / 305 » restait affiché alors que la
  banque comptait 70 / 395.*

#### Exercices de calcul différentiel — `ExercicesCalculDifferentiel.tsx`, `CarteExerciceCD.tsx`, `QcmInteractif.tsx`

- **2026-08-02 ◆** — la page est alimentée par la banque : 65 exercices
  gratuits (21 %), les autres apparaissent comme fiches verrouillées. *Raison :
  la page n'affichait qu'un seul exercice, écrit à la main.*
- **2026-08-08** — QCM cliquables avec une explication pour chaque choix, lien
  vers la section des notes, encadré « piège courant », et figures rétablies.
- **2026-08-13** — `useExercicesComplets.ts` : un acheteur voit toute la banque
  (servie par `obtenirExercices`), un visiteur voit seulement les gratuits.
- **2026-08-13 / 08-20** — suivi de la progression, pour un compte qui a
  l'accès :
  - boutons « Complété » et « À revoir » sur chaque carte ;
  - filtre Tous / Complétés / Non complétés / À revoir, et compteur par
    chapitre ;
  - la liste reste figée tant qu'on ne change pas de filtre.

  *Raisons : un exercice ne doit pas disparaître sous le doigt ; et Firestore
  refusait en silence certaines sauvegardes.*
- **2026-08-14** — un visiteur anonyme voyait une page vide : une animation
  d'apparition restait bloquée à l'opacité 0. C'est corrigé. *Raison : c'est la
  vitrine, et la page indexée.*
- **2026-08-14** — pendant la vérification de l'accès, une phrase neutre
  remplace le compteur, qui était faux à ce moment-là.
- **2026-08-14** — le contenu se rafraîchit quand la banque change
  (comparaison d'empreinte). *Raison : la page produit promet les mises à
  jour.*
- **2026-08-31 ◆** — le compteur de chaque chapitre est calculé sur la liste
  des exercices affichés (`compteParmi`).
- **2026-09-01** — le badge « · N min » (temps estimé) est retiré des cartes,
  dans les deux cours.
- **2026-09-30** — la pastille de niveau est retirée pour le calcul différentiel
  seulement (prop `afficherNiveau`), y compris dans `Hero.tsx`.

#### Exercices de probabilités et statistique — `ExercicesProbabilitesStatistique.tsx`

- **2026-08-29 ◆** — nouvelle page, servie par la banque avec la même mécanique
  que le calcul différentiel.
- **2026-08-31 ◆** — 100 exercices sont ouverts, tirés par strates. *Raison :
  tout était réservé, et la vitrine était vide.*
- **2026-08-31 ◆** — un clic sur un QCM faisait apparaître un écran blanc. C'est
  corrigé. *Cause : l'explication manquait dans 64 QCM sur 83.*
- **2026-09-10 ◆** — un sigle de cours est retiré de la méta-description
  indexée.

#### Quiz et quiz personnalisé — `Quiz.tsx`, `CustomQuiz.tsx`, `src/quiz/`

- **2026-06-23** — nouvelle page : on choisit les leçons et le nombre de
  questions, et les questions sont générées aléatoirement pour chaque leçon.
- **2026-06-26** — nouveau libellé : « exercices calculatoires (CALC), questions
  à choix multiples (QCM) et vrai ou faux (V/F) ».
- **2026-06-30** — on choisit la matière en premier.
- **2026-07-27** — le quiz est ouvert aux probabilités et statistique, avec un
  filtre de difficulté.
- **2026-08-03 / 08-13** — le quiz est ouvert au calcul différentiel (7
  chapitres, choix de la difficulté, rendu KaTeX), avec un tirage dans la
  banque.
- **2026-08-14** — Calcul intégral apparaît avec la mention « À venir », sans
  pouvoir être choisi.
- **2026-10-15 ◆** — le tirage peut se faire par section, et plus seulement par
  chapitre ; les adresses déjà partagées fonctionnent toujours. *Raison :
  préparer « Quiz à partir de mes notes ».*

#### Boutique — `Boutique.tsx`, `BoutiqueCalculDifferentiel.tsx`, `CarteBoutique.tsx`, `AchatConfirme.tsx`, `products.ts`, `tarifs.ts`

- **2026-07-09** — création de la section Boutique (quatre produits
  provisoires, packs Intra et Final) et de la page de confirmation d'achat.
- **2026-07-27** — un seul package par cours, à 49 $, sans vidéos. La
  confirmation devient un message simple avec un bouton vers les exercices.
- **2026-07-31 ◆** — page produit Calcul différentiel : contenu, état de la
  livraison, comparaison, aperçu gratuit et questions fréquentes. « Accès à
  vie » devient « 12 mois » partout. *Raison : le texte n'avait jamais suivi le
  changement de modèle.*
- **2026-08-02** — l'aperçu PDF passe en version enseignant, et le bogue
  `\textbf` est corrigé. ◆ L'aperçu n'annonce plus de nombre d'exercices.
- **2026-08-02 ◆** — le bouton d'achat est branché sur Stripe, derrière
  l'interrupteur `PAIEMENT_ACTIF`, resté à `false`.
- **2026-08-03** — la boutique devient une grille de 4 cartes : Calcul
  différentiel est cliquable, les trois autres sont inertes. Prix affiché :
  34 $ (49 $ barré) CAD. La page `/boutique/calcul-differentiel` a un bouton
  « Retour à la boutique ».
- **2026-08-03 / 08-14** — `AchatConfirme.tsx` : le délai d'attente passe à
  3 minutes, avec un message qui évolue. *Raison : démarrage à froid de la
  fonction et délai variable du webhook Stripe.*
- **2026-08-06 → 08-07** — `PAIEMENT_ACTIF` est passé à `true` pour les tests
  locaux, puis remis à `false`.
- **2026-09-24** — la page ne mentionne plus les cinq séries de révision
  retirées.

#### Enseignants — `Enseignants.tsx`

- **2026-07-30** — nouvelle page `/enseignants`, avec un formulaire (Formspree)
  et un PDF d'échantillon (régénéré le 2026-08-02 et le 2026-09-01).

#### Compte — `Connexion.tsx`, `MonCompte.tsx`, `AuthContext.tsx`

- **2026-08-02 ◆** — création des pages Connexion et Mon compte : création de
  compte, accès de 12 mois et téléchargements protégés.
- **2026-08-17** :
  - les liens de vérification et de réinitialisation ramènent à `/connexion` ;
  - un courriel de vérification part à l'inscription ;
  - Mon compte affiche « ton accès arrive sous peu », sans date ;
  - la connexion par Google est retirée.
- **2026-08-20** — à l'inscription, ajout d'un bloc sur la protection des
  renseignements personnels : le titre et l'usage du courriel restent visibles,
  le reste est derrière « En savoir plus ». *Raison : en 375 × 667, le bloc
  entièrement déplié poussait le bouton hors de l'écran.*
- **2026-08-20** — Mon compte : les documents sont filtrés par niveau d'accès
  (restreint, acheteur, enseignant). Le PDF se télécharge au lieu de s'ouvrir,
  et l'étudiant reste sur la page.
- **2026-09-24 → 10-05** — liste des documents : la série de révision
  cumulative est ajoutée ; les cinq méli-mélos et les sept cahiers d'indices
  sont retirés (les indices sont maintenant dans le corrigé).

#### Contenu servi, sans changement de code

- Banque de calcul différentiel : des exercices s'ajoutent aux chapitres 1, 2
  et 3 (du 2026-08-24 au 2026-09-22). Le chapitre 4 présente les deux méthodes
  (2026-10-06). Le chapitre 5 est adapté aux notes réorganisées, avec
  correction de la formule d'E047 (2026-10-15).
- Les PDF des notes, des cahiers et des recueils sont republiés dans le seau le
  2026-10-15.

### Commencé, pas terminé

- **« Quiz à partir de mes notes » ◆** : le tirage par section, le catalogue de
  notions et la fonction `analyserNotes` sont commités. Au 2026-10-20,
  `functions/src/index.ts` et `functions/src/notes/modele.ts` ont des
  modifications non commitées. L'interface (la liste de notions à cocher)
  n'existe pas encore.
- **Vente** : `PAIEMENT_ACTIF` vaut `false`, et aucun achat réel n'a été fait.
- **Calcul intégral** : « À venir », sans banque interactive. **Algèbre
  linéaire** : encore servie par `exercises.ts` ; sa carte en boutique est
  inerte.

### Problèmes connus

- `creerSessionCheckout` et `webhookStripe` répondent 403 (couche IAM de Google,
  avant même le code) depuis la vérification du 2026-10-05. On ne sait pas si
  le problème date d'avant ou d'après la migration vers Node 24. Tant qu'il
  n'est pas réglé, le bouton d'achat échouerait.
- Six problèmes ESLint dans les deux pages d'exercices (voir
  `DETTE-TECHNIQUE.md`, entrée du 2026-09-10).
- La visibilité du dépôt est à trancher avant d'ouvrir les paiements.
- Les exercices CD-C03-E034 et E035 sont à reformuler.

### Prochaines étapes suggérées

1. Trancher la visibilité du dépôt.
2. Diagnostiquer le 403 de `creerSessionCheckout` et de `webhookStripe`.
3. Faire l'achat réel de `TESTS-ACHAT.md`, puis passer `PAIEMENT_ACTIF` à
   `true`.
4. Construire l'interface de « Quiz à partir de mes notes ».
5. Régler la dette ESLint, puis reformuler E034 et E035.
