import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Phone, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const followups = [
  { id: 1, leadName: "Sarah Miller", type: "Call", note: "Follow up on pricing inquiry", due: "Today, 2:00 PM", overdue: false },
  { id: 2, leadName: "James Wilson", type: "Email", note: "Send product brochure", due: "Today, 4:30 PM", overdue: false },
  { id: 3, leadName: "Emily Davis", type: "Call", note: "Discuss custom package", due: "Yesterday, 10:00 AM", overdue: true },
  { id: 4, leadName: "Michael Brown", type: "Email", note: "Re-engagement email", due: "Apr 18, 2026", overdue: false },
];

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

      <div className="space-y-3">
        {followups.map((f) => (
          <div key={f.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {f.type === "Call" ? <Phone className="h-4 w-4 text-primary" /> : <Mail className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{f.leadName}</p>
              <p className="text-xs text-muted-foreground truncate">{f.note}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3 text-muted-foreground" />
                <span className={`text-xs font-medium ${f.overdue ? "text-destructive" : "text-muted-foreground"}`}>
                  {f.due}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
