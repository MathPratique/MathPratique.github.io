import { exercises } from "./exercises";
import { topics } from "./topics";
import { packageEnVente } from "./boutique";
import { compter, enLettres, nombre, quantite, type MatiereComptee } from "./compteurs";

export type Stat = {
  id: string;
  value: string;
  label: string;
};

// Chaque matière déclare ce qu'elle a réellement : les catalogues des banques
// pour les cours qui en ont une, le décompte de `exercises.ts` pour les
// autres (algèbre linéaire). Aucun nombre écrit à la main — voir
// `compteurs.ts` pour les règles, couvertes par `npm test`.
const matieres: MatiereComptee[] = topics.map((t) => {
  const gratuits = t.nbExercicesPublies ?? exercises.filter((e) => e.topicId === t.id).length;
  return {
    id: t.id,
    enPreparation: t.enPreparation === true,
    masquee: t.masquerListe === true,
    gratuits,
    reserves: Math.max(0, (t.nbExercicesTotal ?? gratuits) - gratuits),
    packageEnVente: packageEnVente(t.id),
  };
});

export const compteurs = compter(matieres);

/** Les matières dont un package s'achète aujourd'hui, dans l'ordre de `topics`. */
export const matieresEnVente = topics.filter((t) => packageEnVente(t.id) && !t.enPreparation);

const unPackageEnVente = matieresEnVente.length > 0;

/**
 * Phrase d'accroche sur le prix : exacte quel que soit le nombre de
 * gratuits, et ne mentionne le package que s'il y en a un en vente.
 */
export const ACCROCHE_PRIX =
  `${quantite(compteurs.gratuits, "exercices corrigés gratuits")}, sans compte.` +
  (unPackageEnVente ? " Pour aller plus loin, un package complet est offert en option." : "");

const n = compteurs.gratuits;
const m = compteurs.matieresDisponibles;

export const stats: Stat[] = [
  {
    id: "problems",
    value: nombre(n),
    label: `exercice${n > 1 ? "s" : ""} corrigé${n > 1 ? "s" : ""} gratuit${n > 1 ? "s" : ""} dans ${enLettres(m)} matière${m > 1 ? "s" : ""}`,
  },
  {
    id: "steps",
    value: "100 %",
    label: "des solutions sont détaillées étape par étape",
  },
  {
    id: "devices",
    value: "Tous",
    label: "appareils — ordinateur, tablette, téléphone",
  },
  {
    // Remplace « 100 % gratuit, sans compte requis » : faux depuis qu'un
    // package payant existe.
    id: "free",
    value: "0 $",
    label: unPackageEnVente
      ? "pour commencer, sans compte. Un package complet est offert en option."
      : "pour commencer, sans compte.",
  },
];
