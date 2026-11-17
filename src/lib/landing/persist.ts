import type { LandingData } from "./schema";

/** LandingData → colunas/JSON da tabela `professionals` (usado pelo editor e pela geração com IA). */
export function landingToRow(d: LandingData, slug: string, categoryId: string | null) {
  const p = d.profile;
  return {
    slug,
    category_id: categoryId,
    name: p.name,
    registry: p.registry || null,
    city: p.city || null,
    state: p.state || null,
    online: p.online,
    whatsapp: p.whatsapp.replace(/\D/g, "") || null,
    instagram: p.instagram || null,
    email: p.email || null,
    cnpj: p.cnpj || null,
    theme: d.theme,
    sections: d.sections,
    // a mensagem do WhatsApp mora dentro de `seo` (não há coluna própria)
    seo: { title: d.seo.title, description: d.seo.description, whatsappMessage: d.whatsappMessage },
  };
}
