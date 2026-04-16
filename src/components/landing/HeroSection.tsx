import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-hero-gradient-from/80" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-hero-border bg-hero-surface px-4 py-1.5 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-hero-muted">AI-Powered Lead Management</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-hero-text leading-[1.1] mb-6">
            Capture, Organize & Convert{" "}
            <span className="gradient-text">Meta Leads</span>{" "}
            Faster
          </h1>

          <p className="text-lg sm:text-xl text-hero-muted max-w-2xl mb-10 leading-relaxed">
            Connect your Facebook & Instagram Lead Ads, automatically sync leads,
            assign them to your sales team, and close deals faster with AI-powered automation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/contact">Book a Demo</Link>
            </Button>
          </div>

          <div className="mt-12 flex items-center gap-8">
            <div>
              <p className="text-2xl font-bold text-hero-text">10K+</p>
              <p className="text-xs text-hero-muted">Leads Processed</p>
            </div>
            <div className="h-8 w-px bg-hero-border" />
            <div>
              <p className="text-2xl font-bold text-hero-text">500+</p>
              <p className="text-xs text-hero-muted">Businesses</p>
            </div>
            <div className="h-8 w-px bg-hero-border" />
            <div>
              <p className="text-2xl font-bold text-hero-text">98%</p>
              <p className="text-xs text-hero-muted">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
