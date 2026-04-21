import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface IntegrationCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  connected: boolean;
  children: ReactNode;
}

export function IntegrationCard({ icon, title, description, connected, children }: IntegrationCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-muted flex items-center justify-center">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{title}</h3>
            {connected ? (
              <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <XCircle className="h-3 w-3" /> Not connected
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
