import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileActionBar } from "@/components/MobileActionBar";
import { Dentists } from "@/components/sections/Dentists";
import { Faq } from "@/components/sections/Faq";
import { FindYourSolution } from "@/components/sections/FindYourSolution";
import { Hero } from "@/components/sections/Hero";
import { PatientCare } from "@/components/sections/PatientCare";
import { Results } from "@/components/sections/Results";
import { Reviews } from "@/components/sections/Reviews";
import { WhyChoose } from "@/components/sections/WhyChoose";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FindYourSolution />
        <Dentists />
        <Results />
        <WhyChoose />
        <Reviews />
        <Faq />
        <PatientCare />
      </main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
