import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/leads";

interface Stage {
  id: string;
  name: string;
  color: string | null;
}

interface Props {
  stages: Stage[];
  leads: Lead[];
  onMove: (leadId: string, newStageId: string) => Promise<void>;
  onLeadClick: (leadId: string) => void;
}

export function PipelineKanban({ stages, leads, onMove, onLeadClick }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const onDragStart = (e: DragStartEvent) => {
    const lead = leads.find((l) => l.id === e.active.id);
    setActiveLead(lead ?? null);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveLead(null);
    const leadId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage_id === overId) return;
    await onMove(leadId, overId);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage_id === stage.id);
          return (
            <KanbanColumn key={stage.id} stage={stage} leads={stageLeads} onLeadClick={onLeadClick} />
          );
        })}
      </div>
      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} dragging onClick={() => {}} />}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ stage, leads, onLeadClick }: { stage: Stage; leads: Lead[]; onLeadClick: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: stage.color ?? "#6366f1" }}
        />
        <h3 className="text-sm font-semibold">{stage.name}</h3>
        <span className="text-xs text-muted-foreground ml-auto">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-lg border border-dashed border-border bg-card/40 p-2 min-h-[200px] space-y-2 transition-colors",
          isOver && "bg-primary/5 border-primary/40"
        )}
      >
        {leads.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Drop leads here</p>
        )}
        {leads.map((lead) => (
          <DraggableLead key={lead.id} lead={lead} onClick={() => onLeadClick(lead.id)} />
        ))}
      </div>
    </div>
  );
}

function DraggableLead({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(isDragging && "opacity-30")}
    >
      <LeadCard lead={lead} onClick={onClick} />
    </div>
  );
}

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning",
  high: "bg-destructive/15 text-destructive",
};

function LeadCard({ lead, dragging, onClick }: { lead: Lead; dragging?: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-md border border-border bg-card p-3 cursor-pointer hover:border-primary/40 transition-colors",
        dragging && "shadow-lg rotate-1"
      )}
    >
      <p className="text-sm font-medium truncate">{lead.full_name}</p>
      <p className="text-xs text-muted-foreground truncate">{lead.phone}</p>
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", priorityColors[lead.priority])}>
          {lead.priority}
        </Badge>
        {lead.business_interest && (
          <span className="text-[10px] text-muted-foreground truncate">{lead.business_interest}</span>
        )}
      </div>
    </div>
  );
}
