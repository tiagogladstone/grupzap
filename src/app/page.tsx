import {
  Header,
  Hero,
  Problems,
  Features,
  HowItWorks,
  Pricing,
  Testimonials,
  FAQ,
  FinalCTA,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Problems />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
