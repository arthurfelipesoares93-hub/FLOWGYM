import { describe, it, expect } from "vitest";
import {
  birthdayWithin,
  financialStage,
  inactivityLevel,
  goalReached,
  whatsappUrl,
  billingMessage,
} from "@/lib/management-rules";
import { ageFrom, hasMeaningfulText } from "@/lib/format";
import {
  chargeSplit,
  lastMonths,
  leadFunnel,
  monthLabel,
  revenueByMonth,
  sessionsByWeek,
  studentsByMonth,
} from "@/lib/management-charts";
import { buildRankingRow, sortRanking } from "@/lib/ranking";
import {
  XP_PER_GOAL_WEEK,
  XP_PER_SESSION,
  badges,
  heatmap,
  weekProgress,
  weeklyStreak,
  xpAndLevel,
} from "@/lib/gamification";
describe("Team Oliveira business rules", () => {
  it("keeps access through seven late days and suspends on day eight", () => {
    expect(financialStage("2026-12-28", 7, "2027-01-04")).toBe("sete");
    expect(financialStage("2026-12-28", 7, "2027-01-05")).toBe("suspenso");
  });
  it("respects configured suspension grace", () => {
    expect(financialStage("2026-10-01", 10, "2026-10-09")).not.toBe("suspenso");
    expect(financialStage("2026-10-01", 10, "2026-10-12")).toBe("suspenso");
  });
  it("identifies a reminder exactly two days before due", () => {
    expect(financialStage("2027-01-01", 7, "2026-12-30")).toBe("dois_dias");
  });
  it("uses two and three days without registered training", () => {
    expect(inactivityLevel("2026-10-26", null, [], undefined, "2026-10-28")).toBe("atencao");
    expect(inactivityLevel("2026-10-26", null, [], undefined, "2026-10-29")).toBe("prioritario");
  });
  it("avoids alerts when no training was scheduled", () => {
    expect(inactivityLevel("2026-10-23", null, ["Segunda"], undefined, "2026-10-25")).toBeNull();
  });
  it("calculates age and upcoming birthdays across the year", () => {
    expect(ageFrom("2000-01-02", "2026-12-30")).toBe(26);
    expect(birthdayWithin("2000-01-02", "2026-12-30")).toEqual({
      days: 3,
      date: "2027-01-02",
      age: 27,
    });
    expect(birthdayWithin("2000-01-10", "2026-12-30")).toBeNull();
  });
  it("respects both directions of weight goals and requires evidence", () => {
    expect(goalReached("peso", 70, 75, 75)).toBe(true);
    expect(goalReached("peso", 70, 75, 65)).toBe(false);
    expect(goalReached("peso", 90, 80, 80)).toBe(true);
    expect(goalReached("peso", null, 80, 80)).toBe(false);
  });
  it("counts only valid workout targets", () => {
    expect(goalReached("treinos", 0, 12, 12)).toBe(true);
    expect(goalReached("treinos", 0, 12, 11)).toBe(false);
  });
  it("refuses missing billing details", () => {
    expect(() => billingMessage("Ana", 100, "2026-10-30", "", "hoje")).toThrow();
  });
  it("validates phones and safely encodes manual WhatsApp messages", () => {
    expect(whatsappUrl("(11) 99999-9999", "Olá Ana!")).toBe(
      "https://wa.me/5511999999999?text=Ol%C3%A1%20Ana!",
    );
    expect(() => whatsappUrl("123", "Olá")).toThrow();
  });
});

describe("hasMeaningfulText", () => {
  it("ignora vazio e respostas negativas", () => {
    for (const v of [
      null,
      undefined,
      "",
      "  ",
      "Nenhuma",
      "nenhum.",
      "Não",
      "nao tenho",
      "N/A",
      "-",
    ]) {
      expect(hasMeaningfulText(v)).toBe(false);
    }
  });
  it("aceita descrição real", () => {
    expect(hasMeaningfulText("Dor no joelho direito")).toBe(true);
    expect(hasMeaningfulText("Hérnia de disco")).toBe(true);
  });
});

