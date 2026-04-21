import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace, type WorkspaceRole } from "@/hooks/useWorkspace";
import { createInvite } from "@/lib/team";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export function InviteDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("agent");
  const [submitting, setSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !currentWorkspace) return;
    if (!email.trim()) return toast.error("Email required");
    setSubmitting(true);
    try {
      const res = await createInvite(currentWorkspace.id, email, role, user.id);
      const link = `${window.location.origin}/invite/${res.token}`;
      setCreatedLink(link);
      toast.success("Invite created");
      onCreated?.();
    } catch (e: any) {
      toast.error(e.message ?? "Could not create invite");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setEmail(""); setRole("agent"); setCreatedLink(null); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send the invite link below. They must sign up with the same email.
          </DialogDescription>
        </DialogHeader>

        {createdLink ? (
          <div className="space-y-3 py-2">
            <Label>Invite link</Label>
            <div className="flex gap-2">
              <Input value={createdLink} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => {
                void navigator.clipboard.writeText(createdLink);
                toast.success("Copied");
              }}><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">Expires in 7 days. Share securely.</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — full access</SelectItem>
                  <SelectItem value="agent">Agent — manage assigned leads</SelectItem>
                  <SelectItem value="viewer">Viewer — read only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          {createdLink ? (
            <Button onClick={() => { reset(); onOpenChange(false); }}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create invite
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
