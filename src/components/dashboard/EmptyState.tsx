import { Link } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  showConnectMeta?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  title = "No data yet",
  description = "Connect your Meta account to start syncing leads from Facebook & Instagram. Until then, your dashboard will stay empty.",
  showConnectMeta = true,
  icon: Icon = Plug,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 flex flex-col items-center justify-center text-center">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-5">{description}</p>
      {showConnectMeta && (
        <Button asChild variant="meta" size="sm">
          <Link to="/dashboard/meta">
            <Plug className="h-4 w-4 mr-1" /> Connect Meta Account
          </Link>
        </Button>
      )}
    </div>
  );
}
