import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ErrorBox, Loading, Section, StatCard } from "./ui-bits";
import { dateBR, todayISO } from "@/lib/format";

type SetDetail = { reps?: number; load?: number };

function weekKey(d: string) {
  const dt = new Date(d + "T12:00:00");
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day);
  return dt.toISOString().slice(0, 10);
}

export function Performance({ studentId }: { studentId: string }) {
  const [days, setDays] = useState(90);
  const since = useMemo(() => {
    const d = new Date(todayISO() + "T12:00:00");
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }, [days]);

  const q = useQuery({
    queryKey: ["performance", studentId, since],
    queryFn: async () => {
      const [{ data: sessions, error: e1 }, { data: logs, error: e2 }] = await Promise.all([
        supabase
          .from("training_sessions")
          .select("id, performed_on, started_at, finished_at, notes, workout_sessions(name)")
          .eq("student_id", studentId)
          .gte("performed_on", since)
          .order("performed_on", { ascending: false }),
        supabase
          .from("exercise_logs")
          .select(
            "id, performed_on, completed, set_details, notes, exercise_id, workout_exercises(name)",
          )
          .eq("student_id", studentId)
          .gte("performed_on", since)
          .order("performed_on"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { sessions: sessions ?? [], logs: logs ?? [] };
    },
  });

  const [exercise, setExercise] = useState("");
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  if (!q.data) return <Loading />;
  const { sessions, logs } = q.data;

  const finished = sessions.filter((s) => s.finished_at);
  const weekly = Object.entries(
    finished.reduce<Record<string, number>>((a, s) => {
      const k = weekKey(s.performed_on);
      a[k] = (a[k] ?? 0) + 1;
      return a;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([w, n]) => ({ semana: dateBR(w).slice(0, 5), treinos: n }));
  const names = Array.from(
    new Set(
      logs.map((l) => (l.workout_exercises as { name: string } | null)?.name).filter(Boolean),
    ),
  ) as string[];
  const current = exercise || names[0] || "";
  const loadSeries = logs
    .filter((l) => (l.workout_exercises as { name: string } | null)?.name === current)
    .map((l) => {
      const sets = (l.set_details as SetDetail[]) ?? [];
      return {
        data: dateBR(l.performed_on).slice(0, 5),
        carga: Math.max(0, ...sets.map((s) => Number(s.load) || 0)),
        reps: sets.reduce((a, s) => a + (Number(s.reps) || 0), 0),
      };
    });
  const completed = logs.filter((l) => l.completed).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[30, 90, 180, 365].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-full border px-3 py-1 text-sm ${days === d ? "bg-primary text-primary-foreground" : "bg-card"}`}
          >
            {d} dias
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Treinos realizados" value={finished.length} />
        <StatCard
          label="Média semanal"
          value={(finished.length / Math.max(1, days / 7)).toFixed(1)}
        />
        <StatCard label="Exercícios concluídos" value={completed} />
        <StatCard
          label="Último treino"
          value={<span className="text-xl">{dateBR(finished[0]?.performed_on)}</span>}
        />
      </div>
      {!logs.length ? (
        <EmptyState
          title="Sem registros no período"
          description="Os treinos registrados aparecerão aqui."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Frequência semanal">
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="semana" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="treinos" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
          <Section
            title="Evolução de carga"
            actions={
              <select
                className="h-8 max-w-[12rem] rounded-md border bg-background px-2 text-xs"
                value={current}
                onChange={(e) => setExercise(e.target.value)}
              >
                {names.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            }
          >
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={loadSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="data" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line
                    dataKey="carga"
                    name="Carga máx. (kg)"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                  />
                  <Line
                    dataKey="reps"
                    name="Repetições totais"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>
      )}
      <Section title="Histórico de sessões">
        {!sessions.length ? (
          <p className="text-sm text-muted-foreground">Nenhuma sessão no período.</p>
        ) : (
          <ul className="divide-y">
            {sessions.map((s) => {
              return (
                <li key={s.id} className="py-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <b>{(s.workout_sessions as { name: string } | null)?.name}</b>
                    <span className="text-muted-foreground">{dateBR(s.performed_on)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.finished_at ? "Concluída" : "Em andamento"}
                    {s.notes ? ` · ${s.notes}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
      <Section title="Registros de exercícios">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Data</th>
                <th>Exercício</th>
                <th>Séries (reps × kg)</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {[...logs]
                .reverse()
                .slice(0, 100)
                .map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="py-2 pr-2 whitespace-nowrap">{dateBR(l.performed_on)}</td>
                    <td className="pr-2">
                      {(l.workout_exercises as { name: string } | null)?.name} {l.completed && "✓"}
                    </td>
                    <td className="pr-2">
                      {((l.set_details as SetDetail[]) ?? [])
                        .map((s) => `${s.reps ?? "-"}×${s.load ?? 0}`)
                        .join(", ")}
                    </td>
                    <td className="text-xs text-muted-foreground">{l.notes}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
