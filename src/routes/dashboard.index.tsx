import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users, Inbox, UserCheck } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

const stats = [
  { label: "Total Leads", icon: Inbox },
  { label: "Today's Leads", icon: TrendingUp },
  { label: "Assigned", icon: UserCheck },
  { label: "Unassigned", icon: Users },
];

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your lead overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">—</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">No data yet</span>
            </div>
          </div>
        ))}
      </div>

      <EmptyState
        title="No leads yet"
        description="Once you connect your Meta account, your latest leads from Facebook & Instagram will appear here in real time."
        icon={Inbox}
      />
    </div>
  );
}
