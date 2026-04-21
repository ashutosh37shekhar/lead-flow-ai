import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// WhatsApp Cloud API webhook receiver.
// Configure callback URL in Meta App as: <your-domain>/api/webhooks/whatsapp?ws=<workspace_id>
export const Route = createFileRoute("/api/webhooks/whatsapp")({
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

        const { data } = await supabaseAdmin
          .from("integrations")
          .select("webhook_verify_token")
          .eq("workspace_id", ws)
          .eq("provider", "whatsapp_cloud")
          .maybeSingle();

        if (!data || data.webhook_verify_token !== token) {
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

        const entries = Array.isArray(body.entry) ? body.entry : [];

        for (const entry of entries) {
          const changes = Array.isArray(entry.changes) ? entry.changes : [];
          for (const change of changes) {
            const value = change?.value ?? {};
            const messages = Array.isArray(value.messages) ? value.messages : [];
            const contacts = Array.isArray(value.contacts) ? value.contacts : [];
            const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;

            for (let i = 0; i < messages.length; i++) {
              const msg = messages[i];
              const fromPhone = msg.from;
              const contact = contacts[i] ?? contacts[0];
              const profileName = contact?.profile?.name ?? "WhatsApp Lead";
              const text = msg?.text?.body ?? msg?.button?.text ?? `(${msg.type})`;

              // Find or create lead by phone within this workspace
              let leadId: string | null = null;
              const { data: existing } = await supabaseAdmin
                .from("leads")
                .select("id")
                .eq("workspace_id", ws)
                .eq("phone", fromPhone)
                .maybeSingle();

              if (existing) {
                leadId = existing.id;
              } else {
                const { data: source } = await supabaseAdmin
                  .from("lead_sources")
                  .select("id")
                  .eq("workspace_id", ws)
                  .eq("type", "whatsapp")
                  .maybeSingle();
                const { data: pipeline } = await supabaseAdmin
                  .from("pipelines")
                  .select("id")
                  .eq("workspace_id", ws)
                  .eq("is_default", true)
                  .maybeSingle();
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
                const { data: created } = await supabaseAdmin
                  .from("leads")
                  .insert({
                    workspace_id: ws,
                    pipeline_id: pipeline?.id ?? null,
                    stage_id: stageId,
                    source_id: source?.id ?? null,
                    full_name: profileName,
                    phone: fromPhone,
                  })
                  .select("id")
                  .single();
                leadId = created?.id ?? null;
              }

              await supabaseAdmin.from("whatsapp_messages").insert({
                workspace_id: ws,
                lead_id: leadId,
                direction: "inbound",
                wa_message_id: msg.id,
                from_phone: fromPhone,
                to_phone: phoneNumberId ?? null,
                body: text,
                message_type: msg.type ?? "text",
                raw_payload: msg,
              });
            }

            // Status updates (delivered/read/failed)
            const statuses = Array.isArray(value.statuses) ? value.statuses : [];
            for (const st of statuses) {
              await supabaseAdmin
                .from("whatsapp_messages")
                .update({ status: st.status })
                .eq("wa_message_id", st.id);
            }
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});
