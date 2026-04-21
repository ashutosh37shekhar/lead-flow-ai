-- ============= Integrations + Webhooks + n8n =============

-- Integration provider enum
CREATE TYPE public.integration_provider AS ENUM ('meta_facebook', 'meta_instagram', 'whatsapp_cloud', 'n8n');

-- Generic integrations table (one row per workspace + provider)
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider public.integration_provider NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Common credential fields (nullable, depends on provider)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  external_account_id TEXT,         -- e.g. Meta Business ID, WABA ID
  external_account_name TEXT,
  webhook_verify_token TEXT,        -- user-defined for FB/Meta webhook verification
  webhook_secret TEXT,              -- HMAC secret for verifying inbound payloads (n8n)
  webhook_url TEXT,                 -- outbound URL (n8n)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,  -- provider-specific extras (page_ids, phone_number_id, app_secret, etc.)
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider)
);

CREATE INDEX idx_integrations_workspace ON public.integrations(workspace_id);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage integrations" ON public.integrations
  FOR ALL USING (public.is_workspace_admin(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Members view integrations" ON public.integrations
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE TRIGGER set_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= Meta connected pages/forms =============
CREATE TABLE public.meta_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  page_name TEXT,
  platform TEXT NOT NULL DEFAULT 'facebook', -- 'facebook' | 'instagram'
  access_token TEXT,            -- page access token
  is_subscribed BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  forms_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, page_id)
);

ALTER TABLE public.meta_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage meta pages" ON public.meta_pages
  FOR ALL USING (public.is_workspace_admin(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "Members view meta pages" ON public.meta_pages
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

-- ============= WhatsApp messages log =============
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  wa_message_id TEXT,
  from_phone TEXT,
  to_phone TEXT,
  body TEXT,
  message_type TEXT DEFAULT 'text',
  status TEXT,                  -- sent | delivered | read | failed
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_messages_workspace ON public.whatsapp_messages(workspace_id, created_at DESC);
CREATE INDEX idx_wa_messages_lead ON public.whatsapp_messages(lead_id);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view wa messages" ON public.whatsapp_messages
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Members create wa messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()));

-- ============= n8n outbound event log =============
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,         -- 'lead.created', 'lead.stage_changed', 'lead.assigned', 'followup.created'
  target_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | success | failed
  http_status INTEGER,
  response_body TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_events_workspace ON public.webhook_events(workspace_id, created_at DESC);
CREATE INDEX idx_webhook_events_status ON public.webhook_events(status, created_at);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view webhook events" ON public.webhook_events
  FOR SELECT USING (public.is_workspace_admin(workspace_id, auth.uid()));

CREATE POLICY "System inserts webhook events" ON public.webhook_events
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- ============= Trigger: queue n8n webhook on lead events =============
CREATE OR REPLACE FUNCTION public.queue_n8n_lead_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url TEXT;
  v_payload JSONB;
  v_event TEXT;
BEGIN
  SELECT webhook_url INTO v_url FROM public.integrations
  WHERE workspace_id = NEW.workspace_id AND provider = 'n8n' AND is_active = true;

  IF v_url IS NULL OR v_url = '' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    v_event := 'lead.created';
  ELSIF TG_OP = 'UPDATE' AND OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    v_event := 'lead.stage_changed';
  ELSE
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'event', v_event,
    'workspace_id', NEW.workspace_id,
    'lead', to_jsonb(NEW),
    'occurred_at', now()
  );

  INSERT INTO public.webhook_events (workspace_id, event_type, target_url, payload)
  VALUES (NEW.workspace_id, v_event, v_url, v_payload);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lead_n8n_insert
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.queue_n8n_lead_event();

CREATE TRIGGER trg_lead_n8n_update
  AFTER UPDATE OF stage_id ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.queue_n8n_lead_event();