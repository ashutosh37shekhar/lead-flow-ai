import { supabase } from "@/integrations/supabase/client";

export type FollowupType = "whatsapp" | "call" | "email" | "meeting" | "other";
export type FollowupStatus = "pending" | "completed" | "cancelled";

export interface Followup {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  assigned_to: string;
  created_by: string | null;
  type: FollowupType;
  title: string;
  description: string | null;
  due_at: string;
  completed_at: string | null;
  status: FollowupStatus;
  created_at: string;
  updated_at: string;
}

export interface FollowupInput {
  workspace_id: string;
  lead_id?: string | null;
  assigned_to: string;
  type: FollowupType;
  title: string;
  description?: string | null;
  due_at: string;
}

export async function createFollowup(input: FollowupInput, userId: string) {
  const { data, error } = await supabase
    .from("followups")
    .insert({ ...input, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeFollowup(id: string) {
  const { error } = await supabase
    .from("followups")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function cancelFollowup(id: string) {
  const { error } = await supabase
    .from("followups")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFollowup(id: string) {
  const { error } = await supabase.from("followups").delete().eq("id", id);
  if (error) throw error;
}

export function isOverdue(f: Followup) {
  return f.status === "pending" && new Date(f.due_at).getTime() < Date.now();
}

export function formatDue(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
