import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your company and account settings</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Company Profile</h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input defaultValue="Acme Inc." />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue="admin@acme.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input defaultValue="+1 555-0100" />
          </div>
        </div>
        <Button>Save Changes</Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Subscription</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Pro Plan</p>
            <p className="text-xs text-muted-foreground">5,000 leads/month · 5 team members</p>
          </div>
          <Button variant="outline" size="sm">Upgrade</Button>
        </div>
      </div>

      <div className="rounded-xl border border-destructive/20 bg-card p-6 space-y-4">
        <h3 className="font-semibold text-destructive">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back.</p>
        <Button variant="destructive" size="sm">Delete Account</Button>
      </div>
    </div>
  );
}
