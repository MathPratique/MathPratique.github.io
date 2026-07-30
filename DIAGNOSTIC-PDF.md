# Diagnostic — le PDF téléchargé est vide

Cours de référence : **Calcul différentiel**.

---

## Résumé

**Il n'y a aucune génération de PDF dans ce dépôt.** Le bouton est un lien
statique vers un fichier qui n'a jamais été déposé. GitHub Pages répond par la
page d'accueil du site, et le navigateur enregistre ce HTML sous le nom
`echantillon.pdf`. Le lecteur de PDF ouvre alors un fichier qui n'en est pas
un, et affiche du vide.

Le correctif tient en une phrase : **déposer le fichier**. Il n'y a ni
bibliothèque à corriger, ni rendu à synchroniser, ni asynchronisme à dompter.

---

## 1. Où est le bouton

| | |
|---|---|
| Fichier | `src/pages/Enseignants.tsx`, composant `Echantillon()`, ligne 158 |
| Page | `/enseignants` — « Voyez le matériel avant de vous décider » |
| Libellé exact | **Télécharger l'échantillon (PDF)** |

```tsx
const PDF_ECHANTILLON = "/enseignants/echantillon.pdf";   // ligne 18

<a href={PDF_ECHANTILLON} download className="...">
  Télécharger l'échantillon (PDF)
</a>
```

C'est **le seul** bouton de téléchargement du site. `AchatConfirme.tsx` parle
de PDF, mais pour dire qu'ils arrivent par courriel — aucun lien, aucun
téléchargement.

---

## 2. Ce qu'il est censé produire

D'après le commentaire du code (ligne 16) et le texte de la page :

> Un chapitre complet en version enseignant, plus une dizaine d'exercices avec
> leurs démarches détaillées. Aucune inscription demandée, aucun courriel à
> laisser.

C'est un **échantillon commercial gratuit**, délibérément sans authentification.
Le commentaire précise même l'emplacement attendu : *« Le fichier doit être
déposé dans `public/enseignants/`. »* Il ne l'a jamais été.

---

## 3. Comment le PDF est généré actuellement

**Il ne l'est pas.**

| Question | Réponse |
|---|---|
| Bibliothèque PDF | aucune — ni `jspdf`, ni `html2canvas`, ni `pdfmake`, ni `pdf-lib`, ni Puppeteer |
| Côté client ou serveur | ni l'un ni l'autre : simple lien `<a download>` vers un fichier statique |
| Source de données | aucune |

`package.json` ne contient que React, React Router, Framer Motion, clsx,
Tailwind et Vite. **Aucune dépendance PDF.**

### La pile décrite dans la demande ne correspond pas au dépôt

Ces écarts changent la nature du travail, et je préfère les signaler tout de
suite plutôt que d'échafauder une solution sur des prémisses fausses.

| Annoncé | Réalité du dépôt |
|---|---|
| Firebase / Firestore | **absent** — aucune dépendance, aucun import, aucune Cloud Function |
| Stripe | présent en **intention seulement** : `products.ts` contient un champ `stripeUrl` vide et les quatre produits sont `active: false`. Aucun produit n'est en vente. |
| KaTeX | **absent** — les mathématiques sont rendues par un composant maison, `src/components/ui/RichContent.tsx`, en HTML et CSS |
| Contrôle d'accès | **inexistant** — aucune authentification nulle part |

La livraison des achats est décrite dans `AchatConfirme.tsx` comme se faisant
**par courriel**, pièces jointes envoyées par Stripe. Il n'y a donc, à ce jour,
aucun téléchargement authentifié à réparer.

---

## 4. Pourquoi le document est vide — la cause réelle

### La chaîne complète

1. `public/enseignants/` **n'existe pas**. Le dossier `public/` ne contient que
   `favicon.svg` et `_redirects`.
2. Le déploiement copie l'accueil en page 404 :
   ```yaml
   - name: Copier index.html en 404.html pour le routage SPA
     run: cp dist/index.html dist/404.html
   ```
   C'est le comportement voulu pour une application à page unique : n'importe
   quelle URL inconnue doit rendre l'application React.
3. Le navigateur demande `/enseignants/echantillon.pdf`. GitHub Pages ne
   trouve rien et sert `404.html`, c'est-à-dire la page d'accueil.
4. L'attribut `download` du lien force l'enregistrement de **la réponse, quelle
   qu'elle soit**, sous le nom `echantillon.pdf`.
5. L'utilisateur obtient un fichier `.pdf` qui contient du HTML.

### Vérification en production

```
$ curl -sI https://mathpratique.ca/enseignants/echantillon.pdf
HTTP 404 | content-type: text/html; charset=utf-8 | 1018 octets

$ head -c 60 echantillon.pdf
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
```

Un PDF valide commence par les octets `%PDF`. Celui-ci commence par `<!do`.
**Ce n'est pas un PDF vide : c'est une page web renommée en `.pdf`.**

