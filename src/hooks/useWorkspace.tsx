import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type WorkspaceRole = "admin" | "agent" | "viewer";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  role: WorkspaceRole;
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  setCurrentWorkspaceId: (id: string) => void;
  refresh: () => Promise<void>;
  isAdmin: boolean;
  canEdit: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const STORAGE_KEY = "leadflow:current_workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("workspace_members")
      .select("role, workspace:workspaces(id, name, slug, owner_id)")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (error || !data) {
      setWorkspaces([]);
      setLoading(false);
      return;
    }

    const list: Workspace[] = data
      .filter((r) => r.workspace)
      .map((r) => ({
        id: (r.workspace as any).id,
        name: (r.workspace as any).name,
        slug: (r.workspace as any).slug,
        owner_id: (r.workspace as any).owner_id,
        role: r.role as WorkspaceRole,
      }));

    setWorkspaces(list);

    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const initial = list.find((w) => w.id === stored) ?? list[0] ?? null;
    setCurrentId(initial?.id ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) void fetchWorkspaces();
  }, [authLoading, fetchWorkspaces]);

  const setCurrentWorkspaceId = (id: string) => {
    setCurrentId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const currentWorkspace = workspaces.find((w) => w.id === currentId) ?? null;
  const isAdmin = currentWorkspace?.role === "admin";
  const canEdit = currentWorkspace?.role === "admin" || currentWorkspace?.role === "agent";

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        loading,
        setCurrentWorkspaceId,
        refresh: fetchWorkspaces,
        isAdmin,
        canEdit,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
