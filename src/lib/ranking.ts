import { useSuspenseQuery } from "@tanstack/react-query";
import { managementOptions } from "./management";
import { todayISO } from "./format";
import { weekProgress, weeklyStreak, xpAndLevel } from "./gamification";

export type RankingRow = {
  id: string;
  name: string;
  total: number;
  week: ReturnType<typeof weekProgress>;
  streak: number;
  /** Data (AAAA-MM-DD) do treino concluído mais recente; usada no desempate. */
  lastOn: string | null;
  lvl: ReturnType<typeof xpAndLevel>;
};

type Finished = { performed_on: string };

export function buildRankingRow(
  id: string,
  name: string,
  finished: Finished[],
  goalPerWeek: number,
  today = todayISO(),
): RankingRow {
  const goal = Math.max(1, goalPerWeek);
  return {
    id,
    name,
    total: finished.length,
    week: weekProgress(finished, goal, today),
    streak: weeklyStreak(finished, goal, today),
    lastOn: finished.reduce<string | null>(
      (max, t) =>
        max === null || t.performed_on.slice(0, 10) > max ? t.performed_on.slice(0, 10) : max,
      null,
    ),
    lvl: xpAndLevel(finished, goal),
  };
}

export function sortRanking(rows: RankingRow[]) {
  // XP, depois sequência, depois treino mais recente e, por fim, ordem alfabética.
  return [...rows].sort(
    (a, b) =>
      b.lvl.xp - a.lvl.xp ||
      b.streak - a.streak ||
      (b.lastOn ?? "").localeCompare(a.lastOn ?? "") ||
      a.name.localeCompare(b.name, "pt-BR"),
  );
}

/** Ranking dos alunos do treinador, ordenado por XP e depois por sequência. */
export function useRankingRows(): RankingRow[] {
  const { data: d } = useSuspenseQuery(managementOptions);
  return sortRanking(
    d.students.map((s) =>
      buildRankingRow(
        s.id,
        d.profiles.find((p) => p.id === s.user_id)?.full_name ?? "Aluno",
        d.sessions.filter((t) => t.student_id === s.id && t.finished_at),
        d.assessments.find((a) => a.student_id === s.id)?.days_per_week ?? 3,
      ),
    ),
  );
}
