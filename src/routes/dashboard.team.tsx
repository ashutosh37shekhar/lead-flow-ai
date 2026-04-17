import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
});

function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">Manage your team members and assign leads</p>
      </div>

      <EmptyState
        title="No team members yet"
        description="Invite team members after connecting Meta so you can assign incoming leads to your sales agents."
        icon={UserPlus}
        showConnectMeta={true}
      />
    </div>
  );
}
