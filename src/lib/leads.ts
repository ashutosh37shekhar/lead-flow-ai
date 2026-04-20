import { supabase } from "@/integrations/supabase/client";

export type LeadPriority = "low" | "medium" | "high";

export interface Lead {
  id: string;
  workspace_id: string;
  pipeline_id: string | null;
  stage_id: string | null;
  source_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  business_interest: string | null;
  city: string | null;
  priority: LeadPriority;
  score: number;
  tags: string[] | null;
  deal_value: number | null;
  expected_revenue: number | null;
  closed_revenue: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadInput {
  workspace_id: string;
  pipeline_id?: string | null;
  stage_id?: string | null;
  source_id?: string | null;
  full_name: string;
  phone: string;
  email?: string | null;
  business_interest?: string | null;
  city?: string | null;
  priority?: LeadPriority;
  tags?: string[];
  notes?: string | null;
  assigned_to?: string | null;
}

export async function createLead(input: LeadInput, userId: string) {
  const { assigned_to, ...leadData } = input;
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({ ...leadData, created_by: userId })
    .select()
    .single();
  if (error) throw error;

  if (assigned_to) {
    await supabase.from("lead_assignments").insert({
      lead_id: lead.id,
      workspace_id: lead.workspace_id,
      assigned_to,
      assigned_by: userId,
    });
  }

  await supabase.from("activity_logs").insert({
    workspace_id: lead.workspace_id,
    lead_id: lead.id,
    actor_id: userId,
    type: "lead_created",
    description: `Lead "${lead.full_name}" was created`,
  });

  return lead;
}

export async function updateLeadStage(leadId: string, workspaceId: string, stageId: string, stageName: string, userId: string) {
  const { error } = await supabase.from("leads").update({ stage_id: stageId }).eq("id", leadId);
  if (error) throw error;
  await supabase.from("activity_logs").insert({
    workspace_id: workspaceId,
    lead_id: leadId,
    actor_id: userId,
    type: "stage_changed",
    description: `Stage changed to "${stageName}"`,
    metadata: { stage_id: stageId },
  });
}

export async function deleteLeads(ids: string[]) {
  const { error } = await supabase.from("leads").delete().in("id", ids);
  if (error) throw error;
}

export function exportLeadsToCSV(leads: Lead[], stages: Record<string, string>, sources: Record<string, string>) {
  const headers = ["Name", "Phone", "Email", "Business Interest", "City", "Priority", "Score", "Stage", "Source", "Tags", "Created"];
  const rows = leads.map((l) => [
    l.full_name,
    l.phone,
    l.email ?? "",
    l.business_interest ?? "",
    l.city ?? "",
    l.priority,
    String(l.score),
    l.stage_id ? stages[l.stage_id] ?? "" : "",
    l.source_id ? sources[l.source_id] ?? "" : "",
    (l.tags ?? []).join("; "),
    new Date(l.created_at).toISOString(),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
