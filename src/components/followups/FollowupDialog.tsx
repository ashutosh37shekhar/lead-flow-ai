import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { createFollowup, type FollowupType } from "@/lib/followups";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultLeadId?: string | null;
  onCreated?: () => void;
}

interface MemberOption { user_id: string; name: string; }

export function FollowupDialog({ open, onOpenChange, defaultLeadId = null, onCreated }: Props) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [leads, setLeads] = useState<{ id: string; full_name: string }[]>([]);

  const [type, setType] = useState<FollowupType>("call");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState<string>("");
  const [leadId, setLeadId] = useState<string | null>(defaultLeadId);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });

  useEffect(() => {
    if (!open || !currentWorkspace) return;
    setLeadId(defaultLeadId);

    void (async () => {
      const [{ data: mem }, { data: ld }] = await Promise.all([
        supabase
          .from("workspace_members")
          .select("user_id, role")
          .eq("workspace_id", currentWorkspace.id)
          .eq("is_active", true),
        supabase
          .from("leads")
          .select("id, full_name")
          .eq("workspace_id", currentWorkspace.id)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const ids = (mem ?? []).map((m) => m.user_id);
      let names: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ids);
        names = Object.fromEntries(
          (profs ?? []).map((p) => [p.id, p.full_name || p.email || "User"]),
        );
      }
      const list = (mem ?? []).map((m) => ({
        user_id: m.user_id,
        name: names[m.user_id] ?? "User",
      }));
      setMembers(list);
      setLeads(ld ?? []);
      if (!assignee && user) setAssignee(user.id);
    })();
  }, [open, currentWorkspace, defaultLeadId]);

  const handleSubmit = async () => {
    if (!user || !currentWorkspace) return;
    if (!title.trim()) return toast.error("Title is required");
    if (!assignee) return toast.error("Pick an assignee");

    setSubmitting(true);
    try {
      await createFollowup({
        workspace_id: currentWorkspace.id,
        lead_id: leadId,
        assigned_to: assignee,
        type,
        title: title.trim(),
        description: description.trim() || null,
        due_at: new Date(dueDate).toISOString(),
      }, user.id);
      toast.success("Follow-up scheduled");
      setTitle(""); setDescription("");
      onCreated?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New follow-up</DialogTitle>
          <DialogDescription>Schedule a task and the assignee will be notified.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as FollowupType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due</Label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call back to confirm pricing" />
          </div>

          <div className="space-y-1.5">
            <Label>Assignee *</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger><SelectValue placeholder="Pick agent" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!defaultLeadId && (
            <div className="space-y-1.5">
              <Label>Linked lead (optional)</Label>
              <Select value={leadId ?? "none"} onValueChange={(v) => setLeadId(v === "none" ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
