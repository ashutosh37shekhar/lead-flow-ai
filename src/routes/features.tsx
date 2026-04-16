import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features – Lead Flow AI" },
      { name: "description", content: "Explore all features of Lead Flow AI: Meta lead syncing, pipeline management, AI scoring, and more." },
      { property: "og:title", content: "Features – Lead Flow AI" },
      { property: "og:description", content: "Everything you need to manage and convert Meta leads." },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <FeaturesSection />
        <CTASection />
      </div>
      <Footer />
    </div>
  );
}
