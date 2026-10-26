import { Link, Outlet } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useSignOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }>; exact?: boolean };

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}

export function Shell({ nav, notificationsTo, roleLabel }: { nav: NavItem[]; notificationsTo: string; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  const { data: me } = useMe();
  const signOut = useSignOut();
  const { data: unread } = useUnreadCount();

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-5 py-5">
        <span className="font-display text-2xl font-bold uppercase tracking-wider text-sidebar-accent-foreground">For<span className="text-sidebar-primary">ja</span></span>
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="h-5 w-5" /></button>
      </div>
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">{roleLabel}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.exact }}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-primary !text-sidebar-primary-foreground hover:!bg-sidebar-primary" }}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{me?.fullName || me?.email}</p>
        <p className="truncate text-xs text-sidebar-foreground/60">{me?.email}</p>
        <button onClick={signOut} className="mt-3 flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-accent-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
          <div className="lg:hidden font-display text-xl font-bold uppercase">For<span className="text-success">ja</span></div>
          <div className="hidden lg:block" />
          <Link to={notificationsTo} className="relative rounded-full p-2 hover:bg-muted" aria-label="Notificações">
            <Bell className="h-5 w-5" />
            {!!unread && (
              <span className={cn("absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground")}>{unread > 99 ? "99+" : unread}</span>
            )}
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
