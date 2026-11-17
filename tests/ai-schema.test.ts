import { describe, expect, it } from "vitest";
import { composeLanding } from "@/lib/ai/compose";
import { aiOutputSchema, generateRequestSchema, rewriteRequestSchema, type AiOutput, type GenerateRequest } from "@/lib/ai/schema";
import { landingSchema } from "@/lib/landing/schema";

const ai = (over: Partial<AiOutput> = {}): AiOutput => ({
  template: "dark",
  fontPair: "modern",
  hero: { eyebrow: "Personal", title: "Treino sob medida", subtitle: "Acompanhamento individual", ctaLabel: "" },
  about: { title: "Sobre", text: "Texto" },
  how: { title: "Como funciona", steps: [{ title: "1", text: "a" }] },
  plans: {
    title: "Planos", subtitle: "",
    items: [
      { name: "Mensal", periodMonths: 1, priceCents: 30000, features: ["a"], highlighted: true },
      { name: "Trimestral", periodMonths: 3, priceCents: null, features: [], highlighted: true },
    ],
  },
  faq: { title: "FAQ", items: [{ q: "p", a: "r" }] },
  cta: { title: "Vamos?", text: "", ctaLabel: "" },
  seo: { title: "t", description: "d" },
  imageKinds: [],
  ...over,
});

const req = (over: Partial<GenerateRequest> = {}): GenerateRequest => ({
  professionalId: "00000000-0000-4000-8000-000000000000",
  categoryId: "00000000-0000-4000-8000-000000000001",
  name: "Fulano", city: "Recife", state: "pe", online: false, whatsapp: "+55 (81) 99999-0000",
  text: "Briefing com mais de dez caracteres", images: [], ...over,
});

describe("schema de saída da IA", () => {
  it("aceita uma saída válida", () => {
    expect(aiOutputSchema.safeParse(ai()).success).toBe(true);
  });
  it("rejeita template desconhecido, campo ausente e período não inteiro", () => {
    expect(aiOutputSchema.safeParse({ ...ai(), template: "neon" }).success).toBe(false);
    const { seo: _seo, ...semSeo } = ai();
    void _seo;
    expect(aiOutputSchema.safeParse(semSeo).success).toBe(false);
    const p = ai();
    p.plans.items[0].periodMonths = 1.5;
    expect(aiOutputSchema.safeParse(p).success).toBe(false);
  });
  it("não tem campos para contato, registro, checkout ou depoimentos", () => {
    const keys = JSON.stringify(Object.keys(aiOutputSchema.shape));
    for (const forbidden of ["whatsapp", "registry", "cnpj", "email", "checkoutUrl", "testimonials", "reviews"]) {
      expect(keys).not.toContain(forbidden);
    }
  });
});

describe("composeLanding (regras de produto)", () => {
  it("gera um LandingData válido para o schema da landing", () => {
    expect(landingSchema.safeParse(composeLanding(ai(), req(), false)).success).toBe(true);
  });
  it("contato vem do admin; registro, CNPJ e checkout ficam vazios", () => {
    const d = composeLanding(ai(), req(), false);
    expect(d.profile.whatsapp).toBe("5581999990000");
    expect(d.profile.state).toBe("PE");
    expect(d.profile.registry).toBe("");
    expect(d.profile.cnpj).toBe("");
    const plans = d.sections.find((s) => s.type === "plans");
    expect(plans?.type === "plans" && plans.items.every((i) => i.checkoutUrl === "")).toBe(true);
  });
  it("preço só existe se a IA trouxe (null permanece null) e mantém um único plano destacado", () => {
    const plans = composeLanding(ai(), req(), false).sections.find((s) => s.type === "plans");
    if (plans?.type !== "plans") throw new Error("sem plans");
    expect(plans.items[1].priceCents).toBeNull();
    expect(plans.items.filter((i) => i.highlighted)).toHaveLength(1);
  });
  it("período inválido volta para 1 mês", () => {
    const a = ai();
    a.plans.items[0].periodMonths = 7;
    const plans = composeLanding(a, req(), false).sections.find((s) => s.type === "plans");
    expect(plans?.type === "plans" && plans.items[0].periodMonths).toBe(1);
  });
  it("sem imagens enviadas, depoimentos e resultados ficam desligados (sem prova social inventada)", () => {
    const d = composeLanding(ai(), req(), false);
    for (const t of ["testimonials", "results"] as const) expect(d.sections.find((s) => s.type === t)?.enabled).toBe(false);
  });
  it("em saúde, imagem sugerida pela IA como 'results' vira 'about'; marcada pelo admin é respeitada", () => {
    const url = "https://x/y.webp";
    const sugerida = composeLanding(ai({ imageKinds: [{ index: 0, kind: "results" }] }), req({ images: [{ url, kind: null }] }), true);
    const res = sugerida.sections.find((s) => s.type === "results");
    expect(res?.type === "results" && res.images).toHaveLength(0);
    const marcada = composeLanding(ai(), req({ images: [{ url, kind: "results" }] }), true);
    const res2 = marcada.sections.find((s) => s.type === "results");
    expect(res2?.type === "results" && res2.images).toHaveLength(1);
  });
});

describe("validação das requisições", () => {
  it("briefing curto demais é recusado", () => {
    expect(generateRequestSchema.safeParse({ ...req(), text: "curto" }).success).toBe(false);
  });
  it("máximo de 8 imagens", () => {
    const images = Array.from({ length: 9 }, () => ({ url: "https://x/a.webp", kind: null }));
    expect(generateRequestSchema.safeParse({ ...req(), images }).success).toBe(false);
  });
  it("reescrita livre exige instrução", () => {
    expect(rewriteRequestSchema.safeParse({ text: "oi", mode: "custom" }).success).toBe(false);
    expect(rewriteRequestSchema.safeParse({ text: "oi", mode: "custom", instruction: "mais simples" }).success).toBe(true);
    expect(rewriteRequestSchema.safeParse({ text: "oi", mode: "shorter" }).success).toBe(true);
  });
});
