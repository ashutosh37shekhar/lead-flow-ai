import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const Route = createFileRoute("/dashboard/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
        <p className="text-sm text-muted-foreground">Set up rules to automate your lead workflow</p>
      </div>

      <EmptyState
        title="No automations configured"
        description="Once Meta is connected, you'll be able to create rules to auto-assign leads, send notifications, and schedule follow-ups."
        icon={Bot}
      />
    </div>
  );
}
