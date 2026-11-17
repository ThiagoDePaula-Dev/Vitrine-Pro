import type { LandingData } from "./schema";

export type Missing = { key: string; label: string };

/**
 * Campos "preencher" que bloqueiam a publicação.
 * `key` usa o mesmo formato do data-field do preview (ex.: "hero.title").
 */
export function missingFields(
  d: LandingData,
  meta: { slug: string; categoryId: string | null; registryLabel: string | null },
): Missing[] {
  const out: Missing[] = [];
  const need = (ok: unknown, key: string, label: string) => { if (!ok) out.push({ key, label }); };
  const p = d.profile;

  need(meta.categoryId, "categoryId", "Escolher a categoria");
  need(meta.slug && !meta.slug.startsWith("pagina-"), "slug", "Definir o endereço (slug)");
  need(p.name.trim(), "profile.name", "Nome do profissional");
  need(p.whatsapp.replace(/\D/g, "").length >= 10, "profile.whatsapp", "WhatsApp (com DDD)");
  need(p.online || p.city.trim(), "profile.city", "Cidade (ou marque atendimento online)");
  if (meta.registryLabel) need(p.registry.trim(), "profile.registry", `Registro profissional (${meta.registryLabel})`);

  for (const s of d.sections) {
    if (!s.enabled) continue;
    switch (s.type) {
      case "hero":
        need(s.title.trim(), "hero.title", "Hero: título");
        need(s.subtitle.trim(), "hero.subtitle", "Hero: subtítulo");
        need(s.image.url, "hero.image", "Hero: foto");
        break;
      case "plans":
        need(s.items.length, "plans.items", "Planos: adicionar ao menos um plano (ou desligar a seção)");
        s.items.forEach((pl, i) => {
          need(pl.name.trim(), `plans.items.${i}.name`, `Plano ${i + 1}: nome`);
          need(pl.priceCents != null, `plans.items.${i}.priceCents`, `Plano ${i + 1}: preço`);
          need(pl.checkoutUrl.trim(), `plans.items.${i}.checkoutUrl`, `Plano ${i + 1}: link de checkout`);
        });
        break;
      case "about":
        need(s.text.trim(), "about.text", "Sobre: texto");
        break;
      case "results":
        need(s.images.length, "results.images", "Resultados: enviar imagens (ou desligar a seção)");
        break;
      case "how":
        need(s.steps.length, "how.steps", "Como funciona: adicionar etapas (ou desligar a seção)");
        s.steps.forEach((st, i) => {
          need(st.title.trim() && st.text.trim(), `how.steps.${i}.title`, `Etapa ${i + 1}: título e texto`);
        });
        break;
      case "testimonials":
        need(s.images.length, "testimonials.images", "Depoimentos: enviar prints reais (ou desligar a seção)");
        break;
      case "faq":
        need(s.items.length, "faq.items", "FAQ: adicionar perguntas (ou desligar a seção)");
        s.items.forEach((it, i) => {
          need(it.q.trim() && it.a.trim(), `faq.items.${i}.q`, `FAQ ${i + 1}: pergunta e resposta`);
        });
        break;
      case "cta":
        need(s.title.trim(), "cta.title", "CTA final: título");
        break;
      case "footer":
        if (s.showCnpj) need(p.cnpj.trim(), "profile.cnpj", "CNPJ (rodapé está configurado para exibir)");
        break;
    }
  }
  return out;
}
