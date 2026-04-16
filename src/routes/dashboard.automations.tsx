import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, Zap, ArrowRight } from "lucide-react";

const automations = [
  { name: "Auto-assign new leads", trigger: "New lead received", action: "Assign to round-robin", active: true },
  { name: "Notify on hot lead", trigger: "Lead score > 80", action: "Send notification", active: true },
  { name: "Follow-up reminder", trigger: "No activity for 24h", action: "Create follow-up task", active: false },
];

export const Route = createFileRoute("/dashboard/automations")({
  component: AutomationsPage,
});

function AutomationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
          <p className="text-sm text-muted-foreground">Set up rules to automate your lead workflow</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Automation</Button>
      </div>

      <div className="space-y-3">
        {automations.map((a) => (
          <div key={a.name} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{a.name}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{a.trigger}</span>
                <ArrowRight className="h-3 w-3" />
                <span>{a.action}</span>
              </div>
            </div>
            <div className={`h-2.5 w-2.5 rounded-full ${a.active ? "bg-success" : "bg-muted-foreground/40"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
