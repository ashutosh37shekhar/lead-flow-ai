import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Filter, Download, Inbox, Loader2, ArrowUpDown, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AddLeadDialog } from "@/components/leads/AddLeadDialog";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { deleteLeads, exportLeadsToCSV, type Lead } from "@/lib/leads";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/leads")({
  component: LeadsPage,
});

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
};

function LeadsPage() {
  const { currentWorkspace, isAdmin, loading: wsLoading } = useWorkspace();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string }[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "score">("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWorkspace) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  async function loadAll() {
    if (!currentWorkspace) return;
    setLoading(true);
    const [{ data: ls }, { data: st }, { data: src }] = await Promise.all([
      supabase.from("leads").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }),
      supabase.from("pipeline_stages").select("id, name").eq("workspace_id", currentWorkspace.id),
      supabase.from("lead_sources").select("id, name").eq("workspace_id", currentWorkspace.id),
    ]);
    setLeads((ls as Lead[]) ?? []);
    setStages((st ?? []).map((s) => ({ id: s.id, name: s.name })));
    setSources((src ?? []).map((s) => ({ id: s.id, name: s.name })));
    setLoading(false);
  }

  const stageMap = useMemo(() => Object.fromEntries(stages.map((s) => [s.id, s.name])), [stages]);
  const sourceMap = useMemo(() => Object.fromEntries(sources.map((s) => [s.id, s.name])), [sources]);

  const filtered = useMemo(() => {
    let out = leads;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (l) =>
          l.full_name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          (l.email ?? "").toLowerCase().includes(q)
      );
    }
    if (filterStage !== "all") out = out.filter((l) => l.stage_id === filterStage);
    if (filterSource !== "all") out = out.filter((l) => l.source_id === filterSource);
    if (filterPriority !== "all") out = out.filter((l) => l.priority === filterPriority);

    out = [...out].sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortBy === "newest" ? tb - ta : ta - tb;
    });
    return out;
  }, [leads, search, filterStage, filterSource, filterPriority, sortBy]);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map((l) => l.id)) : new Set());
  };
  const toggleOne = (id: string, checked: boolean) => {
    const s = new Set(selected);
    if (checked) s.add(id);
    else s.delete(id);
    setSelected(s);
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) return toast.error("Only admins can delete leads");
    if (!confirm(`Delete ${selected.size} lead(s)?`)) return;
    try {
      await deleteLeads(Array.from(selected));
      toast.success(`Deleted ${selected.size} leads`);
      setSelected(new Set());
      void loadAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBulkStage = async (newStageId: string) => {
    if (!user || !currentWorkspace) return;
    const stage = stages.find((s) => s.id === newStageId);
    const ids = Array.from(selected);
    const { error } = await supabase.from("leads").update({ stage_id: newStageId }).in("id", ids);
    if (error) return toast.error(error.message);
    await supabase.from("activity_logs").insert(
      ids.map((leadId) => ({
        workspace_id: currentWorkspace.id,
        lead_id: leadId,
        actor_id: user.id,
        type: "stage_changed",
        description: `Stage changed to "${stage?.name ?? "—"}" (bulk)`,
      }))
    );
    toast.success("Updated stages");
    setSelected(new Set());
    void loadAll();
  };

  if (wsLoading || !currentWorkspace) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Manage all your captured leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportLeadsToCSV(filtered, stageMap, sourceMap)}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <AddLeadDialog onCreated={loadAll} />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, phone, email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[140px]"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[140px]"><ArrowUpDown className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="score">Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center gap-3 flex-wrap">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Select onValueChange={handleBulkStage}>
            <SelectTrigger className="h-8 w-[180px] bg-background"><SelectValue placeholder="Move to stage" /></SelectTrigger>
            <SelectContent>
              {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        leads.length === 0 ? (
          <EmptyState
            title="No leads yet"
            description="Add your first lead manually, or connect Meta to sync from your Facebook & Instagram lead forms."
            icon={Inbox}
            showConnectMeta={false}
          />
        ) : (
          <div className="text-center py-16 text-sm text-muted-foreground">No leads match your filters.</div>
        )
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onCheckedChange={(c) => toggleAll(!!c)}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow
                  key={l.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setOpenLeadId(l.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(l.id)} onCheckedChange={(c) => toggleOne(l.id, !!c)} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{l.full_name}</div>
                    {l.email && <div className="text-xs text-muted-foreground">{l.email}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{l.phone}</TableCell>
                  <TableCell className="text-sm">{l.stage_id ? stageMap[l.stage_id] ?? "—" : "—"}</TableCell>
                  <TableCell className="text-sm">{l.source_id ? sourceMap[l.source_id] ?? "—" : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px]", priorityColors[l.priority])}>{l.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">{l.score}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LeadDetailSheet
        leadId={openLeadId}
        open={!!openLeadId}
        onOpenChange={(o) => !o && setOpenLeadId(null)}
        onChanged={loadAll}
      />
    </div>
  );
}
