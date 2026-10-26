# MathPratique.ca — notes pour Claude Code

## Historique des modifications de l'interface

### Bilan au 2026-10-26

**Périmètre.** Tout ce qui a changé à l'écran sur mathpratique.ca entre le
premier commit (2026-06-17) et le 2026-10-26. Le bilan initial, du 2026-10-20,
couvrait jusqu'au commit du 2026-10-15 ; il croisait trois sources : la
conversation de travail principale (101 demandes ayant touché l'interface),
`git log` (54 commits sur les fichiers d'interface) et `git status`.

**Mise à jour du 2026-10-23.** Ajout des changements du 20 au 23 octobre :
interrupteur de vente, catalogue, boutique, calculateur de note, navigation et
accueil. Les sections « Commencé, pas terminé », « Problèmes connus » et
« Prochaines étapes » sont remises à jour à la même date.

**Mise à jour du 2026-10-26.** Corrections de la page d'accueil (prix,
chiffres dérivés des données, section Boutique, libellé de travail),
pied de page, nom « Probabilités et statistique » au singulier, et trois
pages légales en brouillon. Ajout de la section « À régler avant
l'ouverture des ventes ».

**Vérifié en ligne le 2026-10-26**, après le déploiement GitHub Pages
réussi de ces corrections, en lisant ce que sert réellement
mathpratique.ca :

- accueil pré-rendu : les nouveaux chiffres (708, trois matières, « 0 $ »),
  la phrase des matières, les badges (« 69 gratuits · 398 avec le
  package », « 100 exercices gratuits »), la section Boutique (398
  exercices, 12 mois, 34 $ et 49 $, « L'achat en ligne ouvre bientôt »,
  mention aux enseignants) et la nouvelle phrase de l'appel à l'action ;
- aucune ancienne formulation : ni « paywall », ni « 100 % gratuit », ni
  « mathpratique.exemple », ni « 4 matières », ni « statistiques » au
  pluriel ;
- pied de page : Accueil, Exercices, Calculateur de note finale, Boutique,
  Enseignants, Contact — aucun lien vers les pages légales ;
- boutique inchangée : un package en vente, trois cartes « Bientôt
  disponible » ;
- les trois pages légales s'ouvrent en ligne avec leur bandeau, le titre
  « (brouillon) », `noindex` et tout leur texte ; elles ne sont pas dans le
  plan du site. Leur statut HTTP est 404 (voir la section des pages
  légales) ; tous les fichiers chargés derrière répondent 200.

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
- **2026-10-23** — `CarteCalculateur.tsx` (nouveau) : une carte « Fin de
  session? Calcule la note qu'il te faut », juste sous le bandeau, mène au
  calculateur de note. Elle est remontée dans la marge basse du bandeau.
  *Raison : sans cela, près de 190 px de vide la séparaient du bouton du
  bandeau.*
- **2026-10-26** — chiffres de l'accueil dérivés des données
  (`src/data/compteurs.ts`, calcul pur testé ; câblage dans `stats.ts`) :
  - le bandeau affiche « 708 exercices corrigés gratuits dans trois
    matières » au lieu de « 539 exercices dans 4 matières » ;
  - la 4ᵉ case passe de « 100 % gratuit, sans compte requis » à « 0 $ — pour
    commencer, sans compte. Un package complet est offert en option. » ;
  - la phrase des matières (`TopicsShowcase.tsx`) devient « Trois matières du
    parcours collégial, et une autre en préparation ».

  Règles : une matière « À venir » n'est ni disponible ni comptée, et seuls
  les exercices réservés d'un cours **en vente** comptent « avec le
  package ». *Raisons : « 539 » ne comptait que l'algèbre linéaire, les
  « 4 matières » incluaient Calcul intégral, et « 100 % gratuit » était faux
  depuis qu'un package payant existe.*
- **2026-10-26** — `CallToAction.tsx` : « Pas d'inscription, pas de
  paywall » devient « Des centaines d'exercices corrigés gratuits, sans
  compte. Pour aller plus loin, un package complet est offert en option. »
  L'ordre de grandeur (« Des centaines d'… », « Plus de mille… ») suit le
  nombre réel.
