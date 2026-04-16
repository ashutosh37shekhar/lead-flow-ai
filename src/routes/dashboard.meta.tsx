import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Plug, RefreshCw, CheckCircle, XCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard/meta")({
  component: MetaPage,
});

function MetaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meta Integration</h1>
        <p className="text-sm text-muted-foreground">Connect and manage your Facebook & Instagram Lead Ads</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-meta-blue/10 flex items-center justify-center">
            <svg className="h-6 w-6 text-meta-blue" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z"/></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Meta Business Account</h3>
            <p className="text-sm text-muted-foreground">Connect to sync leads from Facebook & Instagram</p>
          </div>
          <Button variant="meta" size="lg">
            <Plug className="h-4 w-4 mr-1" /> Connect Meta Account
          </Button>
        </div>

        <div className="border-t border-border pt-6">
          <h4 className="text-sm font-semibold mb-4">Connected Pages</h4>
          <div className="space-y-3">
            {[
              { name: "Acme Business Page", status: "active", forms: 3, lastSync: "2 min ago" },
              { name: "Acme Instagram", status: "active", forms: 1, lastSync: "5 min ago" },
            ].map((page) => (
              <div key={page.name} className="flex items-center gap-4 rounded-lg border border-border p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{page.name}</p>
                    <CheckCircle className="h-3.5 w-3.5 text-success" />
                  </div>
                  <p className="text-xs text-muted-foreground">{page.forms} forms · Last sync: {page.lastSync}</p>
                </div>
                <Button variant="outline" size="sm"><RefreshCw className="h-3 w-3 mr-1" /> Sync Now</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
