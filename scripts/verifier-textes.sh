#!/usr/bin/env bash
#
# Contrôle du registre et des mentions périmées dans les textes du site.
#
# Trois recherches :
#   1. marqueurs de vouvoiement hors des pages qui s'adressent aux enseignants
#   2. mentions d'un accès à vie — le modèle est à 12 mois
#   3. adresses courriel contenant un nom de personne
#
# Le rapport est une LISTE À RÉVISER, pas un verdict. La recherche 1 produit
# forcément des faux positifs : un « vous » dans une citation, un mot qui se
# termine en -ez sans être un verbe. C'est assumé — mieux vaut relire dix
# lignes de trop qu'en manquer une.
#
# Le script sort en échec (code 1) uniquement pour les recherches 2 et 3, qui
# ne tolèrent aucune occurrence. Le vouvoiement, lui, demande un jugement
# humain et ne bloque rien.
#
# Usage :
#   bash scripts/verifier-textes.sh
#
set -uo pipefail
cd "$(dirname "$0")/.."

RAPPORT="RAPPORT-TEXTES.md"

# ---------------------------------------------------------------------------
#  Ce qu'on inspecte, et ce qu'on épargne
# ---------------------------------------------------------------------------

# Les fichiers du site : le code de l'application et la page HTML qui porte
# les métadonnées. Les documents de travail (*.md) n'en font pas partie — ils
# ne sont pas publiés.
mapfile -t FICHIERS < <(
  { find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.json' \)
    echo index.html
  } | sort
)

# La page enseignants vouvoie délibérément, métadonnées comprises.
EXEMPT_FICHIER='^src/pages/Enseignants\.tsx$'

# Certaines lignes s'adressent à un enseignant depuis une page étudiante —
# l'invitation au bas des exercices, par exemple. C'est le public visé qui
# décide du registre, pas l'emplacement. Ces passages portent un marqueur
# explicite dans le code, sur la ligne ou juste au-dessus.
MARQUEUR='vouvoiement-assume'

# ---------------------------------------------------------------------------
#  Motifs
# ---------------------------------------------------------------------------
# Assemblés par concaténation : sans cela, le script se signalerait lui-même
# à chaque exécution, et le rapport deviendrait illisible.

VOUVOIEMENT="\\b(""vou""s|""votr""e|""vo""s)\\b"

# Les verbes en -ez sont du vouvoiement sans « vous » : « Pratiquez »,
# « affûtez ». On les cherche par la terminaison plutôt que par une liste de
# verbes, pour ne pas manquer ceux auxquels on n'a pas pensé.
TERMINAISON="\\b[A-Za-zÀ-ÿ]{3,}""ez""\\b"
# Mots français en -ez qui ne sont pas des verbes conjugués.
NON_VERBES='^(chez|assez|nez|rez|Chez|Assez|Nez)$'

A_VIE="(""accès à vi""e|""accès a vi""e|à ""vie""\\b|a ""vie""\\b|pour ""toujour""s|accès ""permanen""t|""lifetim""e)"

# Une adresse dont la partie locale contient autre chose que le nom du site.
COURRIEL="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
# Classe de caractères plutôt qu'antislash : awk avertit sur `\.` dans une
# chaîne, et l'avertissement pollue la sortie à chaque exécution.
ADRESSES_DU_SITE='@mathpratique[.]ca$'

# ---------------------------------------------------------------------------

echo "Contrôle des textes — ${#FICHIERS[@]} fichiers"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Le marqueur exempte le bloc qui le suit. La fenêtre est fixée à douze
# lignes : assez pour couvrir un paragraphe JSX avec son lien, trop courte
# pour absorber par accident la section suivante. Un bloc plus long a
# simplement besoin d'un second marqueur.
FENETRE_MARQUEUR=12

# Un seul awk pour tous les fichiers : FNR redonne le numéro de ligne dans le
# fichier courant, FILENAME son chemin. Un awk par fichier coûtait à lui seul
# la moitié du temps d'exécution.
construire_exemptions() {
  awk -v m="$MARQUEUR" -v n="$FENETRE_MARQUEUR" -v OFS='\t' '
    index($0, m) { for (i = 0; i <= n; i++) print FILENAME, FNR + i }
  ' "$@"
}

# Carte des lignes exemptées, calculée une seule fois : « fichier<TAB>ligne ».
construire_exemptions "${FICHIERS[@]}" > "$tmp/exemptions"

