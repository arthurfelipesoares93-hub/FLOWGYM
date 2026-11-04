export const brl = (v: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));

/** Formats YYYY-MM-DD (date-only) or ISO timestamps as DD/MM/AAAA without timezone shifts. */
export function dateBR(v: string | null | undefined) {
  if (!v) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  }
  return new Date(v).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function dateTimeBR(v: string | null | undefined) {
  if (!v) return "—";
  return new Date(v).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

const NEGATIVE_ANSWERS = new Set([
  "nenhum",
  "nenhuma",
  "nao",
  "nao tenho",
  "sem",
  "nada",
  "n/a",
  "na",
  "-",
]);

/** Verdadeiro quando o campo livre traz uma informação real (vazio e "nenhuma" não contam). */
export function hasMeaningfulText(value: string | null | undefined) {
  const text = (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.!]+$/, "");
  return text.length > 0 && !NEGATIVE_ANSWERS.has(text);
}

export function ageFrom(birth: string | null | undefined, today = todayISO()) {
  if (!birth) return null;
  const [by = 0, bm = 0, bd = 0] = birth.split("-").map(Number);
  const [ty = 0, tm = 0, td = 0] = today.split("-").map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age--;
  return age >= 0 ? age : null;
}

export const financialLabels: Record<
  string,
  { label: string; tone: "success" | "warning" | "destructive" | "muted" | "info" }
> = {
  em_dia: { label: "Em dia", tone: "success" },
  proximo: { label: "Próximo do vencimento", tone: "warning" },
  pendente: { label: "Pendente", tone: "info" },
  atrasado: { label: "Em atraso", tone: "destructive" },
  bloqueado: { label: "Acesso bloqueado", tone: "destructive" },
  inativo: { label: "Plano inativo", tone: "muted" },
};

export const workoutLabels: Record<
  string,
  { label: string; tone: "success" | "warning" | "destructive" | "muted" | "info" }
> = {
  pendente: { label: "Pendente de revisão", tone: "warning" },
  ajustes: { label: "Devolvido para ajustes", tone: "info" },
  reprovado: { label: "Reprovado", tone: "destructive" },
  aprovado: { label: "Aprovado", tone: "success" },
  substituido: { label: "Substituído", tone: "muted" },
  sem_treino: { label: "Sem treino", tone: "muted" },
};

export const assessmentLabels: Record<
  string,
  { label: string; tone: "success" | "warning" | "muted" }
> = {
  nao_enviada: { label: "Não enviada", tone: "muted" },
  aguardando: { label: "Aguardando análise", tone: "warning" },
  analisada: { label: "Analisada", tone: "success" },
};

export const goalOptions = [
  ["emagrecimento", "Emagrecimento"],
  ["hipertrofia", "Hipertrofia"],
  ["forca", "Ganho de força"],
  ["condicionamento", "Condicionamento físico"],
  ["resistencia", "Melhora da resistência"],
  ["outro", "Outro"],
] as const;

export const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const paymentMethods = [
  "Pix",
  "Dinheiro",
  "Cartão de crédito",
  "Cartão de débito",
  "Transferência",
  "Boleto",
  "Outro",
];

export function errMsg(e: unknown) {
  if (e && typeof e === "object" && "message" in e)
    return String((e as { message: unknown }).message);
  return "Ocorreu um erro inesperado.";
}
