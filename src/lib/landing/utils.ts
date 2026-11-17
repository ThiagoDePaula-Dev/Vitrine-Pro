import type { Plan } from "./schema";

export const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function whatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function defaultWhatsappMessage(name: string) {
  return name ? `Olá, ${name}! Vi sua página e quero saber mais.` : "Olá! Vi sua página e quero saber mais.";
}

export const periodLabel = (months: number) =>
  months === 1 ? "mensal" : months === 3 ? "trimestral" : months === 6 ? "semestral" : months === 12 ? "anual" : `${months} meses`;

/** Economia = (preço mensal do plano de 1 mês × meses) − total do plano. Só existe se houver plano mensal. */
export function planSavings(plan: Plan, all: Plan[]) {
  if (plan.priceCents == null || plan.periodMonths <= 1) return 0;
  const monthly = all.find((p) => p.periodMonths === 1 && p.priceCents != null);
  if (!monthly || monthly.priceCents == null) return 0;
  return Math.max(0, monthly.priceCents * plan.periodMonths - plan.priceCents);
}

export { isReserved } from "./slug";
