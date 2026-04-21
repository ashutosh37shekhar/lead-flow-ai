import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, RefreshCw, Trash2, Facebook, Instagram, MessageCircle } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import {
  getIntegrations,
  upsertIntegration,
  disconnectIntegration,
  type Integration,
  type IntegrationProvider,
} from "@/lib/integrations";

export const Route = createFileRoute("/dashboard/meta")({
  component: MetaPage,
});

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function MetaPage() {
  const { user } = useAuth();
  const { currentWorkspace, isAdmin } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Record<IntegrationProvider, Integration | null>>({
    meta_facebook: null,
    meta_instagram: null,
    whatsapp_cloud: null,
    n8n: null,
  });

  // Form state
  const [fbToken, setFbToken] = useState("");
  const [fbBusinessId, setFbBusinessId] = useState("");
  const [fbVerify, setFbVerify] = useState("");

  const [igToken, setIgToken] = useState("");
  const [igAccountId, setIgAccountId] = useState("");
  const [igVerify, setIgVerify] = useState("");

  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waBusinessId, setWaBusinessId] = useState("");
  const [waVerify, setWaVerify] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const wsId = currentWorkspace?.id ?? "";
  const metaCallback = `${origin}/api/webhooks/meta?ws=${wsId}`;
  const waCallback = `${origin}/api/webhooks/whatsapp?ws=${wsId}`;

  const load = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const list = await getIntegrations(currentWorkspace.id);
      const map: typeof items = { meta_facebook: null, meta_instagram: null, whatsapp_cloud: null, n8n: null };
      for (const i of list) map[i.provider] = i;
      setItems(map);

      setFbToken(map.meta_facebook?.access_token ?? "");
      setFbBusinessId(map.meta_facebook?.external_account_id ?? "");
      setFbVerify(map.meta_facebook?.webhook_verify_token ?? "");

      setIgToken(map.meta_instagram?.access_token ?? "");
      setIgAccountId(map.meta_instagram?.external_account_id ?? "");
      setIgVerify(map.meta_instagram?.webhook_verify_token ?? "");

      setWaToken(map.whatsapp_cloud?.access_token ?? "");
      setWaPhoneId((map.whatsapp_cloud?.config as any)?.phone_number_id ?? "");
      setWaBusinessId(map.whatsapp_cloud?.external_account_id ?? "");
      setWaVerify(map.whatsapp_cloud?.webhook_verify_token ?? "");
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

  const copy = (v: string) => {
    if (!v) return;
    navigator.clipboard.writeText(v);
    toast.success("Copied");
  };

  const save = async (provider: IntegrationProvider, patch: any) => {
    if (!currentWorkspace || !user) return;
    try {
      await upsertIntegration(currentWorkspace.id, provider, patch, user.id);
      toast.success("Saved");
      void load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const disconnect = async (provider: IntegrationProvider) => {
    if (!currentWorkspace) return;
    if (!confirm("Disconnect this integration?")) return;
    try {
      await disconnectIntegration(currentWorkspace.id, provider);
      toast.success("Disconnected");
      void load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const readOnly = !isAdmin;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect Meta Lead Ads and WhatsApp Cloud API to ingest leads automatically.
          {readOnly && " (Admin role required to edit.)"}
        </p>
      </div>

      {/* Facebook */}
      <IntegrationCard
        icon={<Facebook className="h-6 w-6 text-[#1877f2]" />}
        title="Facebook Lead Ads"
        description="Ingest leads from Facebook lead forms via Meta Webhooks."
        connected={!!items.meta_facebook?.access_token}
      >
        <Field label="Webhook Callback URL" value={metaCallback} onCopy={() => copy(metaCallback)} readOnly />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Page Access Token" value={fbToken} onChange={setFbToken} disabled={readOnly} type="password" />
          <Field label="Meta Business ID" value={fbBusinessId} onChange={setFbBusinessId} disabled={readOnly} />
        </div>
        <Field
          label="Verify Token"
          value={fbVerify}
          onChange={setFbVerify}
          disabled={readOnly}
          extra={
            !readOnly && (
              <Button variant="ghost" size="sm" onClick={() => setFbVerify(randomToken())}>
                <RefreshCw className="h-3 w-3 mr-1" /> Generate
              </Button>
            )
          }
        />
        <ActionRow
          readOnly={readOnly}
          onSave={() =>
            save("meta_facebook", {
              access_token: fbToken,
              external_account_id: fbBusinessId,
              webhook_verify_token: fbVerify,
              is_active: true,
            })
          }
          onDisconnect={items.meta_facebook ? () => disconnect("meta_facebook") : undefined}
        />
      </IntegrationCard>

      {/* Instagram */}
      <IntegrationCard
        icon={<Instagram className="h-6 w-6 text-[#e4405f]" />}
        title="Instagram Lead Ads"
        description="Ingest Instagram lead form submissions (uses the same Meta webhook URL)."
        connected={!!items.meta_instagram?.access_token}
      >
        <Field label="Webhook Callback URL" value={metaCallback} onCopy={() => copy(metaCallback)} readOnly />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="IG Account Access Token" value={igToken} onChange={setIgToken} disabled={readOnly} type="password" />
          <Field label="Instagram Business Account ID" value={igAccountId} onChange={setIgAccountId} disabled={readOnly} />
        </div>
        <Field
          label="Verify Token"
          value={igVerify}
          onChange={setIgVerify}
          disabled={readOnly}
          extra={
            !readOnly && (
              <Button variant="ghost" size="sm" onClick={() => setIgVerify(randomToken())}>
                <RefreshCw className="h-3 w-3 mr-1" /> Generate
              </Button>
            )
          }
        />
        <ActionRow
          readOnly={readOnly}
          onSave={() =>
            save("meta_instagram", {
              access_token: igToken,
              external_account_id: igAccountId,
              webhook_verify_token: igVerify,
              is_active: true,
            })
          }
          onDisconnect={items.meta_instagram ? () => disconnect("meta_instagram") : undefined}
        />
      </IntegrationCard>

      {/* WhatsApp */}
      <IntegrationCard
        icon={<MessageCircle className="h-6 w-6 text-[#25d366]" />}
        title="WhatsApp Cloud API"
        description="Receive WhatsApp messages as leads and reply through Cloud API."
        connected={!!items.whatsapp_cloud?.access_token}
      >
        <Field label="Webhook Callback URL" value={waCallback} onCopy={() => copy(waCallback)} readOnly />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="System User Access Token" value={waToken} onChange={setWaToken} disabled={readOnly} type="password" />
          <Field label="Phone Number ID" value={waPhoneId} onChange={setWaPhoneId} disabled={readOnly} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="WhatsApp Business Account ID" value={waBusinessId} onChange={setWaBusinessId} disabled={readOnly} />
          <Field
            label="Verify Token"
            value={waVerify}
            onChange={setWaVerify}
            disabled={readOnly}
            extra={
              !readOnly && (
                <Button variant="ghost" size="sm" onClick={() => setWaVerify(randomToken())}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Generate
                </Button>
              )
            }
          />
        </div>
        <ActionRow
          readOnly={readOnly}
          onSave={() =>
            save("whatsapp_cloud", {
              access_token: waToken,
              external_account_id: waBusinessId,
              webhook_verify_token: waVerify,
              config: { phone_number_id: waPhoneId },
              is_active: true,
            })
          }
          onDisconnect={items.whatsapp_cloud ? () => disconnect("whatsapp_cloud") : undefined}
        />
      </IntegrationCard>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onCopy,
  readOnly,
  disabled,
  type = "text",
  extra,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  onCopy?: () => void;
  readOnly?: boolean;
  disabled?: boolean;
  type?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        {extra}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          disabled={disabled}
          placeholder={readOnly ? "" : `Enter ${label}`}
          className="font-mono text-xs"
        />
        {onCopy && (
          <Button variant="outline" size="icon" onClick={onCopy} title="Copy">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ActionRow({
  readOnly,
  onSave,
  onDisconnect,
}: {
  readOnly: boolean;
  onSave: () => void;
  onDisconnect?: () => void;
}) {
  if (readOnly) return null;
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-border">
      <Button onClick={onSave}>Save</Button>
      {onDisconnect && (
        <Button variant="outline" onClick={onDisconnect}>
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Disconnect
        </Button>
      )}
    </div>
  );
}
