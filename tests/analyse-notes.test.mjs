import test from "node:test";
import assert from "node:assert/strict";
import {
  deciderAnalyse,
  jourLocal,
  MAX_CARACTERES,
  MAX_OCTETS_FICHIER,
  MAX_OCTETS_IMAGE,
  MAX_NOTIONS_DETECTEES,
  MESSAGES_REFUS,
  QUOTA_QUOTIDIEN,
  quotaApres,
  quotaRembourse,
  validerDetections,
  validerEntree,
} from "../.tmp-test/notes/analyse.js";

const COURS = ["calcul-differentiel", "probabilites-statistique"];
const refus = (entree) => {
  const r = validerEntree(entree, COURS);
  assert.equal(r.valide, false, "cette entrée aurait dû être refusée");
  return r.raison;
};

// ---------------------------------------------------------------------------
//  Les limites — tout ce qui doit coûter zéro cent
// ---------------------------------------------------------------------------

test("une entrée correcte passe", () => {
  assert.deepEqual(validerEntree({ coursId: COURS[0], texte: "la dérivée en chaîne" }, COURS), {
    valide: true,
  });
  assert.deepEqual(
    validerEntree(
      { coursId: COURS[1], fichier: { mediaType: "application/pdf", octets: 1000, pages: 4 } },
      COURS,
    ),
    { valide: true },
  );
});

test("un cours sans catalogue est refusé avant tout le reste", () => {
  assert.equal(refus({ coursId: "calcul-integral", texte: "intégrale" }), "cours-inconnu");
  assert.equal(refus({ coursId: "", texte: "x" }), "cours-inconnu");
});

test("ni texte ni fichier, ou les deux à la fois", () => {
  assert.equal(refus({ coursId: COURS[0] }), "entree-vide");
  assert.equal(refus({ coursId: COURS[0], texte: "   " }), "entree-vide");
  assert.equal(
    refus({ coursId: COURS[0], texte: "x", fichier: { mediaType: "image/png", octets: 10 } }),
    "entree-double",
  );
});

test("les tailles sont des bornes, pas des suggestions", () => {
  assert.equal(refus({ coursId: COURS[0], texte: "a".repeat(MAX_CARACTERES + 1) }), "texte-trop-long");
  // Pile à la limite : accepté.
  assert.deepEqual(validerEntree({ coursId: COURS[0], texte: "a".repeat(MAX_CARACTERES) }, COURS), {
    valide: true,
  });
  assert.equal(
    refus({ coursId: COURS[0], fichier: { mediaType: "application/pdf", octets: MAX_OCTETS_FICHIER + 1, pages: 2 } }),
    "fichier-trop-gros",
  );
  assert.equal(
    refus({ coursId: COURS[0], fichier: { mediaType: "image/png", octets: 0 } }),
    "fichier-vide",
  );
});

test("un PDF trop long est refusé avant l'appel au modèle", () => {
  assert.equal(
    refus({ coursId: COURS[0], fichier: { mediaType: "application/pdf", octets: 5000, pages: 21 } }),
    "pdf-trop-long",
  );
  assert.deepEqual(
    validerEntree(
      { coursId: COURS[0], fichier: { mediaType: "application/pdf", octets: 5000, pages: 20 } },
      COURS,
    ),
    { valide: true },
  );
});

test("les formats que l'API lit passent, les autres non", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "application/pdf"]) {
    assert.deepEqual(
      validerEntree({ coursId: COURS[0], fichier: { mediaType: type, octets: 100 } }, COURS),
      { valide: true },
      type,
    );
  }
  assert.equal(
    refus({ coursId: COURS[0], fichier: { mediaType: "application/zip", octets: 100 } }),
    "type-non-accepte",
  );
});

