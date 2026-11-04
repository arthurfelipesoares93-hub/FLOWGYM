import { todayISO } from "./format";
import { buildRankingRow, sortRanking, type RankingRow } from "./ranking";

const DAY = 86_400_000;

/** Alunos fictícios para ver o ranking pronto. Só é usado no modo de desenvolvimento. */
export type DemoStudent = { id: string; name: string; goal: number; daysAgo: number[] };

export const DEMO_SEED: DemoStudent[] = [
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

const MORE_NAMES = [
  "Heitor Alves",
  "Isabela Rocha",
  "João Pedro",
  "Karina Melo",
  "Lucas Prado",
  "Marina Teles",
  "Nicolas Faria",
  "Olívia Campos",
  "Paulo Neri",
  "Quésia Lopes",
  "Rafael Duarte",
  "Sofia Braga",
];

/** Próximo aluno fictício da lista, sem treinos. */
export function nextDemoStudent(current: DemoStudent[]): DemoStudent {
  const n = current.length + 1;
  return {
    id: `demo-${n}`,
    name: MORE_NAMES[(n - DEMO_SEED.length - 1) % MORE_NAMES.length] ?? `Aluno ${n}`,
    goal: 3,
    daysAgo: [],
  };
}

/** Registra um treino concluído hoje para o aluno fictício. */
export function addDemoSession(current: DemoStudent[], id: string): DemoStudent[] {
  return current.map((s) => (s.id === id ? { ...s, daysAgo: [0, ...s.daysAgo] } : s));
}

export function demoRankingRows(
  students: DemoStudent[] = DEMO_SEED,
  today = todayISO(),
): RankingRow[] {
  const base = Date.parse(`${today}T12:00:00Z`);
  return sortRanking(
    students.map((s) =>
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
