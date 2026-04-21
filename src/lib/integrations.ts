import { supabase } from "@/integrations/supabase/client";

export type IntegrationProvider = "meta_facebook" | "meta_instagram" | "whatsapp_cloud" | "n8n";

export interface Integration {
  id: string;
  workspace_id: string;
  provider: IntegrationProvider;
  is_active: boolean;
  access_token: string | null;
  external_account_id: string | null;
  external_account_name: string | null;
  webhook_verify_token: string | null;
  webhook_secret: string | null;
  webhook_url: string | null;
  config: Record<string, any>;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export async function getIntegrations(workspaceId: string) {
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return (data ?? []) as unknown as Integration[];
}

export async function upsertIntegration(
  workspaceId: string,
  provider: IntegrationProvider,
  patch: Partial<Omit<Integration, "id" | "workspace_id" | "provider" | "created_at" | "updated_at">>,
  userId: string
) {
  const { data: existing } = await supabase
    .from("integrations")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("integrations").update(patch).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }
  const { data, error } = await supabase
    .from("integrations")
    .insert({ workspace_id: workspaceId, provider, created_by: userId, ...patch })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function disconnectIntegration(workspaceId: string, provider: IntegrationProvider) {
  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("provider", provider);
  if (error) throw error;
}

export async function getRecentWebhookEvents(workspaceId: string, limit = 50) {
  const { data, error } = await supabase
    .from("webhook_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
