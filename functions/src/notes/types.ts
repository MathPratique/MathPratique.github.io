// ===========================================================================
//  Le catalogue de notions — types partagés
// ===========================================================================
//
// Une notion = une section de la banque. C'est l'unité que l'analyse de notes
// détecte et que le quiz filtre ensuite. Le découpage n'est pas inventé ici :
// il vient des champs `section` et `sectionNotes` que portent les 861
// exercices des deux banques.
//
// Ce catalogue vit dans le code de la Cloud Function et NE CONTIENT NI
// ÉNONCÉ NI SOLUTION — rien qui ressemble au contenu payant. Seulement des
// titres de sections et du vocabulaire de cours.

/** La structure d'une notion, dérivée de la banque. */
export type Notion = {
  /** « CD-2.7 », « PS-3.3 » — préfixe de cours + numéro de section. */
  id: string;
  chapitre: number;
  /** Tel qu'écrit dans la banque : « 2.7 », « 1.1.3 ». */
  section: string;
  /** Libellé canonique de la section. */
  titre: string;
};

/** Une notion prête pour le prompte : sa structure et son vocabulaire. */
export type NotionComplete = Notion & {
  /**
   * Mots-clés et formulations typiques qu'on trouverait dans les notes d'un
   * étudiant sur cette notion. Rédigés à la main, relus par l'enseignant.
   */
  motsCles: string[];
};
