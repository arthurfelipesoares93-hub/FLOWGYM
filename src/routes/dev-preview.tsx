import { createFileRoute, notFound } from "@tanstack/react-router";
import { Podium } from "@/components/app/ranking-page";
import { JourneyView, RankingList, type RankingRow } from "@/components/app/student-journey";
import {
  ChargeSplitChart,
  LeadFunnelChart,
  RevenueChart,
  StudentsChart,
  WeeklySessionsChart,
} from "@/components/app/management-charts";
import { todayISO } from "@/lib/format";
import { weekProgress, weeklyStreak, xpAndLevel } from "@/lib/gamification";

/**
 * Prévia com dados fictícios dos gráficos, da jornada e do ranking.
 * Existe só no modo de desenvolvimento (`bun run dev`); em produção a rota responde 404.
 */
export const Route = createFileRoute("/dev-preview")({
  staticData: { sitemap: false },
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  head: () => ({
    meta: [{ title: "Prévia com dados fictícios" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

const TODAY = todayISO();
const day = (n: number) =>
  new Date(Date.parse(`${TODAY}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
const sessionsAt = (offsets: number[]) =>
  offsets.map((o) => ({ performed_on: day(o), finished_at: "fim" }));

const students = [
  {
    id: "1",
    name: "Ana Souza",
    goal: 3,
    sessions: sessionsAt([
      0, 1, 2, 4, 5, 7, 8, 9, 11, 12, 14, 15, 16, 18, 19, 21, 22, 23, 26, 28, 29, 30, 33, 35, 36,
      40, 42, 43, 47, 49, 50,
    ]),
  },
  {
    id: "2",
    name: "Bruno Lima",
    goal: 3,
    sessions: sessionsAt([1, 3, 8, 10, 15, 17, 22, 24, 29, 31]),
  },
  { id: "3", name: "Carla Dias", goal: 3, sessions: sessionsAt([2, 9, 16, 23, 30, 37]) },
  { id: "4", name: "Diego Reis", goal: 4, sessions: sessionsAt([5, 12, 19, 26]) },
  { id: "5", name: "Elisa Matos", goal: 2, sessions: sessionsAt([0, 3, 7, 10, 14, 17, 21, 24]) },
  { id: "6", name: "Felipe Costa", goal: 3, sessions: sessionsAt([20]) },
  { id: "7", name: "Gabi Nunes", goal: 3, sessions: [] },
];

const rows: RankingRow[] = students
  .map((s) => ({
    id: s.id,
    name: s.name,
    total: s.sessions.length,
    week: weekProgress(s.sessions, s.goal, TODAY),
    streak: weeklyStreak(s.sessions, s.goal, TODAY),
    lvl: xpAndLevel(s.sessions, s.goal),
  }))
  .sort((a, b) => b.lvl.xp - a.lvl.xp || b.streak - a.streak);

const monthAgo = (m: number, d = 5) => {
  const base = new Date(Date.parse(`${TODAY}T12:00:00Z`));
  base.setUTCMonth(base.getUTCMonth() - m, d);
  return base.toISOString().slice(0, 10);
};
const payments = [300, 450, 600, 600, 750, 900].map((amount, i) => ({
  paid_on: monthAgo(5 - i),
  amount,
}));
const createdAt = [5, 4, 4, 3, 2, 2, 1, 0].map((m) => ({ created_at: monthAgo(m, 10) }));
const leads = [
  "novo",
  "novo",
  "novo",
  "primeiro_contato",
  "primeiro_contato",
  "aguardando",
  "negociacao",
  "matriculado",
  "matriculado",
  "nao_convertido",
].map((status) => ({ status }));
const charges = [
  { status: "paga", due_date: monthAgo(2) },
  { status: "paga", due_date: monthAgo(1) },
  { status: "paga", due_date: monthAgo(3) },
  { status: "aberta", due_date: day(-10) },
  { status: "aberta", due_date: day(4) },
];

function Page() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-3xl">Prévia com dados fictícios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nada aqui vem do banco. Disponível só no modo de desenvolvimento.
        </p>
      </header>
      <h2 className="text-2xl">Jornada do aluno (Ana Souza)</h2>
      <JourneyView sessions={students[0]!.sessions} goalPerWeek={3} />
      <h2 className="text-2xl">Página de ranking</h2>
      <Podium rows={rows} />
      <RankingList rows={rows} title="Classificação completa" />
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart payments={payments} />
        <StudentsChart students={createdAt} />
        <LeadFunnelChart leads={leads} />
        <ChargeSplitChart charges={charges} />
        <WeeklySessionsChart sessions={students[0]!.sessions} />
      </div>
    </div>
  );
}
