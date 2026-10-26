import { Link } from "react-router-dom";
import PageBrouillon, { Liste, Section } from "../components/legal/PageBrouillon";
import { EMAIL_CONTACT } from "../data/site";

// BROUILLON du 2026-10-26 — à faire réviser avant d'être lié au pied de page.
// Rédigé en tenant compte de la Loi 25 (Loi sur la protection des
// renseignements personnels dans le secteur privé, telle que modifiée).
//
// À RÉVISER — points connus, à régler avant l'ouverture des ventes :
//   1. Google Analytics est chargé d'office (index.html), sans consentement
//      préalable. La Loi 25 exige que les technologies permettant
//      d'identifier, de localiser ou d'effectuer un profilage soient
//      désactivées par défaut : prévoir un mécanisme de consentement, puis
//      ajuster la section « Témoins et mesure d'audience ».
//   2. Communication de renseignements à l'extérieur du Québec (Stripe,
//      Google Analytics, Firebase Authentication) : une évaluation d'impact
//      sur la confidentialité (EFVP, au sens de la Loi 25) est requise au
//      préalable.
//   3. Titre exact du responsable de la protection des renseignements
//      personnels (la loi exige de publier son titre et ses coordonnées).
//   4. Durées de conservation : celle des renseignements de paiement et
//      d'accès doit suivre les obligations fiscales.
//   5. Vérifier la région d'hébergement de Firestore et de Cloud Storage
//      (le texte reprend celui du formulaire d'inscription : « serveurs
//      situés au Canada »).
//   6. Le jour où « Quiz à partir de mes notes » ouvrira, ajouter le
//      traitement des notes envoyées à un service d'analyse externe.

const mailto = `mailto:${EMAIL_CONTACT}`;
const lien = "font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800";

function Courriel() {
  return (
    <a href={mailto} className={lien}>
      {EMAIL_CONTACT}
    </a>
  );
}