Le symptôme prête à confusion — l'utilisateur « reçoit un fichier », donc on
croit à un bogue de génération. Il n'y a pas de génération du tout.

### Les causes fréquentes, vérifiées une par une

Chacune a été examinée avant de conclure. Toutes sont écartées, et pour la
même raison de fond : **il n'existe aucun code de génération où elles
pourraient se produire.**

| Cause envisagée | Verdict |
|---|---|
| Génération avant la fin du rendu KaTeX | écartée — KaTeX n'est pas utilisé, et rien n'est généré |
| Conteneur en `display: none` non capturé | écartée — pas de `html2canvas` |
| Données asynchrones arrivées trop tard | écartée — aucune donnée n'est lue |
| Vérification d'accès qui renvoie un tableau vide | écartée — aucun contrôle d'accès n'existe |
| Erreur avalée par un `try/catch` muet | écartée — aucun `try/catch` sur ce chemin ; le lien est du HTML pur |
| Polices ou images bloquées par CORS | écartée — aucune ressource externe chargée |
| Contenu hors de la zone de page | écartée — aucun document n'est construit |

---

## 5. Recommandation — **cas A**, sans hésitation

### Pour l'échantillon : cas A dans sa forme la plus simple

Le PDF demandé **existe déjà**. Le projet de matériel de cours produit
42 documents compilés par LaTeX — recueils par chapitre, séries méli-mélo,
examens avec corrigés et grilles — dont les formules sont vectorielles, le
texte sélectionnable et la mise en page maîtrisée. Reconstruire cela dans un
navigateur serait absurde.

Mieux : l'échantillon est **gratuit et public par conception** (« aucune
inscription demandée »). Il n'a donc besoin ni de Cloud Storage, ni de Cloud
Function, ni d'URL signée, ni de filigrane nominatif — un filigrane portant le
courriel de l'acheteur n'a aucun sens sur un document que personne n'achète.

**Le correctif :**

1. Assembler l'échantillon à partir du matériel existant — un chapitre en
   version enseignant plus une dizaine d'exercices avec démarches.
2. Le déposer dans `public/enseignants/echantillon.pdf`.
3. Vérifier ses métadonnées : `pdfauthor` = `MathPratique.ca`, aucun sigle de
   cours, aucun établissement, aucun nom de personne.

C'est tout. Le lien existant fonctionne dès que le fichier est là.

### Pour les documents achetés : cas A dans sa forme complète

Ce chantier **n'existe pas encore** dans le dépôt — il est à construire, pas à
réparer. Les quatre produits sont `active: false`, `stripeUrl` est vide, et la
livraison passe aujourd'hui par les pièces jointes de Stripe.

Le jour où vous voudrez remplacer cet envoi par un téléchargement authentifié,
c'est bien l'architecture du cas A qu'il faudra : Cloud Storage privé, Cloud
Function vérifiant l'accès et la date de fin des 12 mois, URL signée de
15 minutes, filigrane nominatif apposé côté serveur.

**C'est un projet distinct du bogue en cours**, et bien plus lourd : il suppose
d'introduire Firebase, une authentification, et un webhook Stripe qui
enregistre les achats. Je ne l'entame pas sans votre feu vert explicite.

### Le cas B ne s'applique nulle part aujourd'hui

Le quiz personnalisé (`CustomQuiz.tsx`) génère bien du contenu à la volée,
mais **aucun bouton n'en propose l'export en PDF**. Si vous en voulez un, ce
sera une fonctionnalité neuve, et je vous signalerai le poids de Puppeteer
avant de l'engager.

---

## 6. Ce que je propose de faire, dans l'ordre

| | Action | Portée |
|---|---|---|
| 1 | Produire le PDF d'échantillon depuis le matériel LaTeX existant | petite |
| 2 | Le déposer dans `public/enseignants/` et vérifier ses métadonnées | petite |
| 3 | Rendre le lien honnête en cas d'absence du fichier — voir ci-dessous | petite |

### Sur le point 3

Même une fois le fichier déposé, le piège reste armé : si le PDF est un jour
renommé ou supprimé, le site se remettra silencieusement à distribuer sa page
d'accueil déguisée en PDF. Deux garde-fous simples, à décider ensemble :

- une vérification au moment du build qui **échoue** si
  `public/enseignants/echantillon.pdf` est absent — le déploiement casse au
  lieu de mentir ;
- côté navigateur, un `fetch` préalable qui contrôle le `content-type` avant de
  déclencher le téléchargement, et affiche un message clair sinon.

Le second respecte votre règle « jamais de fichier vide, toujours une erreur
explicite ». Le premier est plus radical : le problème ne peut pas atteindre la
production.

---

## 7. Ce que je n'ai pas fait

Conformément à la consigne, **aucun correctif n'a été écrit**. Aucune
dépendance ajoutée, aucun fichier de code modifié. Ce diagnostic est le seul
livrable de cette étape.
