import { Link } from "react-router-dom";
import PageBrouillon, { Liste, Section } from "../components/legal/PageBrouillon";
import { DUREE_ACCES_MOIS } from "../acces/regles";
import { EMAIL_CONTACT } from "../data/site";
import { TARIFS_CALCUL_DIFFERENTIEL } from "../data/tarifs";

// BROUILLON du 2026-10-26 — à faire réviser avant d'être lié au pied de page.
//
// À RÉVISER :
//   - taxes (TPS/TVQ) : à préciser selon l'inscription aux fichiers de taxes ;
//   - limitation de responsabilité : formulation compatible avec la Loi sur
//     la protection du consommateur (certaines exclusions y sont interdites) ;
//   - désignation de l'exploitant du site (nom de l'entreprise ou de
//     l'exploitant, adresse) : la Loi sur la protection du consommateur
//     l'exige pour un contrat conclu à distance — à ajouter sans enfreindre
//     la règle « aucun nom de personne » du site (raison sociale, par
//     exemple) ;
//   - durée et conditions de suspension d'un compte en cas de partage.

const mailto = `mailto:${EMAIL_CONTACT}`;
const lien = "font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800";

export default function ConditionsUtilisation() {
  return (
    <PageBrouillon
      titre="Conditions d'utilisation"
      description="Les règles d'utilisation de MathPratique.ca : contenu gratuit, compte, achat d'un package et licence d'utilisation."
    >
      <Section titre="1. Objet">
        <p>
          Ces conditions encadrent l'utilisation du site MathPratique.ca : ses
          exercices et outils gratuits, la création d'un compte et l'achat d'un
          package. En utilisant le site, tu les acceptes.
        </p>
      </Section>

      <Section titre="2. Le contenu gratuit">
        <p>
          Les exercices gratuits, le quiz et le calculateur de note sont accessibles
          sans compte. Tu peux les utiliser librement pour ton étude personnelle.
        </p>
      </Section>

      <Section titre="3. Ton compte">
        <Liste>
          <li>Un compte est nécessaire pour acheter un package et y accéder.</li>
          <li>Un compte est personnel : il ne se partage pas.</li>
          <li>
            Tu es responsable de la confidentialité de ton mot de passe et des
            renseignements que tu fournis.
          </li>
          <li>
            Un compte utilisé contrairement à ces conditions, par exemple partagé
            entre plusieurs personnes, peut être suspendu.
          </li>
        </Liste>
      </Section>

      <Section titre="4. L'achat d'un package">
        <Liste>
          <li>
            Les prix sont affichés en dollars canadiens ({TARIFS_CALCUL_DIFFERENTIEL.devise})
            dans la boutique, avant l'achat.
          </li>
          <li>
            Un seul paiement : aucun abonnement, aucun renouvellement automatique.
          </li>
          <li>
            L'accès dure {DUREE_ACCES_MOIS} mois à partir de l'achat. Il couvre la
            consultation et le téléchargement des documents du package.
          </li>
          <li>Le paiement est traité par Stripe, le service de paiement du site.</li>
          <li>
            Les remboursements suivent la{" "}
            <Link to="/politique-de-remboursement" className={lien}>
              politique de remboursement
            </Link>
            .
          </li>
        </Liste>
      </Section>

      <Section titre="5. Ce que tu peux faire avec le matériel acheté">
        <p>
          L'achat te donne une licence personnelle, non exclusive et non
          transférable, pour la durée de ton accès. Tu peux :
        </p>
        <Liste>
          <li>consulter et télécharger les documents pour ton étude personnelle ;</li>
          <li>les imprimer pour ton propre usage.</li>
        </Liste>
        <p>Tu ne peux pas :</p>
        <Liste>
          <li>partager, revendre ou distribuer les documents, en tout ou en partie ;</li>
          <li>les publier en ligne, y compris dans un groupe ou un espace de partage ;</li>
          <li>retirer ou modifier la mention de droit d'auteur.</li>
        </Liste>
        <p>
          Pour utiliser le matériel avec un groupe, consulte l'
          <Link to="/enseignants" className={lien}>
            offre aux enseignants
          </Link>
          .
        </p>
      </Section>

      <Section titre="6. Propriété intellectuelle">
        <p>
          Les textes, exercices, solutions, figures et documents du site sont
          protégés par le droit d'auteur (© 2026 MathPratique.ca). Les utiliser
          au-delà de ce que permettent ces conditions demande une autorisation écrite.
        </p>
      </Section>

      <Section titre="7. Le contenu pédagogique et les outils">
        <Liste>
          <li>
            Le contenu est préparé avec soin, mais une erreur peut s'y glisser. Si tu
            en trouves une, écris-nous : elle sera corrigée.
          </li>
          <li>
            Le calculateur de note donne une estimation à partir de ce que tu y
            entres. Il ne remplace ni ton plan de cours ni les règles d'évaluation
            de ton enseignante ou de ton enseignant.
          </li>
          <li>Aucun résultat scolaire n'est garanti.</li>
        </Liste>
      </Section>

      <Section titre="8. Disponibilité du site">
        <p>
          Le site peut être interrompu pour un entretien ou une mise à jour. Le
          contenu des packages peut être corrigé ou enrichi pendant ta période
          d'accès.
        </p>
      </Section>

      <Section titre="9. Modifications des conditions">
        <p>
          Ces conditions peuvent changer. La date de la version en vigueur est
          indiquée sur cette page, et un changement important est annoncé sur le
          site.
        </p>
      </Section>

      <Section titre="10. Droit applicable">
        <p>
          Ces conditions sont régies par les lois du Québec et les lois du Canada
          qui s'y appliquent.
        </p>
      </Section>

      <Section titre="11. Nous joindre">
        <p>
          Pour toute question :{" "}
          <a href={mailto} className={lien}>
            {EMAIL_CONTACT}
          </a>
          . Voir aussi la{" "}
          <Link to="/politique-de-confidentialite" className={lien}>
            politique de confidentialité
          </Link>
          .
        </p>
      </Section>
    </PageBrouillon>
  );
}
