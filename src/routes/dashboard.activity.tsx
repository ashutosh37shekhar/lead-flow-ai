import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Loader2, Filter, UserPlus, Inbox, MoveRight, FileEdit, Settings,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/activity")({
  component: ActivityPage,
});

interface Log {
  id: string;
  type: string;
  description: string | null;
  metadata: any;
  created_at: string;
  actor_id: string | null;
  lead_id: string | null;
  actor_name?: string;
  lead_name?: string;
}

const typeIcon: Record<string, typeof Activity> = {
  "lead.created": Inbox,
  "lead_created": Inbox,
  "lead.assigned": UserPlus,
  "stage_changed": MoveRight,
  "lead.updated": FileEdit,
};

const typeColor: Record<string, string> = {
  "lead.created": "bg-primary/15 text-primary",
  "lead_created": "bg-primary/15 text-primary",
  "lead.assigned": "bg-success/15 text-success",
  "stage_changed": "bg-warning/15 text-warning",
};

function ActivityPage() {
  const { currentWorkspace } = useWorkspace();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("created_at", { ascending: false })
      .limit(500);

    const list = (data ?? []) as Log[];
    const actorIds = Array.from(new Set(list.map((l) => l.actor_id).filter(Boolean))) as string[];
    const leadIds = Array.from(new Set(list.map((l) => l.lead_id).filter(Boolean))) as string[];

    const [profs, leads] = await Promise.all([
      actorIds.length
        ? supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
        : Promise.resolve({ data: [] as any[] }),
      leadIds.length
        ? supabase.from("leads").select("id, full_name").in("id", leadIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profMap = Object.fromEntries((profs.data ?? []).map((p: any) => [p.id, p.full_name || p.email || "User"]));
    const leadMap = Object.fromEntries((leads.data ?? []).map((l: any) => [l.id, l.full_name]));

    setLogs(list.map((l) => ({
      ...l,
      actor_name: l.actor_id ? profMap[l.actor_id] : "System",
      lead_name: l.lead_id ? leadMap[l.lead_id] : undefined,
    })));
    setLoading(false);
  };

  useEffect(() => { void fetchLogs(); }, [currentWorkspace?.id]);

  const types = useMemo(
    () => Array.from(new Set(logs.map((l) => l.type))),
    [logs],
  );

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (typeFilter !== "all" && l.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (l.description ?? "").toLowerCase().includes(q) ||
               (l.actor_name ?? "").toLowerCase().includes(q) ||
               (l.lead_name ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, typeFilter, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity log</h1>
        <p className="text-sm text-muted-foreground">All actions taken in this workspace</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search description, actor, lead…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Actions will be recorded here as your team works on leads."
          icon={Activity}
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="divide-y">
            {filtered.map((log) => {
              const Icon = typeIcon[log.type] ?? Activity;
              return (
                <div key={log.id} className="flex items-start gap-4 p-4">
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                    typeColor[log.type] ?? "bg-muted text-muted-foreground",
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{log.actor_name}</span>
                      <span className="text-muted-foreground"> — {log.description ?? log.type}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{log.type}</Badge>
                      {log.lead_name && <span>· lead: {log.lead_name}</span>}
                      <span>· {new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