describe("management-charts", () => {
  it("lista os últimos meses em ordem, atravessando o ano", () => {
    expect(lastMonths(3, "2026-01-15")).toEqual(["2025-11", "2025-12", "2026-01"]);
    expect(monthLabel("2026-11")).toBe("nov/26");
  });
  it("soma renda por mês e ignora estornos", () => {
    const r = revenueByMonth(
      [
        { paid_on: "2026-10-05", amount: 100 },
        { paid_on: "2026-10-20", amount: 50.5 },
        { paid_on: "2026-11-01", amount: 80, refunded: true },
        { paid_on: "2026-11-02", amount: 30 },
      ],
      2,
      "2026-11-10",
    );
    expect(r.map((x) => x.recebido)).toEqual([150.5, 30]);
  });
  it("acumula alunos e conta novos por mês", () => {
    const r = studentsByMonth(
      [{ created_at: "2026-09-10" }, { created_at: "2026-11-02" }, { created_at: "2026-11-05" }],
      3,
      "2026-11-10",
    );
    expect(r.map((x) => [x.novos, x.total])).toEqual([
      [1, 1],
      [0, 1],
      [2, 3],
    ]);
  });
  it("conta treinos concluídos por semana começando na segunda", () => {
    const r = sessionsByWeek(
      [
        { performed_on: "2026-11-02", finished_at: "x" },
        { performed_on: "2026-11-08", finished_at: "x" },
        { performed_on: "2026-11-09", finished_at: "x" },
        { performed_on: "2026-11-09", finished_at: null },
      ],
      2,
      "2026-11-10",
    );
    expect(r.map((x) => x.treinos)).toEqual([2, 1]);
  });
  it("separa cobranças pagas, a vencer e vencidas", () => {
    const r = chargeSplit(
      [
        { status: "paga", due_date: "2026-10-01" },
        { status: "aberta", due_date: "2026-11-01" },
        { status: "aberta", due_date: "2026-12-01" },
      ],
      "2026-11-10",
    );
    expect(r.map((x) => x.value)).toEqual([1, 1, 1]);
  });
  it("monta o funil de interessados em todas as etapas", () => {
    const f = leadFunnel([{ status: "novo" }, { status: "novo" }, { status: "matriculado" }]);
    expect(f.find((x) => x.status === "novo")?.total).toBe(2);
    expect(f).toHaveLength(6);
  });
});

describe("gamification", () => {
  const s = (d: string) => ({ performed_on: d });
  it("mede a meta da semana a partir da segunda", () => {
    const w = weekProgress([s("2026-11-09"), s("2026-11-10"), s("2026-11-08")], 3, "2026-11-11");
    expect(w).toEqual({ done: 2, goal: 3, pct: 67 });
  });
  it("conta semanas seguidas na meta e parte da anterior se a atual não bateu", () => {
    const sessions = [
      s("2026-10-19"),
      s("2026-10-20"),
      s("2026-10-26"),
      s("2026-10-27"),
      s("2026-11-02"),
      s("2026-11-03"),
    ];
    expect(weeklyStreak(sessions, 2, "2026-11-04")).toBe(3);
    expect(weeklyStreak(sessions, 3, "2026-11-04")).toBe(0);
    expect(weeklyStreak([s("2026-10-26"), s("2026-10-27")], 2, "2026-11-04")).toBe(1);
  });
  it("monta a grade de constância com 7 dias por semana", () => {
    const g = heatmap([s("2026-11-10"), s("2026-11-10")], 2, "2026-11-11");
    expect(g).toHaveLength(2);
    expect(g[1]).toHaveLength(7);
    expect(g[1]?.find((c) => c.date === "2026-11-10")?.count).toBe(2);
    expect(g[1]?.find((c) => c.date === "2026-11-12")?.future).toBe(true);
  });
  it("calcula XP e nível", () => {
    const sessions = Array.from({ length: 5 }, (_, i) => s(`2026-11-0${i + 1}`));
    const r = xpAndLevel(sessions, 3);
    expect(r.xp).toBe(5 * XP_PER_SESSION + 1 * XP_PER_GOAL_WEEK);
    expect(r.level).toBe(Math.floor(Math.sqrt(r.xp / 50)) + 1);
    expect(r.pct).toBeGreaterThanOrEqual(0);
    expect(r.pct).toBeLessThanOrEqual(100);
  });
  it("libera conquistas por total, sequência e semana cheia", () => {
    const b = badges(10, 2, true);
    const earned = b.filter((x) => x.earned).map((x) => x.id);
    expect(earned).toEqual(["first", "t5", "t10", "week", "s2"]);
  });
});

describe("ranking", () => {
  const today = "2026-11-11";
  const row = (name: string, days: string[]) =>
    buildRankingRow(
      name,
      name,
      days.map((d) => ({ performed_on: d })),
      3,
      today,
    );
  it("desempata por treino mais recente e depois por nome", () => {
    const a = row("Bia", ["2026-11-02", "2026-11-03"]);
    const b = row("Ana", ["2026-11-02", "2026-11-04"]);
    const c = row("Caio", ["2026-11-02", "2026-11-04"]);
    expect(sortRanking([a, c, b]).map((r) => r.name)).toEqual(["Ana", "Caio", "Bia"]);
  });
  it("ordena por XP antes do desempate", () => {
    const many = row("Zé", ["2026-11-01", "2026-11-02", "2026-11-03"]);
    const few = row("Ana", ["2026-11-10"]);
    expect(sortRanking([few, many])[0]?.name).toBe("Zé");
  });
});
