import { describe, expect, it } from "vitest";
import type { Plan } from "@/lib/landing/schema";
import { isReserved, validateSlug } from "@/lib/landing/slug";
import { formatBRL, periodLabel, planSavings, whatsappUrl } from "@/lib/landing/utils";

describe("slug", () => {
  it.each(["joao", "joao-silva", "personal-sp-2", "a1"])("aceita %s", (s) => expect(validateSlug(s)).toBeNull());
  it.each(["", "João", "joao silva", "joao_silva", "-joao", "joao-", "joao--silva", "a".repeat(61)])("recusa %j", (s) =>
    expect(validateSlug(s)).not.toBeNull(),
  );
  it.each(["admin", "api", "busca", "login", "categorias", "ADMIN"])("recusa o reservado %s", (s) => {
    expect(validateSlug(s)).toBe("Esse endereço é reservado");
  });
  it("isReserved só reconhece as rotas do sistema", () => {
    expect(isReserved("busca")).toBe(true);
    expect(isReserved("exemplo")).toBe(false);
  });
});

const plan = (periodMonths: number, priceCents: number | null): Plan => ({
  name: `p${periodMonths}`, priceCents, periodMonths, features: [], checkoutUrl: "", highlighted: false,
});

describe("economia dos planos", () => {
  const all = [plan(1, 30000), plan(3, 79000), plan(6, 150000)];
  it("compara com o plano mensal × meses", () => {
    expect(planSavings(all[1], all)).toBe(11000); // 3×300 − 790
    expect(planSavings(all[2], all)).toBe(30000); // 6×300 − 1500
  });
  it("o plano mensal não tem economia", () => expect(planSavings(all[0], all)).toBe(0));
  it("sem plano mensal, não há base de comparação", () => {
    const sem = [plan(3, 79000), plan(6, 150000)];
    expect(planSavings(sem[0], sem)).toBe(0);
  });
  it("sem preço informado, não calcula", () => {
    const x = [plan(1, 30000), plan(3, null)];
    expect(planSavings(x[1], x)).toBe(0);
  });
  it("nunca devolve economia negativa", () => {
    const x = [plan(1, 10000), plan(3, 50000)];
    expect(planSavings(x[1], x)).toBe(0);
  });
});

describe("formatação", () => {
  it("formatBRL", () => expect(formatBRL(79000).replace(/\s/g, " ")).toBe("R$ 790,00"));
  it("periodLabel", () => {
    expect(periodLabel(1)).toBe("mensal");
    expect(periodLabel(12)).toBe("anual");
    expect(periodLabel(4)).toBe("4 meses");
  });
  it("whatsappUrl mantém só dígitos e codifica a mensagem; vazio se não há número", () => {
    expect(whatsappUrl("+55 (11) 99999-0000", "Olá! Tudo bem?")).toBe("https://wa.me/5511999990000?text=Ol%C3%A1!%20Tudo%20bem%3F");
    expect(whatsappUrl("", "oi")).toBe("");
  });
});
