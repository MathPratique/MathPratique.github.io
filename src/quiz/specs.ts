// ===========================================================================
//  Le codec d'URL du quiz personnalisé
// ===========================================================================
//
// Un quiz personnalisé tient dans son adresse : /quiz?custom=<code>. Rien
// n'est stocké, ce qui permet de partager un quiz par simple copier-coller.
//
//   PSD3-e2m3t1              2 CALC, 3 QCM, 1 V/F dans le chapitre 3
//   PSD3-e2m3t1-dm           … en se limitant au niveau Moyen
//   PSD3-e2m0t0-s3.3,3.4     … dans les seules sections 3.3 et 3.4
//   CD5-e1m0t2_PSD1-e3m0t0   deux lots, séparés par un souligné
//
// Les sections sont arrivées avec le mode « à partir de mes notes » : une
// page de notes couvre une ou deux sections, pas un chapitre entier.
//
// Module pur, sans aucune dépendance : il est compilé tel quel par le banc
// d'essai. C'est aussi pour ça que le niveau est redéclaré ici plutôt
// qu'importé de src/data/exercises.ts, qui tire un gros JSON derrière lui.

/** Les trois niveaux tels que le site les nomme — même union que `Difficulty`. */
export type NiveauAffiche = "Facile" | "Moyen" | "Difficile";

export type CustomQuizSpec = {
  lessonId: string;
  exerciseCount: number;
  mcqCount: number;
  tfCount: number;
  /** Filtre de niveau — seules les leçons adossées à une banque l'honorent. */
  difficulty?: NiveauAffiche;
  /**
   * Sections visées à l'intérieur de la leçon, telles qu'écrites dans la
   * banque (« 3.3 »). Absent ou vide : tout le chapitre.
   */
  sections?: string[];
};

const DIFF_VERS_CODE: Record<NiveauAffiche, string> = {
  Facile: "f",
  Moyen: "m",
  Difficile: "d",
};
const CODE_VERS_DIFF: Record<string, NiveauAffiche> = {
  f: "Facile",
  m: "Moyen",
  d: "Difficile",
};

/**
 * Un numéro de section : des entiers séparés par des points — « 2.7 »,
 * « 1.1.3 ». Les deux banques n'en contiennent pas d'autre forme, et le
 * générateur du catalogue de notions refuse d'en produire une autre. Les
 * jetons qui ne correspondent pas sont écartés au décodage : une adresse
 * bricolée à la main ne doit pas injecter n'importe quoi dans un filtre.
 */
const SECTION = /^\d+(?:\.\d+)*$/;

const SEGMENT = /^([A-Z]+\d+)-e(\d+)m(\d+)t(\d+)(?:-d([fmd]))?(?:-s([\d.,]+))?$/;

export function encodeCustomQuiz(specs: CustomQuizSpec[]): string {
  return specs
    .filter((s) => s.exerciseCount + s.mcqCount + s.tfCount > 0)
    .map((s) => {
      let code = `${s.lessonId}-e${s.exerciseCount}m${s.mcqCount}t${s.tfCount}`;
      if (s.difficulty) code += `-d${DIFF_VERS_CODE[s.difficulty]}`;
      const sections = (s.sections ?? []).filter((x) => SECTION.test(x));
      if (sections.length) code += `-s${sections.join(",")}`;
      return code;
    })
    .join("_");
}

export function decodeCustomQuiz(str: string): CustomQuizSpec[] {
  if (!str) return [];
  return str
    .split("_")
    .map((segment) => {
      const m = segment.match(SEGMENT);
      if (!m) return null;
      const spec: CustomQuizSpec = {
        lessonId: m[1],
        exerciseCount: parseInt(m[2], 10),
        mcqCount: parseInt(m[3], 10),
        tfCount: parseInt(m[4], 10),
      };
      if (m[5]) spec.difficulty = CODE_VERS_DIFF[m[5]];
      if (m[6]) {
        const sections = m[6].split(",").filter((x) => SECTION.test(x));
        if (sections.length) spec.sections = sections;
      }
      return spec;
    })
    .filter((x): x is CustomQuizSpec => x !== null);
}
