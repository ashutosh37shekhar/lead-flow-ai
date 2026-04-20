
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.workspace_role AS ENUM ('admin', 'agent', 'viewer');
CREATE TYPE public.lead_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.lead_source_type AS ENUM ('manual', 'facebook', 'instagram', 'whatsapp', 'other');

-- =========================================
-- WORKSPACES
-- =========================================
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.workspace_role NOT NULL DEFAULT 'agent',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);

-- =========================================
-- SECURITY DEFINER HELPERS (avoid recursive RLS)
-- =========================================
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_role_of(_workspace_id UUID, _user_id UUID)
RETURNS public.workspace_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = _workspace_id AND user_id = _user_id AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
      AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_workspace(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
      AND role IN ('admin', 'agent') AND is_active = true
  );
$$;

-- =========================================
-- LEAD SOURCES
-- =========================================
CREATE TABLE public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.lead_source_type NOT NULL DEFAULT 'manual',
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_sources_workspace ON public.lead_sources(workspace_id);

-- =========================================
-- PIPELINES & STAGES
-- =========================================
CREATE TABLE public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pipelines_workspace ON public.pipelines(workspace_id);

CREATE TABLE public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  position INTEGER NOT NULL DEFAULT 0,
  is_won BOOLEAN NOT NULL DEFAULT false,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pipeline_stages_pipeline ON public.pipeline_stages(pipeline_id);
CREATE INDEX idx_pipeline_stages_workspace ON public.pipeline_stages(workspace_id);

