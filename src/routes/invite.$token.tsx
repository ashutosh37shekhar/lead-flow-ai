import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ready" | "accepting" | "done" | "error">("checking");
  const [invite, setInvite] = useState<{ workspace_name: string; role: string; email: string } | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    void (async () => {
      const { data, error } = await supabase
        .from("workspace_invites")
        .select("email, role, status, expires_at, workspace_id, workspaces!inner(name)")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) {
        setError("Invite not found");
        setStatus("error");
        return;
      }
      if (data.status !== "pending" || new Date(data.expires_at).getTime() < Date.now()) {
        setError("This invite is no longer valid");
        setStatus("error");
        return;
      }
      setInvite({
        email: data.email,
        role: data.role,
        workspace_name: (data.workspaces as any)?.name ?? "Workspace",
      });
      setStatus("ready");
    })();
  }, [token, authLoading]);

  const accept = async () => {
    if (!user) {
      navigate({ to: "/signup", search: { invite: token } as any });
      return;
    }
    setStatus("accepting");
    const { data, error } = await supabase.rpc("accept_workspace_invite", { _token: token });
    if (error) {
      toast.error(error.message);
      setStatus("ready");
      return;
    }
    setStatus("done");
    toast.success("Welcome to the workspace!");
    setTimeout(() => navigate({ to: "/dashboard" }), 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        {status === "checking" && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold mb-2">Invalid invite</h1>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate({ to: "/" })}>Go home</Button>
          </>
        )}
        {(status === "ready" || status === "accepting") && invite && (
          <>
            <h1 className="text-xl font-semibold mb-1">You're invited!</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Join <span className="font-medium text-foreground">{invite.workspace_name}</span> as a{" "}
              <span className="font-medium text-foreground">{invite.role}</span>
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Invite sent to {invite.email}. {!user && "Sign up or log in with this email to accept."}
            </p>
            {user && user.email?.toLowerCase() !== invite.email.toLowerCase() && (
              <p className="text-xs text-destructive mb-4">
                You're logged in as {user.email} — sign out and use {invite.email}.
              </p>
            )}
            <Button onClick={accept} disabled={status === "accepting"} className="w-full">
              {status === "accepting" && <Loader2 className="h-4 w-4 animate-spin" />}
              {user ? "Accept invite" : "Sign up & accept"}
            </Button>
          </>
        )}
        {status === "done" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-2" />
            <h1 className="text-xl font-semibold">Joined!</h1>
            <p className="text-sm text-muted-foreground">Redirecting…</p>
          </>
        )}
      </div>
    </div>
  );
}
