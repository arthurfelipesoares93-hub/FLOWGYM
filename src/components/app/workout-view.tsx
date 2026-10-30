import { AlertTriangle } from "lucide-react";
import type { FullVersion } from "./workout-data";

export function WorkoutView({ v, actions }: { v: FullVersion; actions?: (sessionId: string) => React.ReactNode }) {
  return (
    <div className="space-y-5">
      {v.requires_clearance && (
        <div className="flex gap-2 rounded-lg border border-warning/50 bg-warning/15 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Há restrições de saúde informadas. Exercícios na região afetada dependem de avaliação profissional adequada.</span>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {v.summary && <Info t="Resumo" d={v.summary} />}
        {v.weekly_split && <Info t="Divisão semanal" d={v.weekly_split} />}
        {v.progression && <Info t="Progressão planejada" d={v.progression} />}
        {v.cautions && <Info t="Cuidados" d={v.cautions} />}
        {v.trainer_notes && <Info t="Observações do treinador" d={v.trainer_notes} />}
      </div>
      {v.sessions.map((s) => (
        <div key={s.id} className="overflow-hidden rounded-xl border bg-card shadow-card">
          <div className="flex flex-col gap-2 bg-sidebar px-4 py-3 text-sidebar-accent-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xl font-bold uppercase">{s.name}</p>
              <p className="text-xs text-sidebar-foreground">{[s.day_of_week, s.muscle_groups].filter(Boolean).join(" · ")}</p>
            </div>
            {actions?.(s.id)}
          </div>
          <ol className="divide-y">
            {s.exercises.map((e, i) => (
              <li key={e.id} className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{i + 1}. {e.name} <span className="text-xs font-normal text-muted-foreground">{e.muscle_group}</span></p>
                  <p className="text-sm font-semibold">{e.sets} × {e.reps} <span className="font-normal text-muted-foreground">· descanso {e.rest_seconds}s</span></p>
                </div>
                {e.instructions && <p className="mt-1 text-sm text-muted-foreground">{e.instructions}</p>}
                {e.alternatives && <p className="mt-1 text-xs"><b>Alternativas:</b> {e.alternatives}</p>}
                {e.video_url && <a href={e.video_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-semibold text-primary">Assistir demonstração ↗</a>}
                {e.notes && <p className="mt-1 text-xs"><b>Obs.:</b> {e.notes}</p>}
              </li>
            ))}
          </ol>
          {s.notes && <p className="border-t px-4 py-2 text-xs text-muted-foreground">{s.notes}</p>}
        </div>
      ))}
    </div>
  );
}

function Info({ t, d }: { t: string; d: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{t}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{d}</p>
    </div>
  );
}
