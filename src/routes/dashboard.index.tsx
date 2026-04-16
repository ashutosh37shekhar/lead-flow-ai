import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users, Inbox, UserCheck, ArrowUpRight, ArrowDownRight } from "lucide-react";

const stats = [
  { label: "Total Leads", value: "1,284", change: "+12%", up: true, icon: Inbox },
  { label: "Today's Leads", value: "47", change: "+8%", up: true, icon: TrendingUp },
  { label: "Assigned", value: "1,102", change: "+5%", up: true, icon: UserCheck },
  { label: "Unassigned", value: "182", change: "-3%", up: false, icon: Users },
];

const recentLeads = [
  { name: "Sarah Miller", email: "sarah@example.com", phone: "+1 555-0123", source: "Facebook", form: "Free Consultation", status: "New", time: "2 min ago" },
  { name: "James Wilson", email: "james@example.com", phone: "+1 555-0456", source: "Instagram", form: "Get a Quote", status: "Contacted", time: "15 min ago" },
  { name: "Emily Davis", email: "emily@example.com", phone: "+1 555-0789", source: "Facebook", form: "Free Consultation", status: "Interested", time: "1 hr ago" },
  { name: "Michael Brown", email: "michael@example.com", phone: "+1 555-0321", source: "Facebook", form: "Newsletter", status: "New", time: "2 hrs ago" },
  { name: "Jessica Taylor", email: "jessica@example.com", phone: "+1 555-0654", source: "Instagram", form: "Get a Quote", status: "Converted", time: "3 hrs ago" },
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
            <p className="text-2xl font-bold">{s.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {s.up ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-xs font-medium ${s.up ? "text-success" : "text-destructive"}`}>{s.change}</span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold">Recent Leads</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Source</th>
                <th className="text-left p-4 font-medium">Form</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead) => (
                <tr key={lead.email} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-sm font-medium">{lead.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{lead.email}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-meta-blue/10 px-2 py-0.5 text-xs font-medium text-meta-blue">
                      {lead.source}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{lead.form}</td>
                  <td className="p-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{lead.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    New: "bg-info/10 text-info",
    Contacted: "bg-warning/10 text-warning",
    Interested: "bg-success/10 text-success",
    Converted: "bg-primary/10 text-primary",
    Lost: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
