import { Link } from "react-router-dom";
import PageBrouillon, { Liste, Section } from "../components/legal/PageBrouillon";
import { DELAI_REMBOURSEMENT_JOURS, DUREE_ACCES_MOIS } from "../acces/regles";
import { EMAIL_CONTACT } from "../data/site";

// BROUILLON du 2026-10-26 — à faire réviser avant d'être lié au pied de page.
//
// La règle est celle que le site applique déjà : `remboursementPossible`
// (src/acces/regles.ts) refuse dès qu'un document a été téléchargé ou que le
// délai est passé, et Mon compte l'affiche à l'acheteur. Le délai vient de
// DELAI_REMBOURSEMENT_JOURS : ne jamais l'écrire en dur ici.
//
// À RÉVISER :
//   - articulation avec la Loi sur la protection du consommateur (contrat
//     conclu à distance : renseignements à fournir avant l'achat, droit de
//     résolution, délais de remboursement imposés par la loi) ;
//   - le délai d'apparition du remboursement, donné ici à titre indicatif ;
//   - le traitement des taxes remboursées.

const mailto = `mailto:${EMAIL_CONTACT}`;
const lien = "font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800";

export default function PolitiqueRemboursement() {
  return (
    <PageBrouillon
      titre="Politique de remboursement"
      description="Remboursement complet d'un package MathPratique, sous conditions : délai, démarche et traitement."
    >
      <Section titre="En bref">
        <p>
          Tu peux obtenir un <strong>remboursement complet</strong> de ton package dans
          les {DELAI_REMBOURSEMENT_JOURS} jours suivant ton achat, à une seule
          condition : <strong>qu'aucun document du package n'ait été téléchargé</strong>.
          Tu n'as pas à te justifier.
        </p>
      </Section>

      <Section titre="Les conditions">
        <Liste>
          <li>
            La demande est faite dans les {DELAI_REMBOURSEMENT_JOURS} jours qui suivent
            l'achat. Le délai commence le jour où ton accès commence.
          </li>
          <li>
            Aucun document du package n'a été téléchargé à partir de ton compte. Une
            fois un document téléchargé, il ne peut plus être « rendu » : le package
            n'est alors plus remboursable.
          </li>
        </Liste>
        <p>
          La page <em>Mon compte</em> t'indique si ton achat est encore remboursable.
        </p>
      </Section>

      <Section titre="Comment faire ta demande">
        <p>
          Écris à{" "}
          <a href={mailto} className={lien}>
            {EMAIL_CONTACT}
          </a>{" "}
          à partir de l'adresse courriel de ton compte, en précisant le cours acheté.
          Une réponse t'est envoyée dès que la demande est traitée.
        </p>
      </Section>

      <Section titre="Le traitement du remboursement">
        <Liste>
          <li>
            Le montant payé t'est remboursé sur le moyen de paiement utilisé lors de
            l'achat, par l'entremise de Stripe, le service de paiement du site.
          </li>
          <li>
            Ton accès au package (normalement de {DUREE_ACCES_MOIS} mois) prend fin au
            moment du remboursement.
          </li>
          <li>
            Selon ton institution financière, le montant peut prendre quelques jours
            ouvrables à apparaître sur ton relevé.
          </li>
        </Liste>
      </Section>

      <Section titre="Tes droits">
        <p>
          Cette politique s'ajoute aux droits que te reconnaît la{" "}
          <em>Loi sur la protection du consommateur</em> du Québec. Elle ne les limite
          pas.
        </p>
        <p>
          Voir aussi les{" "}
          <Link to="/conditions-d-utilisation" className={lien}>
            conditions d'utilisation
          </Link>
          .
        </p>
      </Section>

      <Section titre="Une question?">
        <p>
          Écris-nous à{" "}
          <a href={mailto} className={lien}>
            {EMAIL_CONTACT}
          </a>
          .
        </p>
      </Section>
    </PageBrouillon>
  );
}
