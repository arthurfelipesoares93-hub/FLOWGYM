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
