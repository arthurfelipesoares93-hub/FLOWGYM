import { todayISO } from "./format";
import { buildRankingRow, sortRanking, type RankingRow } from "./ranking";

const DAY = 86_400_000;

/** Alunos fictícios para ver o ranking pronto. Só é usado no modo de desenvolvimento. */
const DEMO: { id: string; name: string; goal: number; daysAgo: number[] }[] = [
  {
    id: "demo-1",
    name: "Ana Souza",
    goal: 3,
    daysAgo: [
      0, 1, 2, 4, 5, 7, 8, 9, 11, 12, 14, 15, 16, 18, 19, 21, 22, 23, 26, 28, 29, 30, 33, 35, 36,
      40, 42, 43, 47, 49, 50,
    ],
  },
  { id: "demo-2", name: "Bruno Lima", goal: 3, daysAgo: [1, 3, 8, 10, 15, 17, 22, 24, 29, 31] },
  { id: "demo-3", name: "Carla Dias", goal: 3, daysAgo: [2, 9, 16, 23, 30, 37] },
  { id: "demo-4", name: "Diego Reis", goal: 4, daysAgo: [5, 12, 19, 26] },
  { id: "demo-5", name: "Elisa Matos", goal: 2, daysAgo: [0, 3, 7, 10, 14, 17, 21, 24] },
  { id: "demo-6", name: "Felipe Costa", goal: 3, daysAgo: [20] },
  { id: "demo-7", name: "Gabi Nunes", goal: 3, daysAgo: [] },
];

export function demoRankingRows(today = todayISO()): RankingRow[] {
  const base = Date.parse(`${today}T12:00:00Z`);
  return sortRanking(
    DEMO.map((s) =>
      buildRankingRow(
        s.id,
        s.name,
        s.daysAgo.map((n) => ({
          performed_on: new Date(base - n * DAY).toISOString().slice(0, 10),
        })),
        s.goal,
        today,
      ),
    ),
  );
}
