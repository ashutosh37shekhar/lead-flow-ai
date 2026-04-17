import { createFileRoute } from "@tanstack/react-router";
import { KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/dashboard/EmptyState";

const stages = [
  { id: "new", name: "New", color: "bg-info" },
  { id: "contacted", name: "Contacted", color: "bg-warning" },
  { id: "interested", name: "Interested", color: "bg-success" },
  { id: "not_interested", name: "Not Interested", color: "bg-destructive" },
  { id: "converted", name: "Converted", color: "bg-primary" },
];

export const Route = createFileRoute("/dashboard/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Drag and drop leads between stages</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
              <h3 className="text-sm font-semibold">{stage.name}</h3>
              <span className="text-xs text-muted-foreground ml-auto">0</span>
            </div>
            <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center">
              <p className="text-xs text-muted-foreground">No leads</p>
            </div>
          </div>
        ))}
      </div>

      <EmptyState
        title="Pipeline is empty"
        description="Once you connect Meta and start receiving leads, you'll be able to move them through your sales stages here."
        icon={KanbanSquare}
      />
    </div>
  );
}
