import { Zap, Users, BarChart3, Bell, Brain, ArrowRightLeft, Download, Shield } from "lucide-react";

const features = [
  { icon: Zap, title: "Meta Lead Syncing", desc: "Auto-sync leads from Facebook & Instagram Lead Ads in real-time via webhooks." },
  { icon: ArrowRightLeft, title: "Lead Pipeline", desc: "Kanban-style pipeline to track leads through every stage of your funnel." },
  { icon: Users, title: "Team Assignment", desc: "Assign leads to staff with round-robin or rule-based auto-assignment." },
  { icon: Bell, title: "Smart Notifications", desc: "Get notified instantly when new leads arrive or follow-ups are due." },
  { icon: Brain, title: "AI Lead Scoring", desc: "AI analyzes leads and scores them as Hot, Warm, or Cold automatically." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track conversions, team performance, and campaign ROI at a glance." },
  { icon: Download, title: "Export & Import", desc: "Export leads to CSV/Excel or bulk import from external sources." },
  { icon: Shield, title: "Secure & Multi-tenant", desc: "Enterprise-grade security with strict tenant isolation and encrypted tokens." },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-primary mb-2">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything you need to manage leads
          </h2>
          <p className="text-muted-foreground">
            A complete toolkit to capture, organize, and convert your Meta advertising leads.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
