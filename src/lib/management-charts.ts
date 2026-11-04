import { todayISO } from "./format";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Últimos n meses (AAAA-MM), do mais antigo ao atual. */
export function lastMonths(n: number, today = todayISO()): string[] {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  return Array.from({ length: n }, (_, i) => {
    const offset = n - 1 - i;
    const d = new Date(Date.UTC(year, month - offset, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

export function monthLabel(key: string): string {
  return `${MONTHS[Number(key.slice(5, 7)) - 1]}/${key.slice(2, 4)}`;
}

export type RevenuePoint = { month: string; label: string; recebido: number };

export function revenueByMonth(
  payments: { paid_on: string; amount: number; refunded?: boolean | null }[],
  n = 6,
  today = todayISO(),
): RevenuePoint[] {
  return lastMonths(n, today).map((month) => ({
    month,
    label: monthLabel(month),
    recebido: payments
      .filter((p) => !p.refunded && p.paid_on.slice(0, 7) === month)
      .reduce((sum, p) => sum + Number(p.amount), 0),
  }));
}

export type StudentPoint = { month: string; label: string; novos: number; total: number };

export function studentsByMonth(
  students: { created_at: string }[],
  n = 6,
  today = todayISO(),
): StudentPoint[] {
  return lastMonths(n, today).map((month) => ({
    month,
    label: monthLabel(month),
    novos: students.filter((s) => s.created_at.slice(0, 7) === month).length,
    total: students.filter((s) => s.created_at.slice(0, 7) <= month).length,
  }));
}

export const leadStatusLabels: [string, string][] = [
  ["novo", "Novo"],
  ["primeiro_contato", "1º contato"],
  ["aguardando", "Aguardando"],
  ["negociacao", "Negociação"],
  ["matriculado", "Matriculado"],
  ["nao_convertido", "Não convertido"],
];

export function leadFunnel(leads: { status: string }[]) {
  return leadStatusLabels.map(([status, label]) => ({
    status,
    label,
    total: leads.filter((l) => l.status === status).length,
  }));
}

function weekStart(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // segunda = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export type WeekPoint = { week: string; label: string; treinos: number };

export function sessionsByWeek(
  sessions: { performed_on: string; finished_at?: string | null }[],
  n = 8,
  today = todayISO(),
): WeekPoint[] {
  const current = new Date(`${weekStart(today)}T12:00:00Z`);
  const weeks = Array.from({ length: n }, (_, i) => {
    const d = new Date(current);
    d.setUTCDate(d.getUTCDate() - 7 * (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  return weeks.map((week) => ({
    week,
    label: `${week.slice(8, 10)}/${week.slice(5, 7)}`,
    treinos: sessions.filter((s) => s.finished_at && weekStart(s.performed_on) === week).length,
  }));
}

export function chargeSplit(charges: { status: string; due_date: string }[], today = todayISO()) {
  const paid = charges.filter((c) => c.status === "paga").length;
  const open = charges.filter((c) => c.status === "aberta");
  const overdue = open.filter((c) => c.due_date < today).length;
  return [
    { name: "Pagas", value: paid },
    { name: "A vencer", value: open.length - overdue },
    { name: "Vencidas", value: overdue },
  ];
}
