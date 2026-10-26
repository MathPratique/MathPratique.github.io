// Boutique — grille des 4 cours.
//
// Un seul package est en vente pour l'instant (Calcul différentiel), les
// trois autres sont visibles mais inertes. Cliquer sur la carte disponible
// mène à /boutique/<slug>, où la page package existante prend le relais.

import AnimatedSection from "../components/ui/AnimatedSection";
import CarteBoutique, {
  type ProduitCarte,
} from "../components/shop/CarteBoutique";
import { topics } from "../data/topics";
import { TARIFS_CALCUL_DIFFERENTIEL } from "../data/tarifs";
// La liste des packages en vente vit dans `data/boutique.ts` depuis le
// 2026-10-26 : l'accueil la lit aussi. Ajouter un cours en vente se fait là.
import { PRODUITS_PAR_TOPIC } from "../data/boutique";

// Fallback pour les cours pas encore en vente : carte inerte, sans prix.
const A_VENIR: ProduitCarte = {
  prix: 0,
  devise: TARIFS_CALCUL_DIFFERENTIEL.devise,
  href: "",
  disponible: false,
};

export default function Boutique() {
  return (
    <div className="container-page py-12 sm:py-16">
      <AnimatedSection className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance text-4xl font-bold sm:text-5xl">Boutique</h1>
        <p className="mt-4 text-balance text-lg text-ink-600">
          Un package par cours : notes complètes, exercices classés, examens
          intra et finaux corrigés. Un seul paiement, 12 mois d'accès, aucun
          abonnement.
        </p>
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="mt-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {topics.map((topic, i) => {
            const produit = PRODUITS_PAR_TOPIC[topic.id] ?? A_VENIR;
            return (
              <AnimatedSection key={topic.id} delay={i * 0.06}>
                <CarteBoutique topic={topic} produit={produit} />
              </AnimatedSection>
            );
          })}
        </div>
      </AnimatedSection>
    </div>
  );
}
