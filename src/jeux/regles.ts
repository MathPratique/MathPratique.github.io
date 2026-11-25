// ===========================================================================
//  Classement des jeux — règles pures (sans Firebase), testées par npm test.
// ===========================================================================
//
// Les mêmes bornes sont écrites dans firestore.rules (bloc « Classements des
// jeux ») : pseudonyme de 20 caractères au plus, temps de 3 minutes à 10
// heures. Un test vérifie que les deux restent identiques.
//
// Le filtre de mots ne vit qu'ici, côté site : les règles Firestore ne
// vérifient pas les mots. Il arrête les pseudonymes grossiers tapés de bonne
// foi ; un pseudonyme qui passerait quand même se retire dans la console
// Firebase.

/** Nombre de lignes du classement affiché. */
export const TAILLE_TOP = 10;
/** Longueur maximale d'un pseudonyme, en caractères. */
export const PSEUDO_MAX = 20;
/** Un temps sous 3 minutes est impossible : il est refusé. */
export const TEMPS_MIN = 180;
/** Au-delà de 10 heures, la valeur est absurde : refusée aussi. */
export const TEMPS_MAX = 36000;

export const MESSAGE_PSEUDO_REFUSE =
  "Ce pseudonyme n’est pas accepté. Choisis-en un autre, s’il te plaît.";
export const MESSAGE_PSEUDO_VIDE = "Choisis un pseudonyme d’au moins un caractère.";
export const MESSAGE_PSEUDO_LONG = `Ton pseudonyme doit faire ${PSEUDO_MAX} caractères au plus.`;

export type VerdictPseudo = { ok: true; pseudo: string } | { ok: false; message: string };

// ---------------------------------------------------------------------------
//  Filtre de mots inappropriés
// ---------------------------------------------------------------------------
// Deux listes, comparées au pseudonyme ramené en minuscules, sans accents, et
// où les chiffres qui imitent des lettres sont remplacés (« s4l0pe »).
//
//   RACINES : cherchées partout, même collées ou séparées par des points ou
//   des espaces (« s.a.l.o.p.e », « fils de pute »). Elles sont assez longues
//   pour ne pas apparaître par hasard dans un mot ordinaire.
//
//   MOTS : cherchés seulement comme mots entiers. Courts, ils apparaissent
//   dans des mots innocents (« con » dans « second », « cul » dans
//   « calcul », « pute » dans « computer ») : on ne les refuse que seuls.

const RACINES = [
  // français
  "connard", "connasse", "salope", "salaud", "putain", "encule", "merde", "batard",
  "pouffiasse", "branleur", "branlette", "filsdepute", "niquetamere", "trouduc",
  "pedophil", "violeur", "bougnoul", "negro", "youpin",
  // sacres québécois
  "tabarnak", "tabarnac", "tabernak", "tabernac", "calisse", "caliss",
  // anglais
  "fuck", "bitch", "whore", "pussy", "asshole", "bastard", "nigger", "nigga", "faggot", "motherf",
  // haine
  "hitler",
  // noms réservés : personne ne doit pouvoir se faire passer pour le site
  "mathpratique", "administrat", "moderat",
];

const MOTS = [
  "con", "cons", "conne", "connes", "pute", "putes", "cul", "bite", "bites", "zob", "pd", "pede", "pedes",
  "fdp", "ntm", "tg", "nique", "niquer", "chatte", "couille", "couilles", "gouine", "tapette", "enfoire",
  "enfoiree", "salop", "salo", "negre", "chienne", "ostie", "osti", "esti", "criss", "crisse", "sacrament",
  "nazi", "nazis", "kkk", "viol", "sexe", "sex", "porno", "porn",
  "shit", "cunt", "dick", "cock", "slut", "rape", "admin",
];

const IMITATIONS: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "€": "e", "!": "i",
};

/** Minuscules, sans accents, chiffres-lettres remplacés. Exporté pour les tests. */
export function normaliserPourFiltre(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[0134578@$€!]/g, (c) => IMITATIONS[c] ?? c);
}

/** Vrai si le pseudonyme contient un mot refusé. */
export function contientMotRefuse(pseudo: string): boolean {
  const normal = normaliserPourFiltre(pseudo);
  const colle = normal.replace(/[^a-z]/g, "");
  if (RACINES.some((r) => colle.includes(r))) return true;
  const mots = normal.split(/[^a-z]+/).filter(Boolean);
  if (mots.some((m) => MOTS.includes(m))) return true;
  // Lettres isolées séparées par des espaces ou des points : « c o n », « p.u.t.e »
  return mots.length >= 2 && mots.every((m) => m.length === 1) && MOTS.includes(mots.join(""));
}

/**
 * Vérifie un pseudonyme tapé par un joueur. Les espaces au début et à la fin
 * sont retirés, et les espaces répétés réduits à un seul.
 */
export function verifierPseudo(brut: unknown): VerdictPseudo {
  if (typeof brut !== "string") return { ok: false, message: MESSAGE_PSEUDO_VIDE };
  const pseudo = brut.replace(/\s+/g, " ").trim();
  if (pseudo.length === 0) return { ok: false, message: MESSAGE_PSEUDO_VIDE };
  if ([...pseudo].length > PSEUDO_MAX || pseudo.length > PSEUDO_MAX) return { ok: false, message: MESSAGE_PSEUDO_LONG };
  // Aucun caractère de contrôle ni caractère invisible de mise en forme
  if (/[\p{Cc}\p{Cf}]/u.test(pseudo)) {
    return { ok: false, message: MESSAGE_PSEUDO_REFUSE };
  }
  if (contientMotRefuse(pseudo)) return { ok: false, message: MESSAGE_PSEUDO_REFUSE };
  return { ok: true, pseudo };
}

/** Un temps (en secondes) que les règles Firestore accepteront. */
export function tempsValide(temps: unknown): temps is number {
  return typeof temps === "number" && Number.isFinite(temps) && temps >= TEMPS_MIN && temps <= TEMPS_MAX;
}

/** Temps arrondi au dixième, comme le chronomètre du jeu. */
export function arrondirTemps(temps: number): number {
  return Math.round(temps * 10) / 10;
}

/** « 07:42,3 », comme dans le jeu. */
export function formaterTemps(temps: number): string {
  const dixiemes = Math.round(temps * 10);
  const m = Math.floor(dixiemes / 600), s = Math.floor((dixiemes % 600) / 10), d = dixiemes % 10;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${d}`;
}

/** « 1er », « 2e », « 14e ». */
export function rangTexte(rang: number): string {
  return rang === 1 ? "1er" : `${rang}e`;
}
