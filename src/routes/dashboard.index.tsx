import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Inbox, KanbanSquare, TrendingUp, Plug, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { AddLeadDialog } from "@/components/leads/AddLeadDialog";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const [stats, setStats] = useState({ total: 0, newThisWeek: 0, won: 0 });
  const [loading, setLoading] = useState(true);
  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    if (!currentWorkspace) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  async function load() {
    if (!currentWorkspace) return;
    setLoading(true);
    const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
    const [total, week, wonStages] = await Promise.all([
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("workspace_id", currentWorkspace.id),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("workspace_id", currentWorkspace.id).gte("created_at", weekAgo),
      supabase.from("pipeline_stages").select("id").eq("workspace_id", currentWorkspace.id).eq("is_won", true),
    ]);
    let wonCount = 0;
    const wonIds = (wonStages.data ?? []).map((s) => s.id);
    if (wonIds.length) {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", currentWorkspace.id)
        .in("stage_id", wonIds);
      wonCount = count ?? 0;
    }
    setStats({ total: total.count ?? 0, newThisWeek: week.count ?? 0, won: wonCount });
    setLoading(false);
  }

  if (wsLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {name}</h1>
          <p className="text-sm text-muted-foreground">Here's what's happening in {currentWorkspace?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/meta"><Plug className="h-4 w-4 mr-1" /> Connect Meta</Link>
          </Button>
          <AddLeadDialog onCreated={load} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total leads" value={loading ? "—" : stats.total} icon={Inbox} />
        <StatCard label="New this week" value={loading ? "—" : stats.newThisWeek} icon={TrendingUp} />
        <StatCard label="Won deals" value={loading ? "—" : stats.won} icon={KanbanSquare} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/dashboard/leads" className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors">
          <Inbox className="h-5 w-5 text-primary mb-2" />
          <h3 className="font-semibold">View all leads</h3>
          <p className="text-sm text-muted-foreground">Search, filter, assign, and bulk-update your leads.</p>
        </Link>
        <Link to="/dashboard/pipeline" className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors">
          <KanbanSquare className="h-5 w-5 text-primary mb-2" />
          <h3 className="font-semibold">Open pipeline board</h3>
          <p className="text-sm text-muted-foreground">Drag leads through your sales stages.</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
