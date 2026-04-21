import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Meta Lead Ads webhook receiver.
// GET = verification handshake. POST = lead notification.
// Configure callback URL in Meta App as: <your-domain>/api/webhooks/meta
// Verify token must match integrations.webhook_verify_token for the workspace identified by ?ws=<workspace_id>
export const Route = createFileRoute("/api/webhooks/meta")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const ws = url.searchParams.get("ws");

        if (mode !== "subscribe" || !token || !ws) {
          return new Response("Bad request", { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from("integrations")
          .select("webhook_verify_token")
          .eq("workspace_id", ws)
          .in("provider", ["meta_facebook", "meta_instagram"])
          .maybeSingle();

        if (error || !data || data.webhook_verify_token !== token) {
          return new Response("Forbidden", { status: 403 });
        }
        return new Response(challenge, { status: 200 });
      },

      POST: async ({ request }) => {
        const url = new URL(request.url);
        const ws = url.searchParams.get("ws");
        if (!ws) return new Response("Missing workspace", { status: 400 });

        const body = await request.json().catch(() => null);
        if (!body) return new Response("Invalid payload", { status: 400 });

        // Resolve default pipeline + new stage + facebook source for the workspace
        const [{ data: pipeline }, { data: source }] = await Promise.all([
          supabaseAdmin.from("pipelines").select("id").eq("workspace_id", ws).eq("is_default", true).maybeSingle(),
          supabaseAdmin.from("lead_sources").select("id").eq("workspace_id", ws).eq("type", "facebook").maybeSingle(),
        ]);
        let stageId: string | null = null;
        if (pipeline) {
          const { data: stage } = await supabaseAdmin
            .from("pipeline_stages")
            .select("id")
            .eq("pipeline_id", pipeline.id)
            .order("position", { ascending: true })
            .limit(1)
            .maybeSingle();
          stageId = stage?.id ?? null;
        }

        const entries = Array.isArray(body.entry) ? body.entry : [];
        const created: string[] = [];

        for (const entry of entries) {
          const changes = Array.isArray(entry.changes) ? entry.changes : [];
          for (const change of changes) {
            const v = change?.value ?? {};
            // Real implementation would call Graph API with leadgen_id + page access token to fetch full field data.
            // We store what's available so the structure is testable end-to-end.
            const fullName = v.full_name ?? v.name ?? "Meta Lead";
            const phone = v.phone_number ?? v.phone ?? "unknown";
            const email = v.email ?? null;
            const city = v.city ?? null;

            const { data: lead } = await supabaseAdmin
              .from("leads")
              .insert({
                workspace_id: ws,
                pipeline_id: pipeline?.id ?? null,
                stage_id: stageId,
                source_id: source?.id ?? null,
                full_name: fullName,
                phone: String(phone),
                email,
                city,
                custom_fields: { meta_payload: v },
              })
              .select("id")
              .single();

            if (lead) created.push(lead.id);
          }
        }

        return Response.json({ ok: true, created: created.length });
      },
    },
  },
});
