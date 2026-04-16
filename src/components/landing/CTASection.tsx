import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 hero-gradient">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-hero-text mb-4">
          Ready to supercharge your lead management?
        </h2>
        <p className="text-hero-muted text-lg mb-8 max-w-xl mx-auto">
          Start your free trial today. No credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="xl" asChild>
            <Link to="/signup">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="heroOutline" size="xl" asChild>
            <Link to="/contact">Talk to Sales</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
