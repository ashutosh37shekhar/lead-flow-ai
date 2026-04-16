import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "Get started with basic lead management.",
    features: ["100 leads/month", "1 Meta page", "1 team member", "Basic pipeline", "CSV export"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    desc: "For growing teams that need more power.",
    features: ["5,000 leads/month", "5 Meta pages", "5 team members", "AI lead scoring", "Automations", "Priority support"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$149",
    period: "/month",
    desc: "For agencies and large businesses.",
    features: ["Unlimited leads", "Unlimited pages", "Unlimited team", "Advanced AI features", "Custom integrations", "Dedicated support", "API access"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-24 bg-secondary/30" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary mb-2">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground">Choose the plan that fits your business. Upgrade anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "border-primary bg-card shadow-xl ring-1 ring-primary/20 scale-[1.02]"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <p className="text-xs font-semibold text-primary mb-4">Most Popular</p>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                variant={plan.highlighted ? "default" : "outline"}
                size="lg"
                asChild
              >
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
