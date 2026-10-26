import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBox, Loading, PageHeader } from "./ui-bits";
import { dateTimeBR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  const mark = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const unread = (q.data ?? []).filter((n) => !n.read_at).map((n) => n.id);
  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Avisos internos do sistema."
        actions={unread.length > 0 && <Button variant="outline" onClick={() => mark.mutate(unread)}>Marcar todas como lidas</Button>}
      />
      {q.isLoading ? <Loading /> : q.error ? <ErrorBox error={q.error} /> : !q.data?.length ? (
        <EmptyState title="Nenhuma notificação" />
      ) : (
        <ul className="space-y-2">
          {q.data.map((n) => (
            <li key={n.id} className={cn("flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between", !n.read_at && "border-l-4 border-l-accent")}>
              <div>
                <p className="font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dateTimeBR(n.created_at)}</p>
              </div>
              <div className="flex gap-2">
                {n.link && <Button asChild size="sm" variant="outline"><Link to={n.link} onClick={() => !n.read_at && mark.mutate([n.id])}>Abrir</Link></Button>}
                {!n.read_at && <Button size="sm" variant="ghost" onClick={() => mark.mutate([n.id])}>Marcar como lida</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
