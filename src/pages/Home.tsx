import Hero from "../components/home/Hero";
import StatsBar from "../components/home/StatsBar";
import Features from "../components/home/Features";
import TopicsShowcase from "../components/home/TopicsShowcase";
import CallToAction from "../components/home/CallToAction";

// La section de témoignages a été retirée : elle affichait le titre
// « Approuvé par les étudiants… » au-dessus d'un bloc vide, et les quatre
// témoignages du fichier de données étaient inventés — noms fictifs,
// nomenclature universitaire française. Une preuve sociale sans preuve fait
// plus de tort que pas de preuve du tout. À rétablir le jour où de vrais
// témoignages arrivent, avec l'accord de leurs auteurs.

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Features />
      <TopicsShowcase />
      <CallToAction />
    </>
  );
}
