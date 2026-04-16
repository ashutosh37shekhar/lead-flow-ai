import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Plus } from "lucide-react";

const leads = [
  { id: 1, name: "Sarah Miller", email: "sarah@example.com", phone: "+1 555-0123", source: "Facebook", form: "Free Consultation", campaign: "Spring Sale", status: "New", score: 85, scoreTag: "Hot", date: "Apr 16, 2026" },
  { id: 2, name: "James Wilson", email: "james@example.com", phone: "+1 555-0456", source: "Instagram", form: "Get a Quote", campaign: "Brand Awareness", status: "Contacted", score: 62, scoreTag: "Warm", date: "Apr 16, 2026" },
  { id: 3, name: "Emily Davis", email: "emily@example.com", phone: "+1 555-0789", source: "Facebook", form: "Free Consultation", campaign: "Spring Sale", status: "Interested", score: 91, scoreTag: "Hot", date: "Apr 15, 2026" },
  { id: 4, name: "Michael Brown", email: "michael@example.com", phone: "+1 555-0321", source: "Facebook", form: "Newsletter", campaign: "Retarget", status: "New", score: 34, scoreTag: "Cold", date: "Apr 15, 2026" },
  { id: 5, name: "Jessica Taylor", email: "jessica@example.com", phone: "+1 555-0654", source: "Instagram", form: "Get a Quote", campaign: "Brand Awareness", status: "Converted", score: 95, scoreTag: "Hot", date: "Apr 14, 2026" },
  { id: 6, name: "Daniel Lee", email: "daniel@example.com", phone: "+1 555-0987", source: "Facebook", form: "Free Consultation", campaign: "Spring Sale", status: "Not Interested", score: 22, scoreTag: "Cold", date: "Apr 14, 2026" },
];

export const Route = createFileRoute("/dashboard/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Manage all your captured leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Lead</Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Filters</Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Phone</th>
              <th className="text-left p-4 font-medium">Source</th>
              <th className="text-left p-4 font-medium">Form</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Score</th>
              <th className="text-left p-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                <td className="p-4 text-sm font-medium">{lead.name}</td>
                <td className="p-4 text-sm text-muted-foreground">{lead.email}</td>
                <td className="p-4 text-sm text-muted-foreground">{lead.phone}</td>
                <td className="p-4">
                  <span className="inline-flex items-center rounded-full bg-meta-blue/10 px-2 py-0.5 text-xs font-medium text-meta-blue">{lead.source}</span>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{lead.form}</td>
                <td className="p-4">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="p-4">
                  <ScoreBadge score={lead.score} tag={lead.scoreTag} />
                </td>
                <td className="p-4 text-sm text-muted-foreground">{lead.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    New: "bg-info/10 text-info",
    Contacted: "bg-warning/10 text-warning",
    Interested: "bg-success/10 text-success",
    Converted: "bg-primary/10 text-primary",
    "Not Interested": "bg-destructive/10 text-destructive",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>{status}</span>;
}

function ScoreBadge({ score, tag }: { score: number; tag: string }) {
  const colors: Record<string, string> = { Hot: "text-lead-hot", Warm: "text-lead-warm", Cold: "text-lead-cold" };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-sm font-semibold ${colors[tag] || ""}`}>{score}</span>
      <span className={`text-xs ${colors[tag] || ""}`}>{tag}</span>
    </div>
  );
}
