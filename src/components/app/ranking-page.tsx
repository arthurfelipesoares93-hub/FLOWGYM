import { Flame, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "./ui-bits";
import { RankingList, useRankingRows, type RankingRow } from "./student-journey";

const PODIUM = [
  {
    place: 1,
    medal: "text-warning",
    height: "sm:min-h-[16rem]",
    ring: "border-warning/50 bg-warning/10",
  },
  {
    place: 2,
    medal: "text-muted-foreground",
    height: "sm:min-h-[14rem]",
    ring: "border-border bg-card",
  },
  {
    place: 3,
    medal: "text-chart-3",
    height: "sm:min-h-[12.5rem]",
    ring: "border-chart-3/40 bg-chart-3/10",
  },
] as const;

export function Podium({ rows }: { rows: RankingRow[] }) {
  const top = rows.slice(0, 3).filter((r) => r.total > 0);
  if (!top.length) return null;
  // Ordem visual: 2º, 1º, 3º.
  const order = [top[1], top[0], top[2]].map((r, i) => ({ r, p: PODIUM[[1, 0, 2][i] as number]! }));
  return (
    <ol className="grid gap-3 sm:grid-cols-3 sm:items-end" aria-label="Pódio">
      {order.map(({ r, p }) =>
        r ? (
          <li
            key={r.id}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border p-5 text-center shadow-card transition-transform duration-200 hover:-translate-y-1",
              p.ring,
              p.height,
            )}
          >
            <Medal className={cn("h-9 w-9", p.medal)} aria-hidden />
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {p.place}º lugar
            </p>
            <p className="mt-2 max-w-full truncate text-lg font-bold">{r.name}</p>
            <p className="font-display text-2xl font-bold text-primary">{r.lvl.xp} XP</p>
            <p className="text-xs text-muted-foreground">Nível {r.lvl.level}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs">
              <Flame className="h-3.5 w-3.5 text-warning" />
              {r.streak} {r.streak === 1 ? "semana" : "semanas"} na meta
            </p>
          </li>
        ) : (
          <li key={p.place} className="hidden sm:block" aria-hidden />
        ),
      )}
    </ol>
  );
}

export function RankingPage() {
  const rows = useRankingRows();
  const hasData = rows.some((r) => r.total > 0);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ranking de alunos"
        description="Classificação por XP: 10 XP por treino concluído e 25 XP por semana com a meta batida."
      />
      {!hasData && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          O ranking aparece quando os alunos concluírem treinos.
        </p>
      )}
      <Podium rows={rows} />
      {hasData && <RankingList rows={rows} title="Classificação completa" />}
    </div>
  );
}
