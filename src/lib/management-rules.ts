import { ageFrom, todayISO, weekDays, brl, dateBR } from "./format";

export function daysBetween(from: string, to = todayISO()) {
  return Math.floor(
    (Date.parse(`${to.slice(0, 10)}T12:00:00Z`) - Date.parse(`${from.slice(0, 10)}T12:00:00Z`)) /
      86400000,
  );
}
export function birthdayWithin(birth: string | null, today = todayISO(), window = 7) {
  if (!birth || ageFrom(birth, today) === null) return null;
  const monthDay = birth.slice(5);
  const year = Number(today.slice(0, 4));
  let next = `${year}-${monthDay}`;
  if (next < today) next = `${year + 1}-${monthDay}`;
  const days = daysBetween(today, next);
  return days >= 0 && days <= window ? { days, date: next, age: ageFrom(birth, next) } : null;
}
export function inactivityLevel(
  lastWorkout: string | null,
  start: string | null,
  plannedDays: string[],
  thresholds = { attention: 2, priority: 3, special: 7 },
  today = todayISO(),
) {
  const anchor = lastWorkout || start;
  if (!anchor) return null;
  const elapsed = daysBetween(anchor, today);
  if (elapsed < thresholds.attention) return null;
  if (plannedDays.length) {
    let planned = false;
    for (let d = 1; d <= elapsed; d++) {
      const date = new Date(`${anchor.slice(0, 10)}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() + d);
      if (plannedDays.includes(weekDays[(date.getUTCDay() + 6) % 7] ?? "")) planned = true;
    }
    if (!planned) return null;
  }
  return elapsed >= thresholds.special
    ? "especial"
    : elapsed >= thresholds.priority
      ? "prioritario"
      : "atencao";
}
export function financialStage(due: string, grace = 7, today = todayISO(), autoSuspend = true) {
  const late = daysBetween(due, today);
  if (late > grace && autoSuspend) return "suspenso";
  if (late > 7) return "mais_sete";
  if (late === 7) return "sete";
  if (late > 0) return "atraso";
  if (late === 0) return "hoje";
  if (late === -2) return "dois_dias";
  return "proximo";
}
export function whatsappUrl(phone: string, message: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  if (!/^\d{12,15}$/.test(digits))
    throw new Error("Cadastre um telefone válido com DDD antes de abrir o WhatsApp.");
  if (!message.trim() || message.length > 10000)
    throw new Error("Revise a mensagem antes de continuar.");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
export function goalReached(
  metric: string,
  initial: number | null,
  target: number | null,
  current: number | null,
) {
  if (target === null || current === null || !Number.isFinite(current)) return false;
  if (metric === "treinos") return target > 0 && current >= target;
  if (metric !== "peso" || initial === null || initial === target) return false;
  return target > initial ? current >= target : current <= target;
}
export const birthdayMessage = (name: string) =>
  `Feliz aniversário, ${name}! 🎉🎂💙\n\nHoje é um dia especial, e não poderia deixar de passar aqui para te desejar muita saúde, felicidade, conquistas e motivos para sorrir!\n\nQue esse novo ciclo seja cheio de coisas boas, crescimento e realizações dentro e fora dos treinos.\n\nObrigado por fazer parte do Team Oliveira e confiar no meu trabalho. Que você continue evoluindo, conquistando seus objetivos e se orgulhando da sua jornada!\n\nAproveite muito seu dia. Parabéns! 💪🥳`;
export function followupMessage(name: string, link: string, priority = false) {
  return priority
    ? `Oi, ${name}! Tudo bem com você?\n\nEstou passando para saber como estão as coisas. Percebi que faz alguns dias que você não registra seus treinos e queria saber se está tudo certo.\n\nSe você treinou e esqueceu de atualizar a plataforma, fica tranquilo! É só acessar o link abaixo e registrar o que conseguir lembrar.\n\n${link}\n\nAgora, se você está com dificuldade para manter a rotina, me chama aqui. Podemos conversar e pensar juntos na melhor maneira de continuar seu acompanhamento. Estou por aqui para te ajudar! 💙`
    : `Oi, ${name}! Tudo bem? 😊\n\nPassei aqui porque percebi que faz alguns dias que você não registra seus treinos na plataforma. Queria saber como você está e se está conseguindo manter sua rotina de treinamento.\n\nSe você treinou e acabou esquecendo de registrar, não tem problema! Você pode acessar a plataforma pelo link abaixo e atualizar as informações da forma que conseguir lembrar.\n\n${link}\n\nSe você não conseguiu treinar nesses últimos dias, pode me chamar por aqui para conversarmos. Quero entender como você está e ver como posso te ajudar a continuar evoluindo! 💪`;
}
export function billingMessage(
  name: string,
  amount: number | null,
  due: string | null,
  pix: string,
  stage: string,
) {
  if (!name.trim() || !pix.trim() || amount === null || !Number.isFinite(amount) || !due)
    throw new Error(
      "Cadastre nome, valor pendente, vencimento e chave Pix antes de gerar a cobrança.",
    );
  const value = brl(amount),
    date = dateBR(due);
  if (stage === "dois_dias")
    return `Oi, ${name}! Tudo bem? 😊\n\nPassando só para lembrar que sua mensalidade vence daqui a dois dias, no dia ${date}.\n\nPara facilitar, já deixo a chave Pix aqui:\n\n${pix}\n\nQualquer dúvida, pode me chamar! Obrigado pela parceria! 💙`;
  if (stage === "hoje")
    return `Oi, ${name}! Tudo bem?\n\nPassando para lembrar que sua mensalidade vence hoje, no valor de ${value}.\n\nSegue a chave Pix para facilitar:\n\n${pix}\n\nSe precisar de alguma coisa, estou à disposição! 💪`;
  if (stage === "sete")
    return `Olá, ${name}! Tudo bem?\n\nEstou entrando em contato porque sua mensalidade está com sete dias de atraso.\n\nQuero te lembrar de regularizar o pagamento para evitar a suspensão temporária do acesso à plataforma.\n\nValor pendente: ${value}\n\nChave Pix: ${pix}\n\nSe você já pagou, me avise para conferirmos. Se precisar conversar, estou à disposição.`;
  if (stage === "suspenso")
    return `Olá, ${name}! Tudo bem?\n\nComo sua mensalidade continua pendente após o prazo informado, seu acesso à plataforma foi suspenso temporariamente.\n\nPara regularizar a situação, segue a chave Pix:\n\n${pix}\n\nSe você já realizou o pagamento, entre em contato comigo para conferirmos e reativarmos seu acesso após a confirmação.\n\nSe precisar de ajuda, estou à disposição!`;
  return `Oi, ${name}! Tudo bem?\n\nVi aqui que sua mensalidade, com vencimento em ${date}, ainda consta como pendente no sistema.\n\nEstou passando para te lembrar e deixar a chave Pix novamente:\n\n${pix}\n\nSe você já realizou o pagamento, pode me avisar para eu atualizar o sistema. Se precisar conversar, estou à disposição!`;
}
export const achievementMessage = (name: string, goal: string) =>
  `Parabéns, ${name}! 🏆 Você alcançou a meta de ${goal}. Esse é mais um passo importante na sua jornada. Vamos continuar trabalhando para conquistar os próximos objetivos! 💙`;
