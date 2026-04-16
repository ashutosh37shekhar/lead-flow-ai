import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing – Lead Flow AI" },
      { name: "description", content: "Simple, transparent pricing. Start free and scale as your business grows." },
      { property: "og:title", content: "Pricing – Lead Flow AI" },
      { property: "og:description", content: "Plans starting from $0/month." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <PricingSection />
        <CTASection />
      </div>
      <Footer />
    </div>
  );
}
