import { supabase } from "@/integrations/supabase/client";
import type { WorkspaceRole } from "@/hooks/useWorkspace";

export interface TeamMember {
  user_id: string;
  role: WorkspaceRole;
  is_active: boolean;
  full_name: string;
  email: string;
  created_at: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export async function fetchTeam(workspaceId: string): Promise<TeamMember[]> {
  const { data: mem, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, is_active, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const ids = (mem ?? []).map((m) => m.user_id);
  if (!ids.length) return [];
  const { data: profs } = await supabase
    .from("profiles").select("id, full_name, email").in("id", ids);
  const map = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
  return (mem ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.role as WorkspaceRole,
    is_active: m.is_active,
    created_at: m.created_at,
    full_name: map[m.user_id]?.full_name ?? "User",
    email: map[m.user_id]?.email ?? "",
  }));
}

export async function fetchInvites(workspaceId: string): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from("workspace_invites")
    .select("id, email, role, token, status, expires_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PendingInvite[];
}

export async function createInvite(workspaceId: string, email: string, role: WorkspaceRole, invitedBy: string) {
  const { data, error } = await supabase
    .from("workspace_invites")
    .insert({ workspace_id: workspaceId, email: email.trim().toLowerCase(), role, invited_by: invitedBy })
    .select("id, token")
    .single();
  if (error) throw error;
  return data;
}

export async function revokeInvite(id: string) {
  const { error } = await supabase
    .from("workspace_invites").update({ status: "revoked" }).eq("id", id);
  if (error) throw error;
}

export async function setMemberRole(workspaceId: string, userId: string, role: WorkspaceRole) {
  const { error } = await supabase
    .from("workspace_members").update({ role })
    .eq("workspace_id", workspaceId).eq("user_id", userId);
  if (error) throw error;
}

export async function setMemberActive(workspaceId: string, userId: string, active: boolean) {
  const { error } = await supabase
    .from("workspace_members").update({ is_active: active })
    .eq("workspace_id", workspaceId).eq("user_id", userId);
  if (error) throw error;
}

/**
 * Round-robin assign: assign to active admin/agent with the fewest currently active assignments.
 */
export async function assignRoundRobin(workspaceId: string, leadId: string, assignedBy: string) {
  const { data: members } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .in("role", ["admin", "agent"]);

  if (!members?.length) throw new Error("No active assignable members");

  const { data: counts } = await supabase
    .from("lead_assignments")
    .select("assigned_to")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);

  const tally: Record<string, number> = {};
  for (const c of counts ?? []) tally[c.assigned_to] = (tally[c.assigned_to] ?? 0) + 1;

  const sorted = members
    .map((m) => ({ id: m.user_id, count: tally[m.user_id] ?? 0 }))
    .sort((a, b) => a.count - b.count);

  const target = sorted[0].id;

  // Deactivate previous assignments for this lead
  await supabase
    .from("lead_assignments")
    .update({ is_active: false })
    .eq("lead_id", leadId)
    .eq("is_active", true);

  const { error } = await supabase.from("lead_assignments").insert({
    lead_id: leadId,
    workspace_id: workspaceId,
    assigned_to: target,
    assigned_by: assignedBy,
  });
  if (error) throw error;
  return target;
}

export async function assignManual(workspaceId: string, leadId: string, userId: string, assignedBy: string) {
  await supabase
    .from("lead_assignments")
    .update({ is_active: false })
    .eq("lead_id", leadId)
    .eq("is_active", true);
  const { error } = await supabase.from("lead_assignments").insert({
    lead_id: leadId, workspace_id: workspaceId, assigned_to: userId, assigned_by: assignedBy,
  });
  if (error) throw error;
}
