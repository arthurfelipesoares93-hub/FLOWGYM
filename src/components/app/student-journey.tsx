import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Flame, Lock, Medal, Sparkles, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { managementOptions } from "@/lib/management";
import { cn } from "@/lib/utils";
import { dateBR, todayISO } from "@/lib/format";
import { badges, heatmap, weekProgress, weeklyStreak, xpAndLevel } from "@/lib/gamification";
import { ErrorBox, Loading, Section, StatCard } from "./ui-bits";

function useFinishedSessions(studentId: string) {
  return useQuery({
    queryKey: ["journey-sessions", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("performed_on")
        .eq("student_id", studentId)
        .not("finished_at", "is", null)
        .order("performed_on", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function ProgressRing({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative mx-auto h-36 w-36"
      role="img"
      aria-label={`Meta da semana: ${label}, ${pct}%`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold">{label}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

const HEAT = ["bg-muted", "bg-chart-1/30", "bg-chart-1/60", "bg-chart-1"];

function Heatmap({ sessions }: { sessions: { performed_on: string }[] }) {
  const weeks = heatmap(sessions, 12);
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1" role="img" aria-label="Treinos concluídos nas últimas 12 semanas">
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-col gap-1">
            {w.map((c) => (
              <div
                key={c.date}
                title={`${dateBR(c.date)} · ${c.count} treino${c.count === 1 ? "" : "s"}`}
                className={cn(
                  "h-4 w-4 rounded-[4px] transition-transform duration-150 hover:scale-125 sm:h-5 sm:w-5",
                  c.future ? "bg-transparent" : HEAT[Math.min(c.count, 3)],
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        Menos
        {HEAT.map((h) => (
          <span key={h} className={cn("h-3 w-3 rounded-[3px]", h)} />
        ))}
        Mais
      </div>
    </div>
  );
}

export function StudentJourney({
  studentId,
  goalPerWeek = 3,
}: {
  studentId: string;
  goalPerWeek?: number | null;
}) {
  const q = useFinishedSessions(studentId);
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const sessions = q.data ?? [];
  const goal = Math.max(1, goalPerWeek ?? 3);
  const week = weekProgress(sessions, goal);
  const streak = weeklyStreak(sessions, goal);
  const lvl = xpAndLevel(sessions, goal);
  const list = badges(sessions.length, streak, week.done >= week.goal);
  const earned = list.filter((b) => b.earned).length;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Meta da semana">
          <ProgressRing
            pct={week.pct}
            label={`${week.done}/${week.goal}`}
            sub={week.done >= week.goal ? "Meta batida!" : "treinos"}
          />
        </Section>
        <Section title="Nível">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card">
              <span className="font-display text-2xl font-bold">{lvl.level}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{lvl.xp} XP</p>
              <div
                className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={lvl.pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso para o próximo nível"
              >
                <div
                  className="h-full rounded-full bg-chart-1 transition-[width] duration-700 ease-out"
                  style={{ width: `${lvl.pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {lvl.levelSpan - lvl.intoLevel} XP para o nível {lvl.level + 1}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            10 XP por treino concluído e 25 XP por semana com a meta batida.
          </p>
        </Section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <StatCard
            label="Sequência"
            value={
              <span className="inline-flex items-center gap-1.5">
                <Flame
                  className={cn("h-6 w-6", streak ? "text-warning" : "text-muted-foreground")}
                />
                {streak} {streak === 1 ? "semana" : "semanas"}
              </span>
            }
            hint="Semanas seguidas na meta"
          />
          <StatCard label="Treinos concluídos" value={sessions.length} hint="No total" />
        </div>
      </div>
      <Section title="Constância das últimas 12 semanas">
        <Heatmap sessions={sessions} />
      </Section>
      <Section title={`Conquistas · ${earned} de ${list.length}`}>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <li
              key={b.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors",
                b.earned ? "border-chart-1/40 bg-chart-1/10" : "opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  b.earned ? "bg-chart-1 text-primary-foreground" : "bg-muted",
                )}
              >
                {b.earned ? <Trophy className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <b className="block truncate">{b.label}</b>
                <span className="text-xs text-muted-foreground">{b.hint}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

const MEDALS = ["text-warning", "text-muted-foreground", "text-chart-3"];

/** Ranking de alunos por XP, para o treinador. */
export function StudentRanking() {
  const { data: d } = useSuspenseQuery(managementOptions);
  const today = todayISO();
  const rows = d.students
    .map((s) => {
      const finished = d.sessions.filter((t) => t.student_id === s.id && t.finished_at);
      const goal = Math.max(
        1,
        d.assessments.find((a) => a.student_id === s.id)?.days_per_week ?? 3,
      );
      return {
        id: s.id,
        name: d.profiles.find((p) => p.id === s.user_id)?.full_name ?? "Aluno",
        total: finished.length,
        week: weekProgress(finished, goal, today),
        streak: weeklyStreak(finished, goal, today),
        lvl: xpAndLevel(finished, goal),
      };
    })
    .sort((a, b) => b.lvl.xp - a.lvl.xp || b.streak - a.streak)
    .slice(0, 10);
  return (
    <Section title="Ranking de alunos">
      {!rows.length || rows.every((r) => r.total === 0) ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          O ranking aparece quando os alunos concluírem treinos.
        </p>
      ) : (
        <ol className="divide-y">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <span className="flex w-8 shrink-0 justify-center">
                {i < 3 ? (
                  <Medal className={cn("h-5 w-5", MEDALS[i])} aria-label={`${i + 1}º lugar`} />
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">{i + 1}º</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-chart-1 transition-[width] duration-700"
                    style={{ width: `${r.week.pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Semana: {r.week.done}/{r.week.goal} treinos
                </p>
              </div>
              <div className="shrink-0 text-right text-xs">
                <p className="inline-flex items-center gap-1 font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-chart-1" /> Nv {r.lvl.level} · {r.lvl.xp} XP
                </p>
                <p className="inline-flex items-center gap-1 text-muted-foreground">
                  <Flame className="h-3.5 w-3.5" /> {r.streak} sem.
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
