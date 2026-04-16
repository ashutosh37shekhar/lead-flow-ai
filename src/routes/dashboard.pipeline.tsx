import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Lead {
  id: number;
  name: string;
  email: string;
  score: number;
  tag: string;
  source: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  leads: Lead[];
}

const initialStages: Stage[] = [
  {
    id: "new", name: "New", color: "bg-info",
    leads: [
      { id: 1, name: "Sarah Miller", email: "sarah@ex.com", score: 85, tag: "Hot", source: "Facebook" },
      { id: 4, name: "Michael Brown", email: "michael@ex.com", score: 34, tag: "Cold", source: "Facebook" },
    ],
  },
  {
    id: "contacted", name: "Contacted", color: "bg-warning",
    leads: [
      { id: 2, name: "James Wilson", email: "james@ex.com", score: 62, tag: "Warm", source: "Instagram" },
    ],
  },
  {
    id: "interested", name: "Interested", color: "bg-success",
    leads: [
      { id: 3, name: "Emily Davis", email: "emily@ex.com", score: 91, tag: "Hot", source: "Facebook" },
    ],
  },
  {
    id: "not_interested", name: "Not Interested", color: "bg-destructive",
    leads: [
      { id: 6, name: "Daniel Lee", email: "daniel@ex.com", score: 22, tag: "Cold", source: "Facebook" },
    ],
  },
  {
    id: "converted", name: "Converted", color: "bg-primary",
    leads: [
      { id: 5, name: "Jessica Taylor", email: "jessica@ex.com", score: 95, tag: "Hot", source: "Instagram" },
    ],
  },
];

export const Route = createFileRoute("/dashboard/pipeline")({
  component: PipelinePage,
});

function PipelinePage() {
  const [stages] = useState<Stage[]>(initialStages);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">Drag and drop leads between stages</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Stage</Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
              <h3 className="text-sm font-semibold">{stage.name}</h3>
              <span className="text-xs text-muted-foreground ml-auto">{stage.leads.length}</span>
            </div>
            <div className="space-y-2">
              {stage.leads.map((lead) => (
                <div key={lead.id} className="kanban-card rounded-lg border border-border bg-card p-4 cursor-grab">
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lead.email}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="inline-flex items-center rounded-full bg-meta-blue/10 px-2 py-0.5 text-[10px] font-medium text-meta-blue">
                      {lead.source}
                    </span>
                    <ScoreTag score={lead.score} tag={lead.tag} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreTag({ score, tag }: { score: number; tag: string }) {
  const colors: Record<string, string> = { Hot: "text-lead-hot bg-lead-hot/10", Warm: "text-lead-warm bg-lead-warm/10", Cold: "text-lead-cold bg-lead-cold/10" };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", colors[tag] || "")}>
      {score} · {tag}
    </span>
  );
}
