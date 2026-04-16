import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy – Lead Flow AI" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-4 prose prose-neutral">
            <h1>Privacy Policy</h1>
            <p>Last updated: April 16, 2026</p>
            <p>Lead Flow AI ("we", "our", "us") is committed to protecting your privacy. This policy explains how we collect, use, and share information.</p>
            <h2>Information We Collect</h2>
            <p>We collect information you provide directly, such as your name, email, and company details. When you connect your Meta account, we access your lead data with your permission.</p>
            <h2>How We Use Your Information</h2>
            <p>We use your information to provide our services, sync your leads, generate AI insights, and improve our platform.</p>
            <h2>Data Security</h2>
            <p>All Meta access tokens are encrypted at rest. We use industry-standard security measures to protect your data.</p>
            <h2>Contact</h2>
            <p>Questions? Email us at privacy@leadflowai.com.</p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