# Un seul appel à grep pour tous les fichiers, puis un filtrage en awk.
# La version précédente lançait un grep et un awk PAR FICHIER, plus un
# sous-processus par occurrence : près de trois cents processus par passage,
# et une vingtaine de secondes. Ici, quatre greps suffisent.
chercher() {
  local motif="$1" sortie="$2" respecter_exemptions="$3"

  local -a cibles=()
  for f in "${FICHIERS[@]}"; do
    [ -f "$f" ] || continue
    if [ "$respecter_exemptions" = "oui" ] && [[ "$f" =~ $EXEMPT_FICHIER ]]; then
      continue
    fi
    cibles+=("$f")
  done
  [ ${#cibles[@]} -gt 0 ] || { : > "$sortie"; return; }

  # `grep -nEo` sur plusieurs fichiers préfixe chaque résultat de son chemin :
  # « fichier:ligne:occurrence ». On garde les deux premiers deux-points comme
  # séparateurs et on laisse le reste intact — une occurrence peut en contenir.
  grep -nEo "$motif" "${cibles[@]}" 2>/dev/null \
    | awk -F: -v OFS='\t' -v exempter="$respecter_exemptions" -v carte="$tmp/exemptions" '
        BEGIN {
          if (exempter == "oui") {
            while ((getline ligne < carte) > 0) exempt[ligne] = 1
          }
        }
        {
          fichier = $1; numero = $2
          reste = $0
          sub(/^[^:]*:[0-9]+:/, "", reste)
          if (exempter == "oui" && ((fichier "\t" numero) in exempt)) next
          print fichier, numero, reste
        }
      ' > "$sortie"
}

chercher "$VOUVOIEMENT" "$tmp/vouv" oui
chercher "$TERMINAISON" "$tmp/term_brut" oui
chercher "$A_VIE" "$tmp/avie" non
chercher "$COURRIEL" "$tmp/mail_brut" non

# Filtrage des mots en -ez qui ne sont pas des verbes.
awk -F'\t' -v nv="$NON_VERBES" '$3 !~ nv' "$tmp/term_brut" > "$tmp/term"

# Une adresse au nom du site est correcte ; toute autre est à signaler.
awk -F'\t' -v ok="$ADRESSES_DU_SITE" '$3 !~ ok' "$tmp/mail_brut" > "$tmp/mail"

n_vouv=$(wc -l < "$tmp/vouv")
n_term=$(wc -l < "$tmp/term")
n_avie=$(wc -l < "$tmp/avie")
n_mail=$(wc -l < "$tmp/mail")

# ---------------------------------------------------------------------------
#  Rapport
# ---------------------------------------------------------------------------

section() {
  local titre="$1" fichier="$2" vide="$3"
  {
    echo "## $titre"
    echo
    if [ ! -s "$fichier" ]; then
      echo "$vide"
      echo
      return
    fi
    echo "| Fichier | Ligne | Occurrence |"
    echo "|---|---|---|"
    # Regroupé par fichier, dans l'ordre des lignes.
    sort -t$'\t' -k1,1 -k2,2n "$fichier" | while IFS=$'\t' read -r f l m; do
      echo "| [\`$f\`]($f) | $l | \`$m\` |"
    done
    echo
  } >> "$RAPPORT"
}

{
  echo "# Rapport de contrôle des textes"
  echo
  echo "Produit par \`scripts/verifier-textes.sh\`. Ce document est **écrasé** à"
  echo "chaque exécution : ne l'annote pas, il ne survivra pas au prochain passage."
  echo
  echo "| Recherche | Occurrences | Bloquant |"
  echo "|---|---|---|"
  echo "| Vouvoiement — \`vous\` / \`votre\` / \`vos\` | $n_vouv | non |"
  echo "| Vouvoiement — verbes en \`-ez\` | $n_term | non |"
  echo "| Mentions d'accès à vie | $n_avie | **oui** |"
  echo "| Adresses courriel hors du domaine | $n_mail | **oui** |"
  echo
  echo "Les deux premières recherches demandent un jugement humain : un « vous »"
  echo "dans une citation reste légitime, et tous les mots en \`-ez\` ne sont pas"
  echo "des verbes. Les deux dernières ne tolèrent aucune occurrence."
  echo
  echo "Sont épargnés : \`src/pages/Enseignants.tsx\`, qui vouvoie délibérément, et"
  echo "les lignes portant le marqueur \`$MARQUEUR\`, qui s'adressent à un"
  echo "enseignant depuis une page étudiante."
  echo
  echo "---"
  echo
} > "$RAPPORT"

section "Vouvoiement — pronoms et déterminants" "$tmp/vouv" \
  "Aucune occurrence hors des passages destinés aux enseignants."
section "Vouvoiement — verbes en \`-ez\`" "$tmp/term" \
  "Aucun verbe conjugué à la deuxième personne du pluriel."
section "Mentions d'accès à vie" "$tmp/avie" \
  "Aucune. Le modèle à 12 mois est décrit partout de la même façon."
section "Adresses courriel hors du domaine" "$tmp/mail" \
  "Aucune. Toutes les adresses affichées sont au nom du site."

echo "  vouvoiement (pronoms) : $n_vouv"
echo "  vouvoiement (verbes)  : $n_term"
echo "  accès à vie           : $n_avie"
echo "  courriels étrangers   : $n_mail"
echo "  Rapport écrit : $RAPPORT"

if [ "$n_avie" -gt 0 ] || [ "$n_mail" -gt 0 ]; then
  echo "  ÉCHEC : des mentions factuellement fausses subsistent." >&2
  exit 1
fi
exit 0
