import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Confirm, EmptyState, ErrorBox, Loading } from "./ui-bits";
import { dateBR, errMsg } from "@/lib/format";

export function usePhotos(studentId: string | undefined) {
  return useQuery({
    queryKey: ["photos", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase.from("body_photos").select("*").eq("student_id", studentId).order("taken_on", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      if (!data.length) return [];
      const { data: urls } = await supabase.storage.from("body-photos").createSignedUrls(data.map((p) => p.storage_path), 3600);
      return data.map((p, i) => ({ ...p, url: urls?.[i]?.signedUrl ?? null }));
    },
  });
}

export function PhotoGallery({ studentId, canDelete }: { studentId: string; canDelete: boolean }) {
  const qc = useQueryClient();
  const q = usePhotos(studentId);
  const [compare, setCompare] = useState<[string, string]>(["", ""]);
  const del = useMutation({
    mutationFn: async (p: { id: string; storage_path: string }) => {
      const { error: e1 } = await supabase.storage.from("body-photos").remove([p.storage_path]);
      if (e1) throw e1;
      const { error } = await supabase.from("body_photos").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Foto excluída."); qc.invalidateQueries({ queryKey: ["photos", studentId] }); },
    onError: (e) => toast.error(errMsg(e)),
  });

  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const photos = q.data ?? [];
  if (!photos.length) return <EmptyState title="Nenhuma fotografia" description="As fotos enviadas aparecerão aqui em ordem cronológica." />;

  const byDate = photos.reduce<Record<string, typeof photos>>((acc, p) => { (acc[p.taken_on] ||= []).push(p); return acc; }, {});
  const dates = Object.keys(byDate);
  const sel = (i: 0 | 1) => (
    <select className="h-9 rounded-md border bg-background px-2 text-sm" value={compare[i]} onChange={(e) => setCompare((c) => (i === 0 ? [e.target.value, c[1]] : [c[0], e.target.value]))}>
      <option value="">Escolha uma data</option>
      {dates.map((d) => <option key={d} value={d}>{dateBR(d)}</option>)}
    </select>
  );

  return (
    <div className="space-y-6">
      {dates.length > 1 && (
        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="mb-3 text-sm font-semibold uppercase">Comparar datas</p>
          <div className="flex flex-wrap gap-2">{sel(0)}{sel(1)}</div>
          {compare[0] && compare[1] && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {compare.map((d, i) => (
                <div key={i}>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">{dateBR(d)}</p>
                  <div className="space-y-2">{(byDate[d] ?? []).map((p) => p.url && <img key={p.id} src={p.url} alt={`Foto de ${dateBR(d)}`} className="w-full rounded-lg object-cover" />)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {dates.map((d) => (
        <div key={d}>
          <p className="mb-2 text-sm font-semibold">{dateBR(d)}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(byDate[d] ?? []).map((p) => (
              <figure key={p.id} className="group relative overflow-hidden rounded-lg border bg-muted">
                {p.url ? <img src={p.url} alt={p.angle ?? "Foto corporal"} loading="lazy" className="aspect-[3/4] w-full object-cover" /> : <div className="aspect-[3/4]" />}
                {(p.angle || p.notes) && <figcaption className="p-2 text-xs">{[p.angle, p.notes].filter(Boolean).join(" · ")}</figcaption>}
                {canDelete && (
                  <Confirm
                    destructive
                    title="Excluir fotografia?"
                    description="Esta ação não pode ser desfeita."
                    confirmLabel="Excluir"
                    onConfirm={() => del.mutate(p)}
                    trigger={<Button size="icon" variant="secondary" className="absolute right-2 top-2 h-8 w-8" aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>}
                  />
                )}
              </figure>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
