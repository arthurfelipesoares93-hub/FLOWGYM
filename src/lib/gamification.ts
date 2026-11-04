import { todayISO } from "./format";

export type FinishedSession = { performed_on: string };

const DAY = 86_400_000;

function toTime(iso: string) {
  return Date.parse(`${iso.slice(0, 10)}T12:00:00Z`);
}

/** Segunda-feira (AAAA-MM-DD) da semana da data informada. */
export function weekStartOf(iso: string): string {
  const d = new Date(toTime(iso));
  const day = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - day * DAY).toISOString().slice(0, 10);
}

function countByWeek(sessions: FinishedSession[]) {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const w = weekStartOf(s.performed_on);
    map.set(w, (map.get(w) ?? 0) + 1);
  }
  return map;
}

export function weekProgress(sessions: FinishedSession[], goal: number, today = todayISO()) {
  const target = Math.max(1, goal);
  const done = countByWeek(sessions).get(weekStartOf(today)) ?? 0;
  return { done, goal: target, pct: Math.min(100, Math.round((done / target) * 100)) };
}

/**
 * Semanas seguidas em que a meta semanal foi cumprida. A semana atual só entra
 * quando a meta já foi batida; se ainda não foi, a conta parte da semana anterior.
 */
export function weeklyStreak(sessions: FinishedSession[], goal: number, today = todayISO()) {
  const target = Math.max(1, goal);
  const weeks = countByWeek(sessions);
  let cursor = toTime(weekStartOf(today));
  const key = (t: number) => new Date(t).toISOString().slice(0, 10);
  if ((weeks.get(key(cursor)) ?? 0) < target) cursor -= 7 * DAY;
  let streak = 0;
  while ((weeks.get(key(cursor)) ?? 0) >= target) {
    streak += 1;
    cursor -= 7 * DAY;
  }
  return streak;
}

export type HeatCell = { date: string; count: number; future: boolean };

/** Grade de n semanas (colunas) por 7 dias (linhas, segunda a domingo). */
export function heatmap(sessions: FinishedSession[], weeks = 12, today = todayISO()) {
  const perDay = new Map<string, number>();
  for (const s of sessions) {
    const d = s.performed_on.slice(0, 10);
    perDay.set(d, (perDay.get(d) ?? 0) + 1);
  }
  const first = toTime(weekStartOf(today)) - (weeks - 1) * 7 * DAY;
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d): HeatCell => {
      const date = new Date(first + (w * 7 + d) * DAY).toISOString().slice(0, 10);
      return { date, count: perDay.get(date) ?? 0, future: date > today };
    }),
  );
}

export const XP_PER_SESSION = 10;
export const XP_PER_GOAL_WEEK = 25;

export function xpAndLevel(sessions: FinishedSession[], goal: number) {
  const target = Math.max(1, goal);
  const weeks = countByWeek(sessions);
  let goalWeeks = 0;
  for (const n of weeks.values()) if (n >= target) goalWeeks += 1;
  const xp = sessions.length * XP_PER_SESSION + goalWeeks * XP_PER_GOAL_WEEK;
  // Nível n começa em 50 * (n-1)^2 de XP.
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const from = 50 * (level - 1) ** 2;
  const to = 50 * level ** 2;
  return {
    xp,
    level,
    goalWeeks,
    intoLevel: xp - from,
    levelSpan: to - from,
    pct: Math.round(((xp - from) / (to - from)) * 100),
  };
}

export type Badge = { id: string; label: string; hint: string; earned: boolean };

export function badges(total: number, streak: number, weekDone: boolean): Badge[] {
  const b = (id: string, label: string, hint: string, earned: boolean): Badge => ({
    id,
    label,
    hint,
    earned,
  });
  return [
    b("first", "Primeiro treino", "Conclua 1 treino", total >= 1),
    b("t5", "Aquecido", "Conclua 5 treinos", total >= 5),
    b("t10", "Embalado", "Conclua 10 treinos", total >= 10),
    b("t25", "Constante", "Conclua 25 treinos", total >= 25),
    b("t50", "Imparável", "Conclua 50 treinos", total >= 50),
    b("week", "Semana cheia", "Bata a meta desta semana", weekDone),
    b("s2", "Embalo de 2 semanas", "2 semanas seguidas na meta", streak >= 2),
    b("s4", "Mês de ferro", "4 semanas seguidas na meta", streak >= 4),
    b("s8", "Hábito formado", "8 semanas seguidas na meta", streak >= 8),
  ];
}