test("le HEIC a son propre message, pas « format non reconnu »", () => {
  // Format par défaut des photos d'iPhone, que l'API ne lit pas. L'étudiant
  // ignore souvent le format de ses photos : il faut lui dire quoi faire.
  for (const type of ["image/heic", "image/heif"]) {
    assert.equal(refus({ coursId: COURS[0], fichier: { mediaType: type, octets: 100 } }), "heic-non-lu");
  }
  assert.match(MESSAGES_REFUS["heic-non-lu"], /capture d'écran/);
});

test("une photo est plafonnée plus bas qu'un PDF", () => {
  // L'API refuse une image de plus de 10 Mo en base64, soit ~7,5 Mo d'image.
  assert.ok(MAX_OCTETS_IMAGE * (4 / 3) < 10 * 1024 * 1024, "la borne image tient sous la limite de l'API");
  assert.equal(
    refus({ coursId: COURS[0], fichier: { mediaType: "image/jpeg", octets: MAX_OCTETS_IMAGE + 1 } }),
    "image-trop-grosse",
  );
  // Le même poids passe pour un PDF.
  assert.deepEqual(
    validerEntree(
      { coursId: COURS[0], fichier: { mediaType: "application/pdf", octets: MAX_OCTETS_IMAGE + 1, pages: 3 } },
      COURS,
    ),
    { valide: true },
  );
});

// ---------------------------------------------------------------------------
//  Le jour local
// ---------------------------------------------------------------------------

test("le compteur repart à minuit chez l'étudiant, pas à 20 h", () => {
  // 2026-10-16 01 h 30 UTC, c'est encore le 15 à Montréal.
  assert.equal(jourLocal(Date.UTC(2026, 9, 16, 1, 30)), "2026-10-15");
  assert.equal(jourLocal(Date.UTC(2026, 9, 15, 4, 30)), "2026-10-15");
  assert.equal(jourLocal(Date.UTC(2026, 9, 15, 3, 30)), "2026-10-14");
});

// ---------------------------------------------------------------------------
//  Le quota
// ---------------------------------------------------------------------------

const JOUR = "2026-10-15";

test("sans accès : un seul essai, qui ne se recharge jamais", () => {
  const premier = deciderAnalyse({ accesActif: false, niveau: null, quota: undefined, jour: JOUR });
  assert.deepEqual(premier, { autorise: true, restantes: 0, essaiGratuit: true });

  const apres = quotaApres(undefined, JOUR, true);
  assert.equal(apres.essaiGratuitUtilise, true);

  const second = deciderAnalyse({ accesActif: false, niveau: null, quota: apres, jour: JOUR });
  assert.equal(second.autorise, false);
  assert.equal(second.raison, "essai-gratuit-epuise");

  // Et le lendemain non plus : l'essai n'est pas quotidien.
  const demain = deciderAnalyse({ accesActif: false, niveau: null, quota: apres, jour: "2026-10-16" });
  assert.equal(demain.autorise, false);
});

test("avec accès : dix par jour, et le compteur d'hier ne compte pas", () => {
  let quota = undefined;
  for (let i = 0; i < QUOTA_QUOTIDIEN; i++) {
    const d = deciderAnalyse({ accesActif: true, niveau: "acheteur", quota, jour: JOUR });
    assert.equal(d.autorise, true, `analyse ${i + 1}`);
    assert.equal(d.restantes, QUOTA_QUOTIDIEN - i - 1);
    quota = quotaApres(quota, JOUR, false);
  }
  const trop = deciderAnalyse({ accesActif: true, niveau: "acheteur", quota, jour: JOUR });
  assert.equal(trop.autorise, false);
  assert.equal(trop.raison, "quota-atteint");

  // Le lendemain, le compteur repart.
  const demain = deciderAnalyse({ accesActif: true, niveau: "acheteur", quota, jour: "2026-10-16" });
  assert.deepEqual(demain, { autorise: true, restantes: QUOTA_QUOTIDIEN - 1, essaiGratuit: false });
});

test("un accès de niveau non prévu est refusé, même actif", () => {
  const d = deciderAnalyse({ accesActif: true, niveau: "curieux", quota: undefined, jour: JOUR });
  assert.equal(d.autorise, false);
  assert.equal(d.raison, "niveau-non-autorise");
});

test("un accès sans niveau est traité comme « restreint », pas laissé passer", () => {
  // Vieux documents d'accès : le niveau peut manquer. La règle de
  // téléchargement le lit comme « restreint » ; l'analyse fait pareil, et le
  // vérifie contre la liste au lieu de sauter le contrôle.
  const d = deciderAnalyse({ accesActif: true, niveau: null, quota: undefined, jour: JOUR });
  assert.deepEqual(d, { autorise: true, restantes: QUOTA_QUOTIDIEN - 1, essaiGratuit: false });
});

test("une analyse ratée est rendue", () => {
  const quota = quotaApres({ jour: JOUR, utiliseesAujourdhui: 3 }, JOUR, false);
  assert.equal(quota.utiliseesAujourdhui, 4);
  assert.equal(quotaRembourse(quota, JOUR, false).utiliseesAujourdhui, 3);

  // L'essai gratuit se rend aussi.
  assert.equal(quotaRembourse({ essaiGratuitUtilise: true }, JOUR, true).essaiGratuitUtilise, false);

  // Un remboursement ne peut pas faire descendre sous zéro ni ressusciter
  // le compteur d'un autre jour.
  assert.equal(quotaRembourse({ jour: JOUR, utiliseesAujourdhui: 0 }, JOUR, false).utiliseesAujourdhui, 0);
  assert.equal(
    quotaRembourse({ jour: "2026-10-14", utiliseesAujourdhui: 7 }, JOUR, false).utiliseesAujourdhui,
    7,
  );
});

// ---------------------------------------------------------------------------
//  La sortie du modèle — la frontière de confiance
// ---------------------------------------------------------------------------

const IDS = new Set(["PS-3.3", "PS-3.4", "CD-2.7"]);

test("une réponse bien formée passe", () => {
  const r = validerDetections(
    { notions: [{ id: "PS-3.3", confiance: "elevee" }, { id: "PS-3.4", confiance: "moyenne" }] },
    IDS,
  );
  assert.equal(r.valide, true);
  assert.deepEqual(r.detectees, [
    { id: "PS-3.3", confiance: "elevee" },
    { id: "PS-3.4", confiance: "moyenne" },
  ]);
  assert.equal(r.horsSujet, false);
  assert.deepEqual(r.ignorees, []);
});

test("rien de ce qui n'est pas au catalogue ne ressort", () => {
  // Le cas qui compte : des notes qui tentent une injection. Quoi qu'ait
  // répondu le modèle, la sortie reste dans le catalogue.
  const r = validerDetections(
    {
      notions: [
        { id: "PS-3.3", confiance: "elevee" },
        { id: "PS-9.9", confiance: "elevee" },
        { id: "<script>alert(1)</script>", confiance: "elevee" },
        { id: 42 },
      ],
    },
    IDS,
  );
  assert.deepEqual(r.detectees, [{ id: "PS-3.3", confiance: "elevee" }]);
  assert.equal(r.ignorees.length, 2);
});

test("une réponse difforme est rejetée, pas devinée", () => {
  for (const brut of [null, "oui", 42, {}, { notions: "PS-3.3" }, { autre: [] }]) {
    assert.deepEqual(validerDetections(brut, IDS), { valide: false }, JSON.stringify(brut));
  }
});

test("doublons écartés, confiance normalisée, nombre borné", () => {
  const r = validerDetections(
    {
      notions: [
        { id: "PS-3.3", confiance: "elevee" },
        { id: "PS-3.3", confiance: "moyenne" },
        { id: "CD-2.7", confiance: "certaine" },
      ],
    },
    IDS,
  );
  assert.deepEqual(r.detectees, [
    { id: "PS-3.3", confiance: "elevee" },
    // Toute confiance inconnue retombe sur « moyenne » : on ne laisse pas le
    // modèle inventer un troisième niveau que l'interface ne sait pas rendre.
    { id: "CD-2.7", confiance: "moyenne" },
  ]);

  const beaucoup = { notions: Array.from({ length: 20 }, () => ({ id: "PS-3.3" })) };
  assert.ok(validerDetections(beaucoup, IDS).detectees.length <= MAX_NOTIONS_DETECTEES);
});

test("aucune notion reconnue vaut hors sujet", () => {
  const r = validerDetections({ notions: [] }, IDS);
  assert.equal(r.valide, true);
  assert.equal(r.horsSujet, true);
  assert.deepEqual(r.detectees, []);
});
