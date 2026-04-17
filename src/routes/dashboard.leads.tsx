import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Inbox } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

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
          <Button variant="outline" size="sm" disabled><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" disabled />
        </div>
        <Button variant="outline" size="sm" disabled><Filter className="h-4 w-4 mr-1" /> Filters</Button>
      </div>

      <EmptyState
        title="No leads captured yet"
        description="Connect your Meta account to start receiving leads from your Facebook & Instagram Lead Ad forms."
        icon={Inbox}
      />
    </div>
  );
}
