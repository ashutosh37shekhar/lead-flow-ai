import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Drains pending webhook_events to their target_url.
// Call this from a cron / external scheduler / manual button:
//   POST /api/webhooks/n8n-dispatch
// Optional ?ws=<workspace_id> to scope.
export const Route = createFileRoute("/api/webhooks/n8n-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const ws = url.searchParams.get("ws");

        let q = supabaseAdmin
          .from("webhook_events")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(25);
        if (ws) q = q.eq("workspace_id", ws);

        const { data: events, error } = await q;
        if (error) return new Response(error.message, { status: 500 });

        let success = 0;
        let failed = 0;

        for (const ev of events ?? []) {
          try {
            const res = await fetch(ev.target_url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(ev.payload),
            });
            const text = await res.text().catch(() => "");
            await supabaseAdmin
              .from("webhook_events")
              .update({
                status: res.ok ? "success" : "failed",
                http_status: res.status,
                response_body: text.slice(0, 1000),
                attempts: (ev.attempts ?? 0) + 1,
                last_attempt_at: new Date().toISOString(),
              })
              .eq("id", ev.id);
            res.ok ? success++ : failed++;
          } catch (e: any) {
            failed++;
            await supabaseAdmin
              .from("webhook_events")
              .update({
                status: "failed",
                response_body: String(e?.message ?? e).slice(0, 1000),
                attempts: (ev.attempts ?? 0) + 1,
                last_attempt_at: new Date().toISOString(),
              })
              .eq("id", ev.id);
          }
        }

        return Response.json({ processed: events?.length ?? 0, success, failed });
      },
    },
  },
});
