import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  chargeSplit,
  leadFunnel,
  revenueByMonth,
  sessionsByWeek,
  studentsByMonth,
} from "@/lib/management-charts";
import { brl } from "@/lib/format";
import { Section } from "./ui-bits";

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
};

function ChartBox({
  title,
  label,
  empty,
  children,
}: {
  title: string;
  label: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <Section title={title}>
      {empty ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Ainda não há dados para este gráfico.
        </p>
      ) : (
        <div role="img" aria-label={label} className="h-56 w-full sm:h-64">
          <ResponsiveContainer>{children as React.ReactElement}</ResponsiveContainer>
        </div>
      )}
    </Section>
  );
}

const axis = { fontSize: 11, stroke: "var(--muted-foreground)", tickLine: false } as const;

export function RevenueChart({
  payments,
  months = 6,
}: {
  payments: Parameters<typeof revenueByMonth>[0];
  months?: number;
}) {
  const data = revenueByMonth(payments, months);
  return (
    <ChartBox
      title="Renda por mês"
      label={`Renda mensal dos últimos ${months} meses`}
      empty={data.every((d) => d.recebido === 0)}
    >
      <BarChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis
          {...axis}
          allowDecimals={false}
          width={64}
          tickFormatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          formatter={(v: number) => [brl(v), "Recebido"]}
        />
        <Bar dataKey="recebido" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartBox>
  );
}

export function StudentsChart({
  students,
  months = 6,
}: {
  students: Parameters<typeof studentsByMonth>[0];
  months?: number;
}) {
  const data = studentsByMonth(students, months);
  return (
    <ChartBox
      title="Crescimento de alunos"
      label={`Total de alunos e novos alunos nos últimos ${months} meses`}
      empty={data.every((d) => d.total === 0)}
    >
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="alunosFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} allowDecimals={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="total"
          name="Total de alunos"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="url(#alunosFill)"
        />
        <Area
          type="monotone"
          dataKey="novos"
          name="Novos no mês"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="transparent"
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </AreaChart>
    </ChartBox>
  );
}

export function LeadFunnelChart({ leads }: { leads: { status: string }[] }) {
  const data = leadFunnel(leads);
  return (
    <ChartBox
      title="Funil de interessados"
      label="Quantidade de interessados por etapa"
      empty={data.every((d) => d.total === 0)}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" {...axis} allowDecimals={false} />
        <YAxis type="category" dataKey="label" {...axis} width={92} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          formatter={(v: number) => [v, "Interessados"]}
        />
        <Bar dataKey="total" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartBox>
  );
}

export function WeeklySessionsChart({
  sessions,
  weeks = 8,
}: {
  sessions: Parameters<typeof sessionsByWeek>[0];
  weeks?: number;
}) {
  const data = sessionsByWeek(sessions, weeks);
  return (
    <ChartBox
      title="Treinos concluídos por semana"
      label={`Treinos concluídos nas últimas ${weeks} semanas`}
      empty={data.every((d) => d.treinos === 0)}
    >
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} allowDecimals={false} width={40} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          labelFormatter={(l) => `Semana de ${l}`}
        />
        <Bar dataKey="treinos" name="Treinos" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartBox>
  );
}

const SPLIT_COLORS = ["var(--success)", "var(--info)", "var(--destructive)"];

export function ChargeSplitChart({ charges }: { charges: Parameters<typeof chargeSplit>[0] }) {
  const data = chargeSplit(charges);
  return (
    <ChartBox
      title="Situação das cobranças"
      label="Cobranças pagas, a vencer e vencidas"
      empty={data.every((d) => d.value === 0)}
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SPLIT_COLORS[i]} stroke="var(--card)" />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ChartBox>
  );
}