-- =========================================
-- LEADS
-- =========================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  source_id UUID REFERENCES public.lead_sources(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  business_interest TEXT,
  city TEXT,
  priority public.lead_priority NOT NULL DEFAULT 'medium',
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  tags TEXT[] DEFAULT '{}',
  deal_value NUMERIC(12,2) DEFAULT 0,
  expected_revenue NUMERIC(12,2) DEFAULT 0,
  closed_revenue NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_workspace ON public.leads(workspace_id);
CREATE INDEX idx_leads_stage ON public.leads(stage_id);
CREATE INDEX idx_leads_pipeline ON public.leads(pipeline_id);
CREATE INDEX idx_leads_phone ON public.leads(workspace_id, phone);
CREATE INDEX idx_leads_created ON public.leads(workspace_id, created_at DESC);

-- =========================================
-- LEAD ASSIGNMENTS
-- =========================================
CREATE TABLE public.lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_assignments_lead ON public.lead_assignments(lead_id) WHERE is_active = true;
CREATE INDEX idx_lead_assignments_user ON public.lead_assignments(assigned_to) WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.is_lead_assigned_to(_lead_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lead_assignments
    WHERE lead_id = _lead_id AND assigned_to = _user_id AND is_active = true
  );
$$;

-- =========================================
-- LEAD NOTES
-- =========================================
CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_notes_lead ON public.lead_notes(lead_id, created_at DESC);

-- =========================================
-- ACTIVITY LOGS
-- =========================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_lead ON public.activity_logs(lead_id, created_at DESC);
CREATE INDEX idx_activity_logs_workspace ON public.activity_logs(workspace_id, created_at DESC);

-- =========================================
-- ENABLE RLS
-- =========================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =========================================
-- WORKSPACES POLICIES
-- =========================================
CREATE POLICY "Members can view their workspaces" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins can update workspace" ON public.workspaces
  FOR UPDATE USING (public.is_workspace_admin(id, auth.uid()));
CREATE POLICY "Owner can delete workspace" ON public.workspaces
  FOR DELETE USING (auth.uid() = owner_id);

-- =========================================
-- WORKSPACE_MEMBERS POLICIES
-- =========================================
CREATE POLICY "Members can view workspace members" ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins can manage members" ON public.workspace_members
  FOR ALL USING (public.is_workspace_admin(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));
CREATE POLICY "User can insert self as owner" ON public.workspace_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =========================================
-- LEAD_SOURCES POLICIES
-- =========================================
CREATE POLICY "Members view sources" ON public.lead_sources
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins manage sources" ON public.lead_sources
  FOR ALL USING (public.is_workspace_admin(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));

-- =========================================
-- PIPELINES POLICIES
-- =========================================
CREATE POLICY "Members view pipelines" ON public.pipelines
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins manage pipelines" ON public.pipelines
  FOR ALL USING (public.is_workspace_admin(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));

-- =========================================
-- PIPELINE_STAGES POLICIES
-- =========================================
CREATE POLICY "Members view stages" ON public.pipeline_stages
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins manage stages" ON public.pipeline_stages
  FOR ALL USING (public.is_workspace_admin(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));

-- =========================================
-- LEADS POLICIES
-- Admins: full access. Agents: only assigned leads (read+update). All members: insert. Viewers: read all in workspace.
-- =========================================
CREATE POLICY "Admins view all leads" ON public.leads
  FOR SELECT USING (public.is_workspace_admin(workspace_id, auth.uid()));
CREATE POLICY "Viewers view all leads" ON public.leads
  FOR SELECT USING (public.workspace_role_of(workspace_id, auth.uid()) = 'viewer');
CREATE POLICY "Agents view assigned leads" ON public.leads
  FOR SELECT USING (
    public.workspace_role_of(workspace_id, auth.uid()) = 'agent'
    AND public.is_lead_assigned_to(id, auth.uid())
  );
CREATE POLICY "Members can create leads" ON public.leads
  FOR INSERT WITH CHECK (public.can_edit_workspace(workspace_id, auth.uid()));
CREATE POLICY "Admins can update any lead" ON public.leads
  FOR UPDATE USING (public.is_workspace_admin(workspace_id, auth.uid()));
CREATE POLICY "Agents can update assigned leads" ON public.leads
  FOR UPDATE USING (
    public.workspace_role_of(workspace_id, auth.uid()) = 'agent'
    AND public.is_lead_assigned_to(id, auth.uid())
  );
CREATE POLICY "Admins can delete leads" ON public.leads
  FOR DELETE USING (public.is_workspace_admin(workspace_id, auth.uid()));

-- =========================================
-- LEAD_ASSIGNMENTS POLICIES
-- =========================================
CREATE POLICY "Members view assignments" ON public.lead_assignments
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins manage assignments" ON public.lead_assignments
  FOR ALL USING (public.is_workspace_admin(workspace_id, auth.uid()))
  WITH CHECK (public.is_workspace_admin(workspace_id, auth.uid()));

-- =========================================
-- LEAD_NOTES POLICIES
-- =========================================
CREATE POLICY "Members view notes" ON public.lead_notes
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members create notes" ON public.lead_notes
  FOR INSERT WITH CHECK (
    public.can_edit_workspace(workspace_id, auth.uid())
    AND auth.uid() = author_id
  );
CREATE POLICY "Author or admin update note" ON public.lead_notes
  FOR UPDATE USING (auth.uid() = author_id OR public.is_workspace_admin(workspace_id, auth.uid()));
CREATE POLICY "Author or admin delete note" ON public.lead_notes
  FOR DELETE USING (auth.uid() = author_id OR public.is_workspace_admin(workspace_id, auth.uid()));

-- =========================================
-- ACTIVITY_LOGS POLICIES
-- =========================================
CREATE POLICY "Members view logs" ON public.activity_logs
  FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members create logs" ON public.activity_logs
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- =========================================
-- TRIGGERS — updated_at
-- =========================================
CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pipelines_updated BEFORE UPDATE ON public.pipelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- BOOTSTRAP NEW USER WORKSPACE
-- Replaces existing handle_new_user to also create a default workspace + pipeline + stages + sources
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_workspace_id UUID;
  v_pipeline_id UUID;
  v_full_name TEXT;
  v_company TEXT;
  v_slug TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1));
  v_company := COALESCE(NEW.raw_user_meta_data ->> 'company_name', v_full_name || '''s Workspace');

  -- Profile
  INSERT INTO public.profiles (id, full_name, company_name, email)
  VALUES (NEW.id, v_full_name, v_company, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Legacy role (kept for admin area)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'owner') ON CONFLICT DO NOTHING;

  -- Generate unique slug
  v_slug := lower(regexp_replace(v_company, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 6);

  -- Workspace
  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (v_company, v_slug, NEW.id)
  RETURNING id INTO v_workspace_id;

  -- Owner as admin member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, NEW.id, 'admin');

  -- Default sources
  INSERT INTO public.lead_sources (workspace_id, name, type, color) VALUES
    (v_workspace_id, 'Manual', 'manual', '#64748b'),
    (v_workspace_id, 'Facebook', 'facebook', '#1877f2'),
    (v_workspace_id, 'Instagram', 'instagram', '#e4405f'),
    (v_workspace_id, 'WhatsApp', 'whatsapp', '#25d366');

  -- Default pipeline
  INSERT INTO public.pipelines (workspace_id, name, is_default)
  VALUES (v_workspace_id, 'Sales', true)
  RETURNING id INTO v_pipeline_id;

  -- Default stages
  INSERT INTO public.pipeline_stages (pipeline_id, workspace_id, name, color, position, is_won, is_lost) VALUES
    (v_pipeline_id, v_workspace_id, 'New', '#3b82f6', 0, false, false),
    (v_pipeline_id, v_workspace_id, 'Contacted', '#f59e0b', 1, false, false),
    (v_pipeline_id, v_workspace_id, 'Interested', '#8b5cf6', 2, false, false),
    (v_pipeline_id, v_workspace_id, 'Won', '#22c55e', 3, true, false),
    (v_pipeline_id, v_workspace_id, 'Lost', '#ef4444', 4, false, true);

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- BACKFILL EXISTING USERS (so current accounts get a workspace)
-- =========================================
DO $$
DECLARE
  u RECORD;
  v_workspace_id UUID;
  v_pipeline_id UUID;
  v_company TEXT;
  v_slug TEXT;
BEGIN
  FOR u IN
    SELECT au.id, au.email, p.full_name, p.company_name
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE NOT EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.user_id = au.id)
  LOOP
    v_company := COALESCE(u.company_name, u.full_name, split_part(u.email, '@', 1)) || '''s Workspace';
    v_slug := lower(regexp_replace(v_company, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(u.id::text, 1, 6);

    INSERT INTO public.workspaces (name, slug, owner_id) VALUES (v_company, v_slug, u.id) RETURNING id INTO v_workspace_id;
    INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES (v_workspace_id, u.id, 'admin');

    INSERT INTO public.lead_sources (workspace_id, name, type, color) VALUES
      (v_workspace_id, 'Manual', 'manual', '#64748b'),
      (v_workspace_id, 'Facebook', 'facebook', '#1877f2'),
      (v_workspace_id, 'Instagram', 'instagram', '#e4405f'),
      (v_workspace_id, 'WhatsApp', 'whatsapp', '#25d366');

    INSERT INTO public.pipelines (workspace_id, name, is_default) VALUES (v_workspace_id, 'Sales', true) RETURNING id INTO v_pipeline_id;

    INSERT INTO public.pipeline_stages (pipeline_id, workspace_id, name, color, position, is_won, is_lost) VALUES
      (v_pipeline_id, v_workspace_id, 'New', '#3b82f6', 0, false, false),
      (v_pipeline_id, v_workspace_id, 'Contacted', '#f59e0b', 1, false, false),
      (v_pipeline_id, v_workspace_id, 'Interested', '#8b5cf6', 2, false, false),
      (v_pipeline_id, v_workspace_id, 'Won', '#22c55e', 3, true, false),
      (v_pipeline_id, v_workspace_id, 'Lost', '#ef4444', 4, false, true);
  END LOOP;
END $$;
