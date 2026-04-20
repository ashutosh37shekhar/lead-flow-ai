import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { createLead } from "@/lib/leads";

const schema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(5, "Phone is required").max(30),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  business_interest: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  pipeline_id: z.string().optional(),
  stage_id: z.string().optional(),
  source_id: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  tags: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  assigned_to: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  trigger?: React.ReactNode;
  onCreated?: () => void;
}

export function AddLeadDialog({ trigger, onCreated }: Props) {
  const { user } = useAuth();
  const { currentWorkspace, canEdit } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [pipelines, setPipelines] = useState<{ id: string; name: string }[]>([]);
  const [stages, setStages] = useState<{ id: string; name: string; pipeline_id: string }[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [members, setMembers] = useState<{ user_id: string; full_name: string | null; email: string | null }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium" },
  });

  const selectedPipelineId = form.watch("pipeline_id");
  const filteredStages = stages.filter((s) => s.pipeline_id === selectedPipelineId);

  useEffect(() => {
    if (!open || !currentWorkspace) return;
    void (async () => {
      const ws = currentWorkspace.id;
      const [{ data: ps }, { data: st }, { data: src }, { data: mem }] = await Promise.all([
        supabase.from("pipelines").select("id, name, is_default").eq("workspace_id", ws),
        supabase.from("pipeline_stages").select("id, name, pipeline_id, position").eq("workspace_id", ws).order("position"),
        supabase.from("lead_sources").select("id, name, type").eq("workspace_id", ws),
        supabase.from("workspace_members").select("user_id").eq("workspace_id", ws).eq("is_active", true),
      ]);

      const pipelineList = (ps ?? []).map((p) => ({ id: p.id, name: p.name }));
      setPipelines(pipelineList);
      setStages((st ?? []).map((s) => ({ id: s.id, name: s.name, pipeline_id: s.pipeline_id! })));
      setSources((src ?? []).map((s) => ({ id: s.id, name: s.name })));

      // load profiles for members
      const userIds = (mem ?? []).map((m) => m.user_id);
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
        setMembers((profs ?? []).map((p) => ({ user_id: p.id, full_name: p.full_name, email: p.email })));
      }

      const defaultPipeline = (ps ?? []).find((p) => p.is_default) ?? ps?.[0];
      if (defaultPipeline) {
        form.setValue("pipeline_id", defaultPipeline.id);
        const defaultStage = (st ?? []).find((s) => s.pipeline_id === defaultPipeline.id);
        if (defaultStage) form.setValue("stage_id", defaultStage.id);
      }
      const manualSource = (src ?? []).find((s) => s.type === "manual") ?? src?.[0];
      if (manualSource) form.setValue("source_id", manualSource.id);
    })();
  }, [open, currentWorkspace, form]);

  const onSubmit = async (values: FormValues) => {
    if (!currentWorkspace || !user) return;
    try {
      // duplicate phone check
      const { data: dup } = await supabase
        .from("leads")
        .select("id, full_name")
        .eq("workspace_id", currentWorkspace.id)
        .eq("phone", values.phone.trim())
        .maybeSingle();
      if (dup) {
        const proceed = confirm(`A lead with this phone already exists ("${dup.full_name}"). Create anyway?`);
        if (!proceed) return;
      }

      const tagArr = values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      await createLead(
        {
          workspace_id: currentWorkspace.id,
          full_name: values.full_name.trim(),
          phone: values.phone.trim(),
          email: values.email?.trim() || null,
          business_interest: values.business_interest?.trim() || null,
          city: values.city?.trim() || null,
          priority: values.priority,
          pipeline_id: values.pipeline_id || null,
          stage_id: values.stage_id || null,
          source_id: values.source_id || null,
          tags: tagArr,
          notes: values.notes?.trim() || null,
          assigned_to: values.assigned_to || null,
        },
        user.id
      );

      toast.success("Lead created");
      form.reset({ priority: "medium" });
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create lead");
    }
  };

  if (!canEdit) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
          <DialogDescription>Add a lead manually to your CRM.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label>Full name *</Label>
            <Input {...form.register("full_name")} />
            {form.formState.errors.full_name && (
              <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
            )}
          </div>
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label>Phone *</Label>
            <Input {...form.register("phone")} placeholder="+1 555 123 4567" />
            {form.formState.errors.phone && (
              <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label>City / Location</Label>
            <Input {...form.register("city")} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Business / Service interest</Label>
            <Input {...form.register("business_interest")} placeholder="e.g. Website redesign" />
          </div>

          <div className="space-y-1.5">
            <Label>Pipeline</Label>
            <Select value={form.watch("pipeline_id") ?? ""} onValueChange={(v) => { form.setValue("pipeline_id", v); form.setValue("stage_id", ""); }}>
              <SelectTrigger><SelectValue placeholder="Select pipeline" /></SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select value={form.watch("stage_id") ?? ""} onValueChange={(v) => form.setValue("stage_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
              <SelectContent>
                {filteredStages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select value={form.watch("source_id") ?? ""} onValueChange={(v) => form.setValue("source_id", v)}>
              <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                {sources.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.watch("priority")} onValueChange={(v: any) => form.setValue("priority", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Assign to</Label>
            <Select value={form.watch("assigned_to") ?? ""} onValueChange={(v) => form.setValue("assigned_to", v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.full_name || m.email || m.user_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Tags <span className="text-xs text-muted-foreground">(comma separated)</span></Label>
            <Input {...form.register("tags")} placeholder="hot, follow-up" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} {...form.register("notes")} />
          </div>

          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