export default function PolitiqueConfidentialite() {
  return (
    <PageBrouillon
      titre="Politique de confidentialité"
      description="Comment MathPratique.ca recueille, utilise et protège tes renseignements personnels, et comment exercer tes droits."
    >
      <Section titre="1. Qui est responsable de tes renseignements">
        <p>
          MathPratique.ca est responsable des renseignements personnels qu'il
          recueille. La personne responsable de la protection des renseignements
          personnels est joignable à <Courriel />.
        </p>
      </Section>

      <Section titre="2. Les renseignements recueillis">
        <p>
          <strong>Sans compte.</strong> Tu peux faire les exercices gratuits, le quiz
          et le calculateur de note sans donner aucun renseignement. Le site mesure
          seulement sa fréquentation (voir la section 6). Certaines saisies, comme
          celles du calculateur, restent dans ton navigateur et ne nous sont jamais
          transmises.
        </p>
        <p>
          <strong>Avec un compte.</strong>
        </p>
        <Liste>
          <li>
            ton adresse courriel et ton mot de passe — le mot de passe est géré par le
            service d'authentification et nous n'y avons jamais accès en clair ;
          </li>
          <li>
            ton accès : le cours, le type d'accès, ses dates de début et de fin, et
            si un document a déjà été téléchargé (pour appliquer la politique de
            remboursement) ;
          </li>
          <li>ta progression : les exercices que tu marques « complété » ou « à revoir ».</li>
        </Liste>
        <p>
          <strong>Lors d'un achat.</strong> Le paiement est fait chez Stripe. Nous ne
          voyons jamais ton numéro de carte. Nous recevons ton adresse courriel, le
          montant, la date et les identifiants de la transaction.
        </p>
        <p>
          <strong>Quand tu nous écris.</strong> Ton message et ton adresse courriel,
          pour te répondre.
        </p>
      </Section>

      <Section titre="3. Pourquoi nous les utilisons">
        <Liste>
          <li>créer et gérer ton compte ;</li>
          <li>te donner accès au matériel acheté, pour la durée prévue ;</li>
          <li>appliquer la politique de remboursement ;</li>
          <li>traiter les paiements et tenir les registres comptables ;</li>
          <li>répondre à tes messages ;</li>
          <li>améliorer le site à partir de statistiques de fréquentation.</li>
        </Liste>
        <p>
          Tes renseignements ne sont ni vendus ni utilisés à d'autres fins que
          celles-ci sans ton consentement.
        </p>
      </Section>

      <Section titre="4. Ton consentement">
        <p>
          En créant un compte ou en achetant un package, tu consens à ce que tes
          renseignements soient utilisés aux fins décrites ici. Tu peux retirer ce
          consentement en tout temps en demandant la suppression de ton compte ; tu
          perds alors l'accès au matériel lié à ce compte.
        </p>
      </Section>

      <Section titre="5. Les services qui traitent tes renseignements">
        <Liste>
          <li>
            <strong>Google (Firebase)</strong> : authentification, base de données,
            fonctions et stockage des documents. Le contenu de ton compte est
            conservé sur des serveurs situés au Canada ; certains renseignements liés
            à ton authentification peuvent être traités à l'extérieur du Québec.
          </li>
          <li>
            <strong>Stripe</strong> : paiements. Stripe peut traiter tes
            renseignements à l'extérieur du Québec et du Canada.
          </li>
          <li>
            <strong>Google Analytics</strong> : statistiques de fréquentation, traitées
            à l'extérieur du Canada.
          </li>
        </Liste>
        <p>
          Ces fournisseurs n'utilisent tes renseignements que pour rendre leur
          service au site.
        </p>
      </Section>

      <Section titre="6. Témoins et mesure d'audience">
        <p>
          Le site utilise Google Analytics pour savoir quelles pages sont consultées
          et sur quels appareils. Cet outil dépose des témoins (« cookies ») dans ton
          navigateur et peut déduire une région approximative. Ces statistiques
          servent uniquement à améliorer le site.
        </p>
        <p>
          Le site garde aussi certaines données dans ton navigateur, comme ta saisie
          dans le calculateur de note. Elles restent sur ton appareil, et tu peux les
          effacer en tout temps (bouton « Réinitialiser » du calculateur, ou
          paramètres de ton navigateur).
        </p>
      </Section>

      <Section titre="7. Combien de temps nous les gardons">
        <Liste>
          <li>les renseignements de ton compte : tant que ton compte existe ;</li>
          <li>
            les renseignements d'accès et de paiement : aussi longtemps que l'exigent
            les obligations comptables et fiscales ;
          </li>
          <li>les messages échangés : le temps nécessaire pour y répondre et en assurer le suivi.</li>
        </Liste>
        <p>
          À la suppression de ton compte, tes renseignements sont détruits ou
          anonymisés, sauf ceux qu'une loi oblige à conserver.
        </p>
      </Section>

      <Section titre="8. La sécurité de tes renseignements">
        <p>
          L'accès aux renseignements est limité par des règles strictes : chaque
          compte ne peut lire que ses propres données. Les échanges avec le site sont
          chiffrés, les documents sont remis par des liens temporaires, et le
          paiement se fait entièrement chez Stripe.
        </p>
      </Section>

      <Section titre="9. Tes droits">
        <p>Tu peux en tout temps :</p>
        <Liste>
          <li>savoir quels renseignements nous détenons sur toi et en obtenir une copie ;</li>
          <li>faire corriger un renseignement inexact ou incomplet ;</li>
          <li>demander la suppression de ton compte et de tes renseignements ;</li>
          <li>retirer ton consentement ;</li>
          <li>recevoir tes renseignements dans un format structuré et couramment utilisé.</li>
        </Liste>
        <p>
          Écris à <Courriel /> : une réponse t'est donnée dans les 30 jours. Si tu
          n'es pas satisfait de la réponse, tu peux t'adresser à la Commission
          d'accès à l'information du Québec.
        </p>
      </Section>

      <Section titre="10. Les personnes mineures">
        <p>
          Le site s'adresse aux étudiantes et aux étudiants du collégial. Une personne
          de moins de 14 ans ne peut créer un compte qu'avec le consentement de son
          parent ou de son tuteur.
        </p>
      </Section>

      <Section titre="11. Les incidents de confidentialité">
        <p>
          Tout incident de confidentialité est consigné dans un registre. S'il
          présente un risque de préjudice sérieux, les personnes concernées et la
          Commission d'accès à l'information en sont avisées.
        </p>
      </Section>

      <Section titre="12. Les modifications de cette politique">
        <p>
          Cette politique peut changer. La date de la version en vigueur est indiquée
          sur cette page. Voir aussi les{" "}
          <Link to="/conditions-d-utilisation" className={lien}>
            conditions d'utilisation
          </Link>
          .
        </p>
      </Section>
    </PageBrouillon>
  );
}
