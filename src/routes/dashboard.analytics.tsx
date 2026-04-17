import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Users, Inbox } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const cards = [
    { label: "This Month", icon: Inbox },
    { label: "Conversion Rate", icon: TrendingUp },
    { label: "Best Form", icon: BarChart3 },
    { label: "Active Staff", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Track your lead performance and team metrics</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">—</p>
          </div>
        ))}
      </div>

      <EmptyState
        title="No analytics data yet"
        description="Charts and performance metrics will populate here once leads start flowing in from your connected Meta account."
        icon={BarChart3}
      />
    </div>
  );
}
