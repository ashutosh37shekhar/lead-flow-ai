import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UserPlus, Loader2, Copy, MoreHorizontal, Shield, ShieldOff, Trash2, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteDialog } from "@/components/team/InviteDialog";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace, type WorkspaceRole } from "@/hooks/useWorkspace";
import {
  fetchTeam, fetchInvites, revokeInvite, setMemberActive, setMemberRole,
  type TeamMember, type PendingInvite,
} from "@/lib/team";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
});

const roleColors: Record<WorkspaceRole, string> = {
  admin: "bg-primary/15 text-primary",
  agent: "bg-success/15 text-success",
  viewer: "bg-muted text-muted-foreground",
};

function TeamPage() {
  const { user } = useAuth();
  const { currentWorkspace, isAdmin } = useWorkspace();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [m, i] = await Promise.all([
        fetchTeam(currentWorkspace.id),
        fetchInvites(currentWorkspace.id),
      ]);
      setMembers(m);
      setInvites(i);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [currentWorkspace?.id]);

  const handleRoleChange = async (uid: string, role: WorkspaceRole) => {
    if (!currentWorkspace) return;
    try { await setMemberRole(currentWorkspace.id, uid, role); toast.success("Role updated"); void refresh(); }
    catch (e: any) { toast.error(e.message); }
  };
  const toggleActive = async (uid: string, active: boolean) => {
    if (!currentWorkspace) return;
    try { await setMemberActive(currentWorkspace.id, uid, active); toast.success(active ? "Enabled" : "Disabled"); void refresh(); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleRevoke = async (id: string) => {
    try { await revokeInvite(id); toast.success("Invite revoked"); void refresh(); }
    catch (e: any) { toast.error(e.message); }
  };
  const copyLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    void navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">Members and pending invites in this workspace</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite member
          </Button>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="invites">Invites ({invites.filter((i) => i.status === "pending").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.user_id}>
                      <TableCell className="font-medium">
                        {m.full_name}
                        {m.user_id === user?.id && <span className="text-xs text-muted-foreground ml-2">(you)</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.email}</TableCell>
                      <TableCell>
                        {isAdmin && m.user_id !== user?.id ? (
                          <Select value={m.role} onValueChange={(v) => handleRoleChange(m.user_id, v as WorkspaceRole)}>
                            <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={roleColors[m.role]}>{m.role}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.is_active ? (
                          <Badge variant="outline" className="text-success border-success/50">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin && m.user_id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleActive(m.user_id, !m.is_active)}>
                                {m.is_active ? <><ShieldOff className="h-4 w-4" /> Disable</>
                                  : <><Shield className="h-4 w-4" /> Enable</>}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : invites.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No invites yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell><Badge className={roleColors[inv.role]}>{inv.role}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "pending" ? "outline" : "secondary"}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {inv.status === "pending" && isAdmin && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => copyLink(inv.token)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRevoke(inv.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <InviteDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={refresh} />
    </div>
  );
}
