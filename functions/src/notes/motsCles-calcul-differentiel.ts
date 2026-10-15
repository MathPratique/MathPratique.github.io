// ===========================================================================
//  Calcul différentiel — vocabulaire de détection, une entrée par notion
// ===========================================================================
//
// Rédigé à la main, relu par l'enseignant. CE FICHIER N'EST JAMAIS GÉNÉRÉ :
// scripts/generer-catalogue-notions.mjs ne touche qu'à la structure
// (notions-calcul-differentiel.generated.ts). Une notion sans entrée ici fait
// échouer le chargement du catalogue — voir index.ts.
//
// Ce qu'on écrit ici : ce qu'un étudiant aurait sous les yeux dans ses notes
// — le nom de la notion, les mots du cours, la notation telle qu'elle
// s'écrit. Pas des énoncés d'exercices, pas des réponses.
//
// Ce qu'on évite : les mots si généraux qu'ils apparaîtraient dans n'importe
// quelle page de notes (« fonction », « calcul », « exemple »). Ils feraient
// détecter toutes les notions à la fois, ce qui revient à n'en détecter
// aucune.

export const MOTS_CLES_CALCUL_DIFFERENTIEL: Record<string, string[]> = {
  // ─── Chapitre 1 — Fonctions et domaines ─────────────────────────────────
  "CD-1.1.1": [
    "mise en évidence simple",
    "mise en évidence double",
    "facteur commun",
    "factorisation par regroupement",
    "groupement de quatre termes",
    "mettre en évidence un facteur négatif",
  ],
  "CD-1.1.2": [
    "identités remarquables",
    "différence de carrés",
    "a² − b² = (a − b)(a + b)",
    "trinôme carré parfait",
    "test du double produit",
    "factoriser un trinôme en deux binômes",
  ],
  "CD-1.1.3": [
    "formule quadratique",
    "discriminant",
    "b² − 4ac",
    "racines du trinôme",
    "factoriser à partir des zéros",
    "a(x − x₁)(x − x₂)",
  ],
  "CD-1.1.4": [
    "polynôme de degré 3",
    "racine évidente",
    "division de polynômes",
    "diviseur (x − a)",
    "factorisation en deux temps",
  ],
  "CD-1.2": [
    "simplification d'une expression rationnelle",
    "fraction rationnelle",
    "multiplication et division de fractions algébriques",
    "dénominateur commun",
    "simplifier les facteurs communs",
    "restrictions sur les valeurs de x",
  ],
  "CD-1.3": [
    "fonctions de base",
    "graphique de référence",
    "domaine et image",
    "fonction définie par parties",
    "lecture graphique",
    "notation d'intervalles",
  ],
  "CD-1.4": [
    "lois des exposants",
    "exposant négatif",
    "exposant fractionnaire",
    "propriétés des logarithmes",
    "logarithme d'un produit, d'un quotient, d'une puissance",
    "logarithme naturel ln",
  ],
  "CD-1.5": [
    "arcsinus",
    "arctangente",
    "arcsin",
    "arctan",
    "fonction trigonométrique réciproque",
    "restriction du domaine",
    "valeurs exactes",
  ],
  "CD-1.6": [
    "cercle trigonométrique",
    "angle de référence",
    "quadrant et signe",
    "identité fondamentale sin²θ + cos²θ = 1",
    "identités trigonométriques",
    "valeurs exactes en radians",
  ],
  "CD-1.7": [
    "détermination du domaine",
    "dénominateur non nul",
    "radicande positif ou nul",
    "argument du logarithme strictement positif",
    "tableau de signes",
    "inéquation quadratique",
    "intersection des conditions",
  ],

  // ─── Chapitre 2 — Limites ───────────────────────────────────────────────
  "CD-2.1": [
    "notation de la limite",
    "lim x→a f(x)",
    "approche intuitive de la limite",
    "tableau de valeurs",
    "valeur vers laquelle la fonction tend",
  ],
  "CD-2.2": [
    "limite à gauche",
    "limite à droite",
    "limites latérales",
    "x → a⁻ et x → a⁺",
    "existence de la limite",
    "saut",
    "fonction définie par parties",
  ],
  "CD-2.3": [
    "propriétés des limites",
    "limite d'une somme",
    "limite d'un produit",
    "limite d'un quotient",
    "conditions d'application des propriétés",
  ],
  "CD-2.4": [
    "évaluation directe",
    "substitution de la valeur",
    "limite d'une exponentielle",
    "limite d'un logarithme",
    "limite d'une fonction trigonométrique",
  ],
  "CD-2.5": [
    "limite infinie",
    "asymptote verticale",
    "forme k sur zéro",
    "la fonction tend vers plus ou moins l'infini",
    "signe de part et d'autre du zéro du dénominateur",
  ],
  "CD-2.6": [
    "limite à l'infini",
    "asymptote horizontale",
    "x → +∞ et x → −∞",
    "comparaison des degrés",
    "quotient de polynômes à l'infini",
    "comportement à long terme",
  ],
  "CD-2.7": [
    "forme indéterminée",
    "forme 0/0",
    "forme ∞/∞",
    "forme 0 × ∞",
    "lever l'indétermination",
    "multiplier par le conjugué",
    "factoriser puis simplifier",
    "dénominateur commun",
    "mise en évidence du terme dominant",
    "différence de cubes",
    "division de polynômes",
  ],

  // ─── Chapitre 3 — Continuité ────────────────────────────────────────────
  "CD-3.1": [
    "continuité en un point",
    "les trois conditions de continuité",
    "f(a) existe",
    "la limite existe et vaut f(a)",
    "discontinuité par trou",
    "discontinuité par saut",
    "prolongement par continuité",
  ],
  "CD-3.2": [
    "continuité sur un intervalle",
    "intervalles de continuité",
    "continue sur son domaine",
    "continuité d'une fonction rationnelle",
  ],
  "CD-3.3": [
    "continuité d'une fonction définie par parties",
    "point de jonction",
    "raccordement des branches",
    "trouver la valeur du paramètre",
    "système d'équations aux points de jonction",
  ],
  "CD-3.4": [
    "théorèmes sur la continuité",
    "somme, produit et quotient de fonctions continues",
    "composition de fonctions continues",
    "continuité des fonctions usuelles",
  ],

  // ─── Chapitre 4 — La dérivée : définition ───────────────────────────────
  "CD-4.1": [
    "taux de variation moyen",
    "TVM",
    "pente de la sécante",
    "Δy/Δx",
    "vitesse moyenne",
  ],
  "CD-4.2": [
    "taux de variation instantané",
    "TVI",
    "du taux moyen au taux instantané",
    "passage à la limite quand h → 0",
    "la sécante devient la tangente",
  ],
  "CD-4.3": [
    // Pas de « dy/dx » ici : la notation figure dans toute page de notes
    // sur la dérivée et faisait détecter cette section à tort (relecture de
    // l'enseignant, 2026-10-15).
    "définition de la dérivée",
    "notation de Leibniz",
    "f'(x)",
    "notations équivalentes de la dérivée",
  ],
  "CD-4.4": [
    "dérivée à partir de la définition",
    "quotient différentiel",
    "[f(x + h) − f(x)] / h",
    "limite quand h tend vers 0",
    "dérivée par la définition",
  ],
  "CD-4.5": [
    "dérivée en un point",
    "f'(a)",
    "pente de la tangente au point",
    "unités de la dérivée",
    "interprétation du taux instantané en contexte",
  ],
  "CD-4.6": [
    "dérivabilité",
    "fonction dérivable",
    "point anguleux",
    "tangente verticale",
    "dérivable implique continue",
    "la réciproque est fausse",
    "limites latérales du quotient différentiel",
  ],

  // ─── Chapitre 5 — Règles de dérivation ──────────────────────────────────
  "CD-5.1": [
    "règle de la puissance",
    "dérivée d'une somme",
    "dérivation en chaîne",
    "dérivée d'une composée",
    "dy/du · du/dx",
    "dérivée de l'intérieur",
    "dérivée du sinus et du cosinus",
    "dérivée de la tangente",
    "sec² x",
    "dérivée de l'arcsinus",
    "dérivée de l'arctangente",
    "dérivée de l'exponentielle",
    "dérivée du logarithme",
  ],
  "CD-5.3": [
    "règle du produit",
    "règle du quotient",
    "u'v + uv'",
    "(u'v − uv') / v²",
    "dérivée d'un produit de deux fonctions",
  ],
  "CD-5.5": [
    "dérivation implicite",
    "dériver une équation implicite",
    "isoler dy/dx",
    "dériver y par rapport à x",
    "pente en un point d'une courbe implicite",
  ],
  "CD-5.6": [
    "dérivées successives",
    "dérivée seconde",
    "f''(x)",
    "d²y/dx²",
    "dérivée d'ordre n",
  ],
  "CD-5.7": [
    "démonstration d'une règle de dérivation",
    "démontrer la règle du produit",
    "dérivée du sinus à partir de la définition",
    "limites trigonométriques",
    "limite de sin h sur h",
  ],

  // ─── Chapitre 6 — Étude de fonction ─────────────────────────────────────
  "CD-6.1": [
    "droite tangente",
    "équation de la tangente",
    "y − y₀ = f'(x₀)(x − x₀)",
    "point de tangence",
    "tangente horizontale",
  ],
  "CD-6.2": [
    "règle de L'Hospital",
    "dériver le numérateur et le dénominateur",
    "forme 0/0 ou ∞/∞",
    "conditions d'application de L'Hospital",
  ],
  "CD-6.3": [
    "nombres critiques",
    "f'(x) = 0",
    "dérivée inexistante",
    "valeur critique appartenant au domaine",
    "candidats aux extremums",
  ],
  "CD-6.4": [
    "croissance et décroissance",
    "signe de la dérivée première",
    "test de la dérivée première",
    "maximum relatif",
    "minimum relatif",
    "extremums",
    "tableau de signes de f'",
  ],
  "CD-6.5": [
    "concavité",
    "concave vers le haut, concave vers le bas",
    "point d'inflexion",
    "signe de la dérivée seconde",
    "test de la dérivée seconde",
  ],
  "CD-6.6": [
    "tableau de variation",
    "tableau de variation combiné",
    "flèches de croissance",
    "signes de f' et de f'' dans un même tableau",
  ],
  "CD-6.7": [
    "étude complète d'une fonction",
    "esquisse du graphique",
    "domaine, asymptotes, extremums, inflexion",
    "ordre des étapes de l'étude",
    "tracer la courbe à partir du tableau",
  ],

  // ─── Chapitre 7 — Applications ──────────────────────────────────────────
  "CD-7.2": [
    "position, vitesse et accélération",
    "taux de variation en contexte",
    "interprétation du signe du taux",
    "unités du taux de variation",
    "dérivée d'un modèle",
  ],
  "CD-7.3": [
    "tendance à long terme",
    "limite quand t tend vers l'infini",
    "valeur d'équilibre",
    "asymptote horizontale d'un modèle",
  ],
  "CD-7.4": [
    "taux liés",
    "dériver par rapport au temps",
    "dV/dt",
    "dr/dt",
    "relation entre deux grandeurs qui varient",
    "triangles semblables",
    "théorème de Pythagore dans un problème de taux",
  ],
  "CD-7.5": [
    "problème d'optimisation",
    "maximiser",
    "minimiser",
    "contrainte",
    "fonction à optimiser",
    "aire maximale",
    "coût minimal",
  ],
  "CD-7.6": [
    "interprétation du résultat",
    "sens physique de la réponse",
    "ordre de grandeur",
    "validation de la réponse",
    "unités de la réponse",
  ],
};
