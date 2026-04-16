import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About – Lead Flow AI" },
      { name: "description", content: "Learn about Lead Flow AI and our mission to simplify lead management for businesses." },
      { property: "og:title", content: "About – Lead Flow AI" },
      { property: "og:description", content: "Our mission is to simplify lead management." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight mb-6">About Lead Flow AI</h1>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Lead Flow AI was built to solve a simple problem: businesses running Meta ads were losing leads.
              Leads would come in from Facebook and Instagram, sit in spreadsheets, and go cold before anyone followed up.
            </p>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              We built a platform that connects directly to your Meta Lead Ads, syncs leads in real-time,
              scores them with AI, and assigns them to your team — all automatically.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you're a solo business owner or an agency managing dozens of clients, Lead Flow AI
              gives you the tools to capture, organize, and convert leads faster than ever.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
