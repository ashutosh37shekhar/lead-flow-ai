import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  getIntegrations,
  upsertIntegration,
  disconnectIntegration,
  getRecentWebhookEvents,
  type Integration,
} from "@/lib/integrations";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/dashboard/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  const { user } = useAuth();
  const { currentWorkspace, isAdmin } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [n8n, setN8n] = useState<Integration | null>(null);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [dispatching, setDispatching] = useState(false);

  const load = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const list = await getIntegrations(currentWorkspace.id);
      const found = list.find((i) => i.provider === "n8n") ?? null;
      setN8n(found);
      setUrl(found?.webhook_url ?? "");
      const ev = await getRecentWebhookEvents(currentWorkspace.id, 30);
      setEvents(ev);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  const save = async () => {
    if (!currentWorkspace || !user) return;
    if (url && !url.startsWith("http")) {
      toast.error("Enter a valid http(s) URL");
      return;
    }
    try {
      await upsertIntegration(
        currentWorkspace.id,
        "n8n",
        { webhook_url: url, is_active: !!url },
        user.id
      );
      toast.success("n8n webhook saved");
      void load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const dispatch = async () => {
    if (!currentWorkspace) return;
    setDispatching(true);
    try {
      const res = await fetch(`/api/webhooks/n8n-dispatch?ws=${currentWorkspace.id}`, { method: "POST" });
      const j = await res.json();
      toast.success(`Dispatched ${j.processed ?? 0} events`);
      void load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDispatching(false);
    }
  };

  const disconnect = async () => {
    if (!currentWorkspace) return;
    if (!confirm("Disconnect n8n?")) return;
    await disconnectIntegration(currentWorkspace.id, "n8n");
    toast.success("Disconnected");
    void load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
        <p className="text-sm text-muted-foreground">
          Forward lead events to n8n to trigger any workflow (WhatsApp send, email, Slack, etc.).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">n8n Webhook</h3>
              {n8n?.webhook_url ? (
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Active</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Not configured</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Events fired: <code className="text-xs">lead.created</code>, <code className="text-xs">lead.stage_changed</code>.
            </p>
          </div>
          <a href="https://n8n.io" target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
            n8n.io <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">n8n Webhook URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={!isAdmin}
            placeholder="https://your-n8n.example.com/webhook/leadflow"
            className="font-mono text-xs"
          />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={dispatch} disabled={dispatching || !n8n?.webhook_url}>
              {dispatching ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Dispatch pending
            </Button>
            {n8n && (
              <Button variant="outline" onClick={disconnect}>Disconnect</Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Recent webhook events</h3>
          <p className="text-xs text-muted-foreground">Latest 30 events queued for n8n.</p>
        </div>
        {events.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No events yet. Create or move a lead to trigger one.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((ev) => (
              <div key={ev.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                <Badge
                  variant="outline"
                  className={
                    ev.status === "success"
                      ? "bg-success/10 text-success border-success/20"
                      : ev.status === "failed"
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {ev.status}
                </Badge>
                <code className="text-xs">{ev.event_type}</code>
                <span className="flex-1 truncate text-xs text-muted-foreground">{ev.target_url}</span>
                {ev.http_status && <span className="text-xs text-muted-foreground">HTTP {ev.http_status}</span>}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
