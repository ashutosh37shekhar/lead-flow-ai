import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { KanbanSquare, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AddLeadDialog } from "@/components/leads/AddLeadDialog";
import { LeadDetailSheet } from "@/components/leads/LeadDetailSheet";
import { PipelineKanban } from "@/components/leads/PipelineKanban";
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
import { updateLeadStage, type Lead } from "@/lib/leads";

export const Route = createFileRoute("/dashboard/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  const { user } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const [pipelines, setPipelines] = useState<{ id: string; name: string }[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [stages, setStages] = useState<{ id: string; name: string; color: string | null }[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWorkspace) return;
    void loadPipelines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (selectedPipelineId) void loadPipelineData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPipelineId]);

  async function loadPipelines() {
    if (!currentWorkspace) return;
    const { data } = await supabase
      .from("pipelines")
      .select("id, name, is_default")
      .eq("workspace_id", currentWorkspace.id);
    const list = (data ?? []).map((p) => ({ id: p.id, name: p.name }));
    setPipelines(list);
    const defaultPipeline = (data ?? []).find((p) => p.is_default) ?? data?.[0];
    if (defaultPipeline) setSelectedPipelineId(defaultPipeline.id);
  }

  async function loadPipelineData() {
    if (!currentWorkspace || !selectedPipelineId) return;
    setLoading(true);
    const [{ data: st }, { data: ls }] = await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("id, name, color, position")
        .eq("pipeline_id", selectedPipelineId)
        .order("position"),
      supabase
        .from("leads")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .eq("pipeline_id", selectedPipelineId),
    ]);
    setStages((st ?? []).map((s) => ({ id: s.id, name: s.name, color: s.color })));
    setLeads((ls as Lead[]) ?? []);
    setLoading(false);
  }

  const handleMove = async (leadId: string, newStageId: string) => {
    if (!user) return;
    const stage = stages.find((s) => s.id === newStageId);
    if (!stage) return;
    // optimistic update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage_id: newStageId } : l)));
    try {
      await updateLeadStage(leadId, currentWorkspace!.id, newStageId, stage.name, user.id);
      toast.success(`Moved to ${stage.name}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to move lead");
      void loadPipelineData();
    }
  };

  if (wsLoading || !currentWorkspace) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const hasNoStages = !loading && stages.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Drag and drop leads between stages</p>
        </div>
        <div className="flex items-center gap-2">
          {pipelines.length > 0 && (
            <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <AddLeadDialog onCreated={loadPipelineData} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : hasNoStages ? (
        <EmptyState
          title="No stages configured"
          description="This pipeline has no stages yet. Stages are auto-created with your default Sales pipeline on signup."
          icon={KanbanSquare}
          showConnectMeta={false}
        />
      ) : (
        <PipelineKanban
          stages={stages}
          leads={leads}
          onMove={handleMove}
          onLeadClick={(id) => setOpenLeadId(id)}
        />
      )}

      <LeadDetailSheet
        leadId={openLeadId}
        open={!!openLeadId}
        onOpenChange={(o) => !o && setOpenLeadId(null)}
        onChanged={loadPipelineData}
      />
    </div>
  );
}
