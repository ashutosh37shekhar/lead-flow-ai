import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DashboardTopbar() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search leads, contacts..." className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-8" />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
          JD
        </div>
      </div>
    </header>
  );
}
