import { Link, Outlet } from "@tanstack/react-router";
import { useState, useEffect, type ComponentType } from "react";
import { Bell, ChevronsLeft, ChevronsRight, LogOut, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useSignOut } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { usePublicBrand } from "@/lib/public-brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/theme-toggle";

export type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

const COLLAPSE_KEY = "flowgym:sidebar-collapsed";

function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // Sem armazenamento disponível: a barra começa expandida.
    }
  }, []);
  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // O estado vale só nesta sessão.
      }
      return next;
    });
  return [collapsed, toggle] as const;
}

export function Shell({
  nav,
  footerNav = [],
  notificationsTo,
  roleLabel,
}: {
  nav: NavItem[];
  /** Itens fixos no rodapé da barra lateral (ex.: Notificações e Configurações). */
  footerNav?: NavItem[];
  notificationsTo: string;
  roleLabel: string;
}) {
  const { data: brand } = usePublicBrand();
  const [open, setOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useCollapsed();
  const { data: me } = useMe();
  const signOut = useSignOut();
  const { data: unread } = useUnreadCount();
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [open]);

  const brandName = brand?.brand || "Team Oliveira";

  const renderLink = (n: NavItem, i: number, compact: boolean) => (
    <Link
      key={n.to}
      to={n.to}
      title={compact ? n.label : undefined}
      aria-label={compact ? n.label : undefined}
      activeOptions={{ exact: !!n.exact }}
      onClick={() => setOpen(false)}
      style={{ animationDelay: `${i * 40}ms` }}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground enter-soft motion-safe:hover:translate-x-0.5",
        compact && "justify-center px-0",
      )}
      activeProps={{
        className:
          "bg-sidebar-primary !text-sidebar-primary-foreground shadow-sm hover:!bg-sidebar-primary",
      }}
    >
      <n.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {!compact && <span className="flex-1 truncate">{n.label}</span>}
      {n.to === notificationsTo &&
        !!unread &&
        (compact ? (
          <span className="absolute right-1.5 top-1 h-2.5 w-2.5 rounded-full bg-destructive motion-safe:animate-pulse" />
        ) : (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground motion-safe:animate-pulse">
            {unread > 99 ? "99+" : unread}
          </span>
        ))}
    </Link>
  );

  const renderSidebar = (compact: boolean) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex items-center py-5",
          compact ? "justify-center px-2" : "justify-between px-5",
        )}
      >
        <span
          className="font-display text-2xl font-bold uppercase tracking-wider text-sidebar-accent-foreground"
          title={brandName}
        >
          {compact ? brandName.charAt(0) : brandName}
        </span>
        {!compact && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      {!compact && (
        <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
          {roleLabel}
        </p>
      )}
      <nav className="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map((n, i) => renderLink(n, i, compact))}
      </nav>
      {footerNav.length > 0 && (
        <nav className="space-y-0.5 border-t border-sidebar-border px-3 py-3">
          {footerNav.map((n, i) => renderLink(n, nav.length + i, compact))}
        </nav>
      )}
      <div className={cn("border-t border-sidebar-border", compact ? "p-2" : "p-4")}>
        {!compact && (
          <>
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
              {me?.fullName || me?.email}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">{me?.email}</p>
          </>
        )}
        <Button
          variant="ghost"
          onClick={signOut}
          title="Sair"
          aria-label="Sair"
          className={cn(
            "flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-accent-foreground",
            compact ? "w-full justify-center px-0" : "mt-3",
          )}
        >
          <LogOut className="h-4 w-4" /> {!compact && "Sair"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" data-blue-theme={brand?.theme ?? "classico"}>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 transition-[width] duration-300 ease-out lg:z-50 lg:block",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <div className="h-full overflow-hidden">{renderSidebar(collapsed)}</div>
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-pressed={collapsed}
          className="group absolute -right-4 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground ring-[6px] ring-background transition-colors duration-200 hover:text-sidebar-primary-foreground hover:bg-sidebar-primary focus-visible:outline-none focus-visible:ring-sidebar-ring"
        >
          {collapsed ? (
            <ChevronsRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          ) : (
            <ChevronsLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          )}
        </button>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/50 motion-safe:animate-in motion-safe:fade-in"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="absolute inset-y-0 left-0 w-72 max-w-[90vw] motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200"
          >
            {renderSidebar(false)}
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="lg:hidden font-display text-xl font-bold uppercase">{brandName}</div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              to={notificationsTo}
              className="relative rounded-full p-2 hover:bg-muted"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {!!unread && (
                <span
                  className={cn(
                    "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground",
                  )}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