- **2026-10-26** — `SectionBoutique.tsx` (nouveau), avant l'appel à l'action
  final : le package de chaque cours en vente (aujourd'hui Calcul
  différentiel seulement), avec notes complètes, nombre d'exercices avec
  démarches, examens corrigés, accès de 12 mois, prix de lancement et prix
  régulier lus dans `tarifs.ts`. Tant que `VENTE_OUVERTE` vaut `false`, une
  ligne dit « L'achat en ligne ouvre bientôt ». Lien vers la boutique, et
  mention neutre vers la page Enseignants.
- **2026-10-26** — `Hero.tsx` : le libellé de travail « mathpratique.exemple »,
  visible en haut à droite de l'exemple animé, est retiré.

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
- **2026-10-23** — `Footer.tsx` : ajout du lien « Calculateur de note
  finale ».
- **2026-10-26** — `Footer.tsx` : ajout des liens Boutique, Enseignants et
  Contact (`mailto:` vers l'adresse de `src/data/site.ts`). Les liens vers les
  trois pages légales ne sont **pas** encore ajoutés : ils viendront après
  révision (un test le vérifie).
- **2026-10-23** — `Navbar.tsx` :
  - ajout de l'entrée « Calculateur », entre « Quiz personnalisé » et
    « Boutique », marquée active sur sa page ;
  - les liens en ligne apparaissent à partir de 1024 px (`lg`) au lieu de
    640 px (`sm`) ; en dessous, c'est le menu déroulant ;
  - pour tenir à 1024 px sans réduire le texte : « Quiz » dans la barre (le
    nom complet reste dans le menu déroulant, sur la page et pour les lecteurs
    d'écran), marge intérieure des liens de 16 à 12 px, aucun retour à la
    ligne ;
  - marge libre mesurée à 1024 px : 71 px avec « Connexion », 56 px avec
    « Mon compte ».

  *Raisons : la barre débordait déjà entre 640 et 900 px environ, même sans le
  calculateur ; et beaucoup de portables Windows affichés à 125 % ou 150 % ont
  une largeur utile entre 1024 et 1279 px, où un menu déroulant serait
  malvenu.*

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
- **2026-10-26** — `topics.ts` : la matière s'appelle « Probabilités et
  statistique » (au singulier) sur toutes les cartes. Sa carte affiche
  « 100 exercices gratuits » au lieu de « 100 gratuits · 475 avec le
  package ». *Raison : aucun package de cette matière ne s'achète ;
  « avec le package » n'apparaît plus que pour un cours en vente.*

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

#### Outils — `CalculateurNoteFinale.tsx`, `src/outils/note-finale.ts`

- **2026-10-23** — nouvelle page `/outils/note-examen-final`, « Quelle note me
  faut-il à l'examen final? ». Elle est gratuite, sans compte et sans appel
  réseau :
  - l'étudiant entre seulement ses évaluations déjà faites ; tout le reste,
    examen final compris, forme « ce qui reste » (encadré « Il te reste X % du
    cours à évaluer ») ;
  - le résultat est la moyenne requise sur ce qui reste, arrondie vers le haut
    au dixième, suivie d'un tableau « si tu obtiens en moyenne 50 à 100 % » ;
  - cas particuliers : plus de 100 % évalués (erreur, aucun calcul), 100 %
    (« Ton cours est terminé »), objectif déjà atteint, objectif impossible
    (avec la note maximale atteignable) ;
  - « Détailler ce qui reste », repliable et facultatif, sert au seuil de 60 %
    de moyenne d'examens. Ce seuil n'est calculé que si le détail couvre
    exactement ce qui reste (à 0,05 % près) ;
  - la saisie est gardée dans `localStorage` (clé `…:v2`), avec un bouton
    « Réinitialiser » ;
  - la page est pré-rendue, avec titre et description propres, et figure dans
    le plan du site. Le calcul est couvert par `tests/note-finale.test.mjs`.

  *Raisons : une première version, jamais publiée, ne comptait que le final
  comme reste du cours et déclarait impossible un objectif atteignable (20 %
  d'évaluations faites, final à 30 %). Et un seuil calculé sur un détail
  partiel affichait 63,8 % là où l'exigence réelle était de 61,4 %.*

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
- **2026-10-20** — `PAIEMENT_ACTIF` découle maintenant de `VENTE_OUVERTE`
  (`src/acces/vente.ts`, à `false`), que `creerSessionCheckout` vérifie aussi
  côté serveur. Le bouton reste actif en développement local pour les tests.
  *Raison : un seul interrupteur pour le site et la fonction.*
- **2026-10-22** — « Disponible maintenant » annonce le méli-mélo du
  chapitre 5. La consultation en ligne est annoncée pour « Octobre 2026 ».
  *Raison : la date de septembre était dépassée.*
- **2026-10-26** — sans changement visible : la liste des packages en vente
  quitte `Boutique.tsx` pour `src/data/boutique.ts`, que l'accueil lit aussi.
  Ajouter un cours en vente se fait là.

#### Pages légales, en brouillon — `src/components/legal/PageBrouillon.tsx`

- **2026-10-26** — trois pages créées comme **brouillons**, à faire réviser :
  `/politique-de-remboursement`, `/conditions-d-utilisation` et
  `/politique-de-confidentialite` (Loi 25 : comptes, paiements Stripe,
  Google Analytics). Chacune :
  - affiche un bandeau « Brouillon — en attente de révision » ;
  - porte `noindex` pendant qu'on la consulte, et rend titre, description et
    robots d'origine en la quittant ;
  - n'est ni pré-rendue, ni dans le plan du site, ni liée au pied de page ;
  - lit délais, durée d'accès, devise et adresse dans leurs constantes.

  Les points à faire réviser sont en commentaires au début de chaque page,
  pas dans le texte affiché. À la validation : prop `brouillon={false}`,
  ajout au pré-rendu, puis lien au pied de page.

  **Statut HTTP 404, attendu.** Une page non pré-rendue n'a pas de fichier
  sur GitHub Pages : le serveur répond par `404.html`, copie de
  l'application, qui affiche ensuite la bonne page. La page s'affiche donc
  normalement, mais avec un statut 404 et une erreur « Failed to load
  resource » dans la console. Sans conséquence pour des brouillons en
  `noindex` ; l'ajout au pré-rendu, à la validation, donnera un statut 200.

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
- **2026-10-20 ◆** — liste des documents : ajout de la série méli-mélo du
  chapitre 3 de probabilités et statistique (énoncés et solutions).
- **2026-10-22** — liste des documents : ajout de la série méli-mélo du
  chapitre 5 de calcul différentiel (recueil et solutions), ouverte aux trois
  niveaux d'accès. Ces deux PDF sont le seul accès, sur le site, à ses
  cinquante exercices.

#### Contenu servi, sans changement de code

- Banque de calcul différentiel : des exercices s'ajoutent aux chapitres 1, 2
  et 3 (du 2026-08-24 au 2026-09-22). Le chapitre 4 présente les deux méthodes
  (2026-10-06). Le chapitre 5 est adapté aux notes réorganisées, avec
  correction de la formule d'E047 (2026-10-15).
- Les PDF des notes, des cahiers et des recueils sont republiés dans le seau le
  2026-10-15.
- Les deux PDF du méli-mélo du chapitre 5 sont téléversés le 2026-10-22, MD5
  vérifiés dans le seau. ◆ Ceux du méli-mélo du chapitre 3 de probabilités et
  statistique le sont le même jour.

### Commencé, pas terminé

- **« Quiz à partir de mes notes » ◆** : le tirage par section, le catalogue de
  notions et la fonction `analyserNotes` sont commités, y compris, depuis le
  2026-10-23, les garde-fous sur la clé de l'API qui étaient en cours au
  2026-10-20. L'interface (la liste de notions à cocher) n'existe pas encore,
  et `analyserNotes` n'est pas déployée.
- **Vente** : `VENTE_OUVERTE` vaut `false` ; `creerSessionCheckout` refuse
  aussi côté serveur et reste privée. Aucun achat réel n'a été fait.
- **Migration vers Firebase Hosting** : le bloc `hosting` de `firebase.json`
  existe, et un déploiement de test a été vérifié sur
  `mathpratique-8dea1.web.app` (2026-10-20). Restent le compte de service et
  le secret GitHub pour le déploiement automatique, puis la bascule du
  domaine, puis le passage du dépôt en privé.
- **Calcul intégral** : « À venir », sans banque interactive. **Algèbre
  linéaire** : encore servie par `exercises.ts` ; sa carte en boutique est
  inerte.
- **Pages légales** : trois brouillons à faire réviser (2026-10-26), puis à
  publier : retirer le bandeau, les pré-rendre, les lier au pied de page.
- **Adresses en français** (plan approuvé, gardé pour plus tard, rien de
  changé) : `/practice` → `/exercices`, `/custom-quiz` → `/quiz-personnalise`,
  `/quiz` inchangée (les quiz partagés y vivent : `/quiz?custom=…`). Les
  anciennes adresses doivent rester valides : redirection React qui garde
  les paramètres, pages de redirection pré-rendues aux anciennes adresses
  (adresse canonique vers la nouvelle), plan du site avec les nouvelles
  seulement, liens internes mis à jour, puis vraies redirections 301 dans
  `firebase.json` après la migration.

### À régler avant l'ouverture des ventes

- **Consentement à Google Analytics (Loi 25)** : GA est chargé d'office dans
  `index.html`, sans consentement préalable. La Loi 25 exige que les
  technologies permettant d'identifier, de localiser ou d'effectuer un
  profilage soient désactivées par défaut. Prévoir un mécanisme de
  consentement, puis ajuster la section 6 de la politique de confidentialité.
- **Pages légales révisées et liées** au pied de page (voir plus haut), avec
  l'évaluation d'impact sur la confidentialité (EFVP) pour les
  communications hors Québec (Stripe, Google Analytics, Firebase
  Authentication), et la désignation de l'exploitant exigée pour un contrat
  conclu à distance. Les points précis sont en commentaires au début de
  chaque page.

### Problèmes connus

- Le dépôt est encore public jusqu'à la fin de la migration vers Firebase
  Hosting : ce fichier, le code et les banques servies au site y sont lisibles.
  La décision de le passer en privé est prise depuis le 2026-10-20.
- Six problèmes ESLint dans les deux pages d'exercices (voir
  `DETTE-TECHNIQUE.md`, entrée du 2026-09-10).
- Les exercices CD-C03-E034 et E035 sont à reformuler.
- Les adresses canoniques et le plan du site donnent les pages sans barre
  finale (`/enseignants`), que GitHub Pages redirige vers la forme avec barre
  (`/enseignants/`). C'est sans gravité, mais à harmoniser, au plus tard lors
  de la bascule vers Firebase Hosting.

Réglé : le 403 de `webhookStripe` (2026-10-20). L'accès public est maintenant
déclaré dans le code, et un événement de test Stripe a été reçu avec un 200.
`creerSessionCheckout` répond toujours 403, mais volontairement : elle reste
privée jusqu'à l'ouverture de la vente.

### Prochaines étapes suggérées

1. Terminer la migration vers Firebase Hosting, puis passer le dépôt en privé.
2. Régler la section « À régler avant l'ouverture des ventes ».
3. Faire l'achat réel de `TESTS-ACHAT.md`, puis ouvrir la vente : passer
   `VENTE_OUVERTE` à `true`, déployer `creerSessionCheckout` et la rendre
   publique (voir `TESTS-ACHAT.md`, § 4.5).
4. Construire l'interface de « Quiz à partir de mes notes ».
5. Régler la dette ESLint, puis reformuler E034 et E035.
6. Passer les adresses en français, selon le plan ci-dessus.
