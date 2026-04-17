import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/dashboard/followups")({
  component: FollowupsPage,
});

function FollowupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Follow-ups</h1>
        <p className="text-sm text-muted-foreground">Manage your scheduled follow-up reminders</p>
      </div>

      <EmptyState
        title="No follow-ups scheduled"
        description="Follow-up reminders will appear here once you start engaging with leads from your Meta-connected forms."
        icon={CalendarClock}
      />
    </div>
  );
}
