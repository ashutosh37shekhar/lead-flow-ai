import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal } from "lucide-react";

const team = [
  { name: "John Doe", email: "john@company.com", role: "Owner", leads: 312, converted: 45 },
  { name: "Alice Smith", email: "alice@company.com", role: "Sales Agent", leads: 187, converted: 28 },
  { name: "Bob Johnson", email: "bob@company.com", role: "Sales Agent", leads: 156, converted: 22 },
  { name: "Carol White", email: "carol@company.com", role: "Staff", leads: 89, converted: 12 },
];

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
});

function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">Manage your team members and assign leads</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Member</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {team.map((m) => (
          <div key={m.email} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {m.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
            </div>
            <p className="text-sm font-semibold">{m.name}</p>
            <p className="text-xs text-muted-foreground">{m.role}</p>
            <div className="flex gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-lg font-bold">{m.leads}</p>
                <p className="text-[10px] text-muted-foreground">Leads</p>
              </div>
              <div>
                <p className="text-lg font-bold">{m.converted}</p>
                <p className="text-[10px] text-muted-foreground">Converted</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
