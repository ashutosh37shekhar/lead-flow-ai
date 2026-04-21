-- =========================
-- ENUMS
-- =========================
DO $$ BEGIN
  CREATE TYPE public.followup_type AS ENUM ('whatsapp', 'call', 'email', 'meeting', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.followup_status AS ENUM ('pending', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- FOLLOWUPS
-- =========================
CREATE TABLE IF NOT EXISTS public.followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,
  created_by UUID,
  type public.followup_type NOT NULL DEFAULT 'call',
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status public.followup_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followups_workspace ON public.followups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_followups_assignee ON public.followups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_followups_due ON public.followups(due_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_followups_lead ON public.followups(lead_id);

ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view followups" ON public.followups;
CREATE POLICY "Members view followups" ON public.followups
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "Members create followups" ON public.followups;
CREATE POLICY "Members create followups" ON public.followups
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "Assignee or admin update" ON public.followups;
CREATE POLICY "Assignee or admin update" ON public.followups
  FOR UPDATE USING (
    auth.uid() = assigned_to OR public.is_workspace_admin(workspace_id, auth.uid())
  );

DROP POLICY IF EXISTS "Admin delete followup" ON public.followups;
CREATE POLICY "Admin delete followup" ON public.followups
  FOR DELETE USING (public.is_workspace_admin(workspace_id, auth.uid()));

DROP TRIGGER IF EXISTS trg_followups_updated ON public.followups;
CREATE TRIGGER trg_followups_updated
  BEFORE UPDATE ON public.followups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recipient view" ON public.notifications;
CREATE POLICY "Recipient view" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Recipient update" ON public.notifications;
CREATE POLICY "Recipient update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Recipient delete" ON public.notifications;
CREATE POLICY "Recipient delete" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can insert notifications" ON public.notifications;
CREATE POLICY "Members can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- =========================
-- WORKSPACE INVITES
-- =========================
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.workspace_role NOT NULL DEFAULT 'agent',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by UUID,
  status public.invite_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_workspace ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.workspace_invites(lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_unique_pending
  ON public.workspace_invites(workspace_id, lower(email)) WHERE status = 'pending';

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage invites" ON public.workspace_invites;
CREATE POLICY "Admins manage invites" ON public.workspace_invites
  FOR ALL USING (public.is_workspace_admin(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "View own invites by email" ON public.workspace_invites;
CREATE POLICY "View own invites by email" ON public.workspace_invites
  FOR SELECT USING (
    lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

-- =========================
-- AUTO-CREATE FOLLOWUP + ACTIVITY ON NEW LEAD
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignee UUID;
BEGIN
  v_assignee := COALESCE(NEW.created_by, (SELECT owner_id FROM public.workspaces WHERE id = NEW.workspace_id));

  -- Auto follow-up in 10 minutes
  IF v_assignee IS NOT NULL THEN
    INSERT INTO public.followups (workspace_id, lead_id, assigned_to, created_by, type, title, due_at)
    VALUES (
      NEW.workspace_id,
      NEW.id,
      v_assignee,
      NEW.created_by,
      'call',
      'Initial outreach: ' || NEW.full_name,
      now() + interval '10 minutes'
    );
  END IF;

  -- Activity log
  INSERT INTO public.activity_logs (workspace_id, lead_id, actor_id, type, description)
  VALUES (NEW.workspace_id, NEW.id, NEW.created_by, 'lead.created', 'Lead created: ' || NEW.full_name);

  -- Notify all workspace admins
  INSERT INTO public.notifications (workspace_id, user_id, type, title, body, link)
  SELECT NEW.workspace_id, wm.user_id, 'lead.created', 'New lead: ' || NEW.full_name,
         COALESCE(NEW.phone, ''), '/dashboard/leads'
  FROM public.workspace_members wm
  WHERE wm.workspace_id = NEW.workspace_id
    AND wm.is_active = true
    AND wm.role = 'admin'
    AND wm.user_id <> COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_lead ON public.leads;
CREATE TRIGGER trg_handle_new_lead
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_lead();

-- =========================
-- NOTIFY ON LEAD ASSIGNMENT
-- =========================
CREATE OR REPLACE FUNCTION public.handle_lead_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_name TEXT;
BEGIN
  IF NEW.assigned_to IS NULL THEN RETURN NEW; END IF;

  SELECT full_name INTO v_lead_name FROM public.leads WHERE id = NEW.lead_id;

  INSERT INTO public.notifications (workspace_id, user_id, type, title, body, link)
  VALUES (NEW.workspace_id, NEW.assigned_to, 'lead.assigned',
          'Lead assigned to you', COALESCE(v_lead_name, 'New lead'), '/dashboard/leads');

  INSERT INTO public.activity_logs (workspace_id, lead_id, actor_id, type, description)
  VALUES (NEW.workspace_id, NEW.lead_id, NEW.assigned_by, 'lead.assigned',
          'Lead assigned to user');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_lead_assignment ON public.lead_assignments;
CREATE TRIGGER trg_handle_lead_assignment
  AFTER INSERT ON public.lead_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_lead_assignment();

-- =========================
-- NOTIFY ON FOLLOWUP CREATION
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_followup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NULL THEN RETURN NEW; END IF;

  -- Don't notify the creator if they assigned to themselves
  IF NEW.assigned_to <> COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    INSERT INTO public.notifications (workspace_id, user_id, type, title, body, link)
    VALUES (NEW.workspace_id, NEW.assigned_to, 'followup.created',
            'New follow-up: ' || NEW.title,
            to_char(NEW.due_at, 'Mon DD, HH24:MI'),
            '/dashboard/followups');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_followup ON public.followups;
CREATE TRIGGER trg_handle_new_followup
  AFTER INSERT ON public.followups
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_followup();

-- =========================
-- ACCEPT INVITE FUNCTION
-- =========================
CREATE OR REPLACE FUNCTION public.accept_workspace_invite(_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_email TEXT;
BEGIN
  v_email := lower(coalesce((auth.jwt() ->> 'email'), ''));

  SELECT * INTO v_invite FROM public.workspace_invites
  WHERE token = _token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or expired';
  END IF;

  IF lower(v_invite.email) <> v_email THEN
    RAISE EXCEPTION 'Invite email does not match your account';
  END IF;

  -- Add as workspace member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_invite.workspace_id, auth.uid(), v_invite.role)
  ON CONFLICT DO NOTHING;

  UPDATE public.workspace_invites
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invite.id;

  RETURN v_invite.workspace_id;
END;
$$;

-- =========================
-- ROUND-ROBIN ASSIGNMENT HELPER
-- =========================
CREATE OR REPLACE FUNCTION public.next_round_robin_assignee(_workspace_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT wm.user_id INTO v_user_id
  FROM public.workspace_members wm
  LEFT JOIN (
    SELECT assigned_to, COUNT(*) AS cnt
    FROM public.lead_assignments
    WHERE workspace_id = _workspace_id AND is_active = true
    GROUP BY assigned_to
  ) la ON la.assigned_to = wm.user_id
  WHERE wm.workspace_id = _workspace_id
    AND wm.is_active = true
    AND wm.role IN ('admin','agent')
  ORDER BY COALESCE(la.cnt, 0) ASC, wm.created_at ASC
  LIMIT 1;

  RETURN v_user_id;
END;
$$;

-- =========================
-- REALTIME
-- =========================
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.followups REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.followups;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;