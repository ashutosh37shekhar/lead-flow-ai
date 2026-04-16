import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service – Lead Flow AI" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-4 prose prose-neutral">
            <h1>Terms of Service</h1>
            <p>Last updated: April 16, 2026</p>
            <p>By using Lead Flow AI, you agree to these terms.</p>
            <h2>Use of Service</h2>
            <p>You must provide accurate information and maintain the security of your account. You are responsible for all activity under your account.</p>
            <h2>Meta Integration</h2>
            <p>By connecting your Meta account, you authorize us to access your lead ad data. We process this data solely to provide our services.</p>
            <h2>Limitation of Liability</h2>
            <p>Lead Flow AI is provided "as is." We are not liable for any indirect, incidental, or consequential damages.</p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
