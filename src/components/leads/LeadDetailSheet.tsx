import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Mail, Phone, MapPin, Briefcase, Tag, Activity, MessageSquare, Send,
  Shuffle, CalendarClock, CheckCircle2, Plus,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { updateLeadStage } from "@/lib/leads";
import { assignManual, assignRoundRobin } from "@/lib/team";
import { completeFollowup, formatDue, isOverdue, type Followup } from "@/lib/followups";
import { FollowupDialog } from "@/components/followups/FollowupDialog";
import { cn } from "@/lib/utils";

interface Props {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

interface LeadFull {
  id: string;
  workspace_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  business_interest: string | null;
  city: string | null;
  priority: "low" | "medium" | "high";
  score: number;
  tags: string[] | null;
  stage_id: string | null;
  source_id: string | null;
  pipeline_id: string | null;
  notes: string | null;
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  author_id: string | null;
  created_at: string;
  author_name?: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string | null;
  created_at: string;
  actor_id: string | null;
  actor_name?: string;
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
};

interface Member { user_id: string; name: string; }
interface FollowupRow extends Followup { /* */ }

export function LeadDetailSheet({ leadId, open, onOpenChange, onChanged }: Props) {
  const { user } = useAuth();
  const { currentWorkspace, canEdit, isAdmin } = useWorkspace();
  const [lead, setLead] = useState<LeadFull | null>(null);
  const [stages, setStages] = useState<{ id: string; name: string; color: string | null }[]>([]);
  const [sourceName, setSourceName] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [followups, setFollowups] = useState<FollowupRow[]>([]);
  const [followupOpen, setFollowupOpen] = useState(false);

  useEffect(() => {
    if (!open || !leadId || !currentWorkspace) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId, currentWorkspace]);

  async function load() {
    if (!leadId || !currentWorkspace) return;
    setLoading(true);
    const [{ data: l }, { data: st }, { data: ns }, { data: ac }, { data: mem }, { data: asg }, { data: fups }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
      supabase
        .from("pipeline_stages")
        .select("id, name, color, position")
        .eq("workspace_id", currentWorkspace.id)
        .order("position"),
      supabase
        .from("lead_notes")
        .select("id, content, author_id, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_logs")
        .select("id, type, description, created_at, actor_id")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("workspace_members")
        .select("user_id, role")
        .eq("workspace_id", currentWorkspace.id)
        .eq("is_active", true)
        .in("role", ["admin", "agent"]),
      supabase
        .from("lead_assignments")
        .select("assigned_to")
        .eq("lead_id", leadId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("followups")
        .select("*")
        .eq("lead_id", leadId)
        .order("due_at", { ascending: true }),
    ]);

    setLead((l as LeadFull) ?? null);
    setStages((st ?? []).map((s) => ({ id: s.id, name: s.name, color: s.color })));
    setAssignedTo((asg as any)?.assigned_to ?? null);
    setFollowups((fups ?? []) as Followup[]);

    if (l?.source_id) {
      const { data: src } = await supabase.from("lead_sources").select("name").eq("id", l.source_id).maybeSingle();
      setSourceName(src?.name ?? "");
    } else {
      setSourceName("");
    }

    const memberIds = (mem ?? []).map((m) => m.user_id);
    const userIds = Array.from(new Set([
      ...(ns ?? []).map((n) => n.author_id).filter(Boolean) as string[],
      ...(ac ?? []).map((a) => a.actor_id).filter(Boolean) as string[],
      ...memberIds,
    ]));
    let nameMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      nameMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name || p.email || "User"]));
    }

    setMembers(memberIds.map((id) => ({ user_id: id, name: nameMap[id] ?? "User" })));
    setNotes((ns ?? []).map((n) => ({ ...n, author_name: n.author_id ? nameMap[n.author_id] : "Unknown" })));
    setActivities((ac ?? []).map((a) => ({ ...a, actor_name: a.actor_id ? nameMap[a.actor_id] : "System" })));
    setLoading(false);
  }

  async function handleAssign(userId: string) {
    if (!lead || !user) return;
    try {
      await assignManual(lead.workspace_id, lead.id, userId, user.id);
      toast.success("Assigned");
      void load();
      onChanged?.();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleRoundRobin() {
    if (!lead || !user) return;
    try {
      const target = await assignRoundRobin(lead.workspace_id, lead.id, user.id);
      const name = members.find((m) => m.user_id === target)?.name ?? "agent";
      toast.success(`Auto-assigned to ${name}`);
      void load();
      onChanged?.();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleCompleteFollowup(id: string) {
    try { await completeFollowup(id); toast.success("Done"); void load(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function handleStageChange(newStageId: string) {
    if (!lead || !user) return;
    const stage = stages.find((s) => s.id === newStageId);
    if (!stage) return;
    try {
      await updateLeadStage(lead.id, lead.workspace_id, newStageId, stage.name, user.id);
      setLead({ ...lead, stage_id: newStageId });
      toast.success(`Moved to ${stage.name}`);
      void load();
      onChanged?.();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update stage");
    }
  }

  async function handleAddNote() {
    if (!newNote.trim() || !lead || !user) return;
    setSavingNote(true);
    const { error } = await supabase.from("lead_notes").insert({
      lead_id: lead.id,
      workspace_id: lead.workspace_id,
      author_id: user.id,
      content: newNote.trim(),
    });
    if (error) {
      toast.error(error.message);
    } else {
      await supabase.from("activity_logs").insert({
        workspace_id: lead.workspace_id,
        lead_id: lead.id,
        actor_id: user.id,
        type: "note_added",
        description: "Added a note",
      });
      setNewNote("");
      void load();
    }
    setSavingNote(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        {loading || !lead ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader className="p-6 border-b border-border">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {lead.full_name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-base truncate">{lead.full_name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className={cn("text-[10px]", priorityColors[lead.priority])}>{lead.priority}</Badge>
                    <span className="text-xs">Score: {lead.score}</span>
                    {sourceName && <span className="text-xs">· {sourceName}</span>}
                  </SheetDescription>
                </div>
              </div>

              {canEdit && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Stage</label>
                    <Select value={lead.stage_id ?? ""} onValueChange={handleStageChange}>
                      <SelectTrigger><SelectValue placeholder="No stage" /></SelectTrigger>
                      <SelectContent>
                        {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Assigned to</label>
                    <div className="flex gap-2">
                      <Select value={assignedTo ?? ""} onValueChange={handleAssign}>
                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                        <SelectContent>
                          {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {isAdmin && (
                        <Button variant="outline" size="icon" onClick={handleRoundRobin} title="Auto-assign (round-robin)">
                          <Shuffle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SheetHeader>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <Row icon={Phone} label="Phone" value={lead.phone} />
                {lead.email && <Row icon={Mail} label="Email" value={lead.email} />}
                {lead.business_interest && <Row icon={Briefcase} label="Interest" value={lead.business_interest} />}
                {lead.city && <Row icon={MapPin} label="City" value={lead.city} />}
                {lead.tags && lead.tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  </div>
                )}
              </div>

              <Tabs defaultValue="notes">
                <TabsList className="w-full">
                  <TabsTrigger value="notes" className="flex-1"><MessageSquare className="h-3.5 w-3.5 mr-1" /> Notes</TabsTrigger>
                  <TabsTrigger value="followups" className="flex-1"><CalendarClock className="h-3.5 w-3.5 mr-1" /> Follow-ups</TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1"><Activity className="h-3.5 w-3.5 mr-1" /> Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="space-y-3 mt-4">
                  {canEdit && (
                    <div className="flex gap-2">
                      <Textarea
                        rows={2}
                        placeholder="Write a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                      <Button size="icon" onClick={handleAddNote} disabled={savingNote || !newNote.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="space-y-2">
                    {notes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet</p>}
                    {notes.map((n) => (
                      <div key={n.id} className="rounded-lg border border-border bg-card/50 p-3">
                        <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {n.author_name} · {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="followups" className="space-y-2 mt-4">
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => setFollowupOpen(true)} className="w-full">
                      <Plus className="h-4 w-4" /> New follow-up
                    </Button>
                  )}
                  {followups.length === 0 && <p className="text-xs text-muted-foreground">No follow-ups</p>}
                  {followups.map((f) => {
                    const overdue = isOverdue(f);
                    return (
                      <div key={f.id} className={cn(
                        "flex items-center gap-2 rounded-lg border p-2.5",
                        overdue && "border-destructive/30 bg-destructive/5",
                        f.status === "completed" && "opacity-60",
                      )}>
                        <CalendarClock className={cn("h-4 w-4 shrink-0", overdue ? "text-destructive" : "text-muted-foreground")} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{f.title}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatDue(f.due_at)} · {f.type}
                            {overdue && " · Overdue"}
                            {f.status === "completed" && " · Done"}
                          </div>
                        </div>
                        {f.status === "pending" && (
                          <Button size="icon" variant="ghost" onClick={() => handleCompleteFollowup(f.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </TabsContent>

                <TabsContent value="activity" className="space-y-2 mt-4">
                  {activities.length === 0 && <p className="text-xs text-muted-foreground">No activity</p>}
                  {activities.map((a) => (
                    <div key={a.id} className="flex gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs">{a.description ?? a.type}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {a.actor_name} · {new Date(a.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
      <FollowupDialog
        open={followupOpen}
        onOpenChange={setFollowupOpen}
        defaultLeadId={lead?.id ?? null}
        onCreated={load}
      />
    </Sheet>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
