import { emptyLanding } from "@/lib/landing/defaults";
import type { LandingData, Section } from "@/lib/landing/schema";
import { TEMPLATE_DEFAULT_COLORS } from "@/lib/landing/themes";
import type { AiOutput, GenerateRequest, ImageKind } from "./schema";

const VALID_MONTHS = [1, 3, 6, 12];

/** Junta a saída da IA com os dados digitados pelo admin. Contatos/registro/checkout nunca vêm da IA. */
export function composeLanding(ai: AiOutput, req: GenerateRequest, isHealth: boolean): LandingData {
  const d = emptyLanding(isHealth);
  d.profile = { ...d.profile, name: req.name, city: req.city, state: req.state.toUpperCase(), online: req.online, whatsapp: req.whatsapp.replace(/\D/g, "") };
  d.theme = { ...d.theme, template: ai.template, fontPair: ai.fontPair, ...TEMPLATE_DEFAULT_COLORS[ai.template] };
  d.seo = { title: ai.seo.title, description: ai.seo.description };

  // Imagens: o tipo marcado pelo admin vale; senão, a sugestão da IA (índice = posição no envio).
  const suggested = new Map(ai.imageKinds.map((k) => [k.index, k.kind]));
  const byKind: Record<ImageKind, { url: string; alt: string }[]> = { hero: [], about: [], results: [], testimonials: [], logo: [] };
  req.images.forEach((img, i) => {
    let kind = img.kind ?? suggested.get(i) ?? "about";
    if (!img.kind && isHealth && kind === "results") kind = "about";
    byKind[kind].push({ url: img.url, alt: "" });
  });

  const set = (id: string, patch: Partial<Section>) => {
    const s = d.sections.find((x) => x.id === id)!;
    Object.assign(s, patch);
  };
  set("hero", { eyebrow: ai.hero.eyebrow, title: ai.hero.title, subtitle: ai.hero.subtitle, ctaLabel: ai.hero.ctaLabel, image: byKind.hero[0] ?? { url: "", alt: "" } } as Partial<Section>);
  set("about", { title: ai.about.title || "Sobre", text: ai.about.text, images: [...byKind.hero.slice(1), ...byKind.about] } as Partial<Section>);
  set("how", { title: ai.how.title || "Como funciona", steps: ai.how.steps } as Partial<Section>);
  set("plans", {
    title: ai.plans.title || "Planos",
    subtitle: ai.plans.subtitle,
    enabled: ai.plans.items.length > 0,
    items: ai.plans.items.map((p) => ({
      name: p.name,
      priceCents: p.priceCents != null && p.priceCents >= 0 ? p.priceCents : null,
      periodMonths: VALID_MONTHS.includes(p.periodMonths) ? p.periodMonths : 1,
      features: p.features,
      checkoutUrl: "", // sempre do admin
      highlighted: p.highlighted,
    })),
  } as Partial<Section>);
  set("faq", { title: ai.faq.title || "Perguntas frequentes", items: ai.faq.items } as Partial<Section>);
  set("cta", { title: ai.cta.title, text: ai.cta.text, ctaLabel: ai.cta.ctaLabel } as Partial<Section>);
  // Prova social só existe se o admin enviou imagens reais.
  set("results", { images: byKind.results, enabled: byKind.results.length > 0 } as Partial<Section>);
  set("testimonials", { images: byKind.testimonials, enabled: byKind.testimonials.length > 0 } as Partial<Section>);

  // Só um plano destacado.
  const plans = d.sections.find((s) => s.type === "plans");
  if (plans?.type === "plans") {
    let seen = false;
    for (const p of plans.items) { if (p.highlighted && seen) p.highlighted = false; seen ||= p.highlighted; }
  }
  return d;
}
