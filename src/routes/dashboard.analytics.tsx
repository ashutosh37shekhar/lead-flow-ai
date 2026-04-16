import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Users, Inbox } from "lucide-react";

const dailyLeads = [12, 18, 25, 22, 30, 28, 35, 42, 38, 47, 40, 45, 52, 48];

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const max = Math.max(...dailyLeads);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Track your lead performance and team metrics</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "This Month", value: "1,284", icon: Inbox },
          { label: "Conversion Rate", value: "23%", icon: TrendingUp },
          { label: "Best Form", value: "Free Consultation", icon: BarChart3 },
          { label: "Active Staff", value: "4", icon: Users },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Leads per Day (Last 14 days)</h3>
        <div className="flex items-end gap-2 h-40">
          {dailyLeads.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
                style={{ height: `${(v / max) * 100}%` }}
              />
              <span className="text-[9px] text-muted-foreground">{i + 3}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
