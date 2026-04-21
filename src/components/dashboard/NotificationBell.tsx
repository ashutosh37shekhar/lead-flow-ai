import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchNotifications, markAllRead, markRead, timeAgo, type Notification,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try { setItems(await fetchNotifications(user.id)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as Notification;
        setItems((prev) => [n, ...prev].slice(0, 30));
        toast(n.title, { description: n.body ?? undefined });
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as Notification;
        setItems((prev) => prev.map((p) => p.id === n.id ? n : p));
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user?.id]);

  const unread = items.filter((i) => !i.is_read).length;

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await markRead(n.id);
      setItems((prev) => prev.map((p) => p.id === n.id ? { ...p, is_read: true } : p));
    }
    setOpen(false);
  };

  const handleMarkAll = async () => {
    if (!user) return;
    await markAllRead(user.id);
    setItems((prev) => prev.map((p) => ({ ...p, is_read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-semibold text-sm">Notifications</div>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={handleMarkAll}>
              <CheckCheck className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[420px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => {
                const Wrapper = n.link ? Link : "div" as any;
                const wrapperProps = n.link ? { to: n.link } : {};
                return (
                  <Wrapper
                    key={n.id}
                    {...wrapperProps}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "block p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      !n.is_read && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full shrink-0 mt-1.5",
                        n.is_read ? "bg-transparent" : "bg-primary",
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{n.title}</div>
                        {n.body && <div className="text-xs text-muted-foreground truncate">{n.body}</div>}
                        <div className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
