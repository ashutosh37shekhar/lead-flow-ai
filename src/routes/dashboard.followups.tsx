import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock, Plus, CheckCircle2, AlertTriangle, XCircle, Phone, Mail,
  MessageSquare, Users, MoreHorizontal, ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { FollowupDialog } from "@/components/followups/FollowupDialog";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import {
  cancelFollowup, completeFollowup, deleteFollowup, formatDue, isOverdue,
  type Followup, type FollowupType,
} from "@/lib/followups";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/followups")({
  component: FollowupsPage,
});

const typeIcon: Record<FollowupType, typeof Phone> = {
  call: Phone,
  email: Mail,
  whatsapp: MessageSquare,
  meeting: Users,
  other: CalendarClock,
};

const typeLabel: Record<FollowupType, string> = {
  call: "Call", email: "Email", whatsapp: "WhatsApp", meeting: "Meeting", other: "Task",
};

interface FollowupRow extends Followup {
  lead_name?: string | null;
  assignee_name?: string | null;
}

function FollowupsPage() {
  const { user } = useAuth();
  const { currentWorkspace, canEdit } = useWorkspace();
  const [items, setItems] = useState<FollowupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [filter, setFilter] = useState<"all" | "overdue" | "today" | "upcoming" | "completed">("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  });

  const fetchData = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    const { data: fups } = await supabase
      .from("followups")
      .select("*")
      .eq("workspace_id", currentWorkspace.id)
      .order("due_at", { ascending: true });

    const list = (fups ?? []) as Followup[];
    const leadIds = Array.from(new Set(list.map((f) => f.lead_id).filter(Boolean))) as string[];
    const userIds = Array.from(new Set(list.map((f) => f.assigned_to)));

    const [leadsRes, profsRes] = await Promise.all([
      leadIds.length
        ? supabase.from("leads").select("id, full_name").in("id", leadIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
      userIds.length
        ? supabase.from("profiles").select("id, full_name, email").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string | null }[] }),
    ]);
    const leadMap = Object.fromEntries((leadsRes.data ?? []).map((l) => [l.id, l.full_name]));
    const profMap = Object.fromEntries((profsRes.data ?? []).map((p) => [p.id, p.full_name || p.email || "User"]));

    setItems(list.map((f) => ({
      ...f,
      lead_name: f.lead_id ? leadMap[f.lead_id] ?? null : null,
      assignee_name: profMap[f.assigned_to] ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => { void fetchData(); }, [currentWorkspace]);

  // Realtime
  useEffect(() => {
    if (!currentWorkspace) return;
    const ch = supabase
      .channel(`followups:${currentWorkspace.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "followups",
        filter: `workspace_id=eq.${currentWorkspace.id}`,
      }, () => { void fetchData(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [currentWorkspace?.id]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);
    return items.filter((f) => {
      if (scope === "mine" && f.assigned_to !== user?.id) return false;
      if (filter === "overdue") return f.status === "pending" && new Date(f.due_at).getTime() < now;
      if (filter === "today") {
        const t = new Date(f.due_at).getTime();
        return f.status === "pending" && t >= startOfDay.getTime() && t <= endOfDay.getTime();
      }
      if (filter === "upcoming") return f.status === "pending" && new Date(f.due_at).getTime() > now;
      if (filter === "completed") return f.status === "completed";
      return true;
    });
  }, [items, scope, filter, user?.id]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      overdue: items.filter((f) => f.status === "pending" && new Date(f.due_at).getTime() < now).length,
      today: items.filter((f) => {
        const t = new Date(f.due_at).getTime();
        const s = new Date(); s.setHours(0,0,0,0);
        const e = new Date(); e.setHours(23,59,59,999);
        return f.status === "pending" && t >= s.getTime() && t <= e.getTime();
      }).length,
      upcoming: items.filter((f) => f.status === "pending" && new Date(f.due_at).getTime() > Date.now()).length,
      completed: items.filter((f) => f.status === "completed").length,
    };
  }, [items]);

  const handleComplete = async (id: string) => {
    try { await completeFollowup(id); toast.success("Marked done"); void fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleCancel = async (id: string) => {
    try { await cancelFollowup(id); toast.success("Cancelled"); void fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleDelete = async (id: string) => {
    try { await deleteFollowup(id); toast.success("Deleted"); void fetchData(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follow-ups</h1>
          <p className="text-sm text-muted-foreground">Tasks and reminders for your team</p>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New follow-up
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Overdue" value={stats.overdue} tone="danger" icon={AlertTriangle} />
        <StatCard label="Due today" value={stats.today} tone="warn" icon={CalendarClock} />
        <StatCard label="Upcoming" value={stats.upcoming} tone="default" icon={CalendarClock} />
        <StatCard label="Completed" value={stats.completed} tone="success" icon={CheckCircle2} />
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={(v) => setScope(v as any)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="mine">My follow-ups</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="today">Due today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : view === "list" ? (
        filtered.length === 0 ? (
          <EmptyState
            title="No follow-ups"
            description="Create your first follow-up task or wait for one to be auto-scheduled when a new lead arrives."
            icon={CalendarClock}
          />
        ) : (
          <div className="rounded-lg border border-border bg-card divide-y">
            {filtered.map((f) => {
              const Icon = typeIcon[f.type];
              const overdue = isOverdue(f);
              return (
                <div key={f.id} className={cn("flex items-center gap-4 p-4", overdue && "bg-destructive/5")}>
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    f.status === "completed" ? "bg-success/15 text-success"
                      : overdue ? "bg-destructive/15 text-destructive"
                      : "bg-primary/10 text-primary",
                  )}>
                    {f.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{f.title}</span>
                      <Badge variant="outline" className="text-xs">{typeLabel[f.type]}</Badge>
                      {overdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                      {f.status === "completed" && <Badge className="text-xs bg-success text-success-foreground">Done</Badge>}
                      {f.status === "cancelled" && <Badge variant="secondary" className="text-xs">Cancelled</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{formatDue(f.due_at)}</span>
                      {f.lead_name && <><span>·</span><span>{f.lead_name}</span></>}
                      {f.assignee_name && <><span>·</span><span>@{f.assignee_name}</span></>}
                    </div>
                  </div>
                  {f.status === "pending" && (f.assigned_to === user?.id || canEdit) && (
                    <Button size="sm" variant="outline" onClick={() => handleComplete(f.id)}>
                      <CheckCircle2 className="h-4 w-4" /> Done
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {f.status === "pending" && (
                        <DropdownMenuItem onClick={() => handleCancel(f.id)}>
                          <XCircle className="h-4 w-4" /> Cancel
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(f.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <CalendarView
          month={calMonth}
          onPrev={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() - 1); setCalMonth(d); }}
          onNext={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() + 1); setCalMonth(d); }}
          items={filtered}
          onComplete={handleComplete}
        />
      )}

      <FollowupDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={fetchData} />
    </div>
  );
}

function StatCard({ label, value, tone, icon: Icon }: {
  label: string; value: number; tone: "danger" | "warn" | "default" | "success"; icon: typeof CalendarClock;
}) {
  const toneClasses = {
    danger: "bg-destructive/10 text-destructive",
    warn: "bg-warning/15 text-warning",
    default: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", toneClasses)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function CalendarView({ month, onPrev, onNext, items, onComplete }: {
  month: Date;
  onPrev: () => void; onNext: () => void;
  items: FollowupRow[];
  onComplete: (id: string) => void;
}) {
  const monthLabel = month.toLocaleString(undefined, { month: "long", year: "numeric" });
  const firstWeekday = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay: Record<string, FollowupRow[]> = {};
  for (const f of items) {
    const d = new Date(f.due_at);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    (byDay[k] ??= []).push(f);
  }
  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <Button variant="ghost" size="icon" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="font-medium">{monthLabel}</div>
        <Button variant="ghost" size="icon" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-7 text-xs text-muted-foreground bg-muted/50">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="p-2 text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="min-h-[110px] border-t border-r border-border bg-muted/20" />;
          const k = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`;
          const dayItems = byDay[k] ?? [];
          const isToday = cell.getTime() === today.getTime();
          return (
            <div key={i} className={cn(
              "min-h-[110px] border-t border-r border-border p-1.5 flex flex-col gap-1",
              isToday && "bg-primary/5",
            )}>
              <div className={cn("text-xs font-medium", isToday && "text-primary")}>{cell.getDate()}</div>
              <div className="flex-1 space-y-1 overflow-hidden">
                {dayItems.slice(0, 3).map((f) => {
                  const overdue = isOverdue(f);
                  return (
                    <button
                      key={f.id}
                      onClick={() => f.status === "pending" && onComplete(f.id)}
                      className={cn(
                        "w-full text-left text-[11px] px-1.5 py-1 rounded truncate",
                        f.status === "completed" ? "bg-success/15 text-success line-through"
                          : overdue ? "bg-destructive/15 text-destructive"
                          : "bg-primary/10 text-primary hover:bg-primary/20",
                      )}
                      title={f.title}
                    >
                      {new Date(f.due_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · {f.title}
                    </button>
                  );
                })}
                {dayItems.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1.5">+{dayItems.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
