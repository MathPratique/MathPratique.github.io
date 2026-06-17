import Hero from "../components/home/Hero";
import StatsBar from "../components/home/StatsBar";
import Features from "../components/home/Features";
import TopicsShowcase from "../components/home/TopicsShowcase";
import Testimonials from "../components/home/Testimonials";
import CallToAction from "../components/home/CallToAction";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Features />
      <TopicsShowcase />
      <Testimonials />
      <CallToAction />
    </>
  );
}
