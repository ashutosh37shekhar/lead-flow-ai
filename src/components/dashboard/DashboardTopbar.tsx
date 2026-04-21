import { useAuth } from "@/hooks/useAuth";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

export function DashboardTopbar() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string) || user?.email || "";
  const initials = name
    ? name
        .split(/[\s@.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
    : "?";

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 gap-4">
      <div className="flex items-center gap-3">
        <WorkspaceSwitcher />
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
          {initials}
        </div>
      </div>
    </header>
  );
}
