import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lead Flow AI – Capture, Organize & Convert Meta Leads Faster" },
      { name: "description", content: "Connect your Facebook & Instagram Lead Ads, automatically sync leads, assign to your sales team, and close deals faster with AI-powered automation." },
      { property: "og:title", content: "Lead Flow AI – AI-Powered Meta Lead Management" },
      { property: "og:description", content: "Capture, organize & convert Meta leads faster with AI-powered automation." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
