import type { LandingData, Section } from "./schema";

const sections: Section[] = [
  { id: "hero", type: "hero", enabled: true, eyebrow: "", title: "", subtitle: "", image: { url: "", alt: "" }, ctaLabel: "" },
  { id: "plans", type: "plans", enabled: true, title: "Planos", subtitle: "", items: [] },
  { id: "about", type: "about", enabled: true, title: "Sobre", text: "", images: [] },
  { id: "results", type: "results", enabled: false, title: "Resultados", images: [], showBeforeAfter: false },
  { id: "how", type: "how", enabled: true, title: "Como funciona", steps: [] },
  { id: "testimonials", type: "testimonials", enabled: false, title: "Depoimentos", images: [] },
  { id: "faq", type: "faq", enabled: true, title: "Perguntas frequentes", items: [] },
  { id: "cta", type: "cta", enabled: true, title: "", text: "", ctaLabel: "" },
  { id: "footer", type: "footer", enabled: true, text: "", showCnpj: false },
];

/** Página nova: tudo vazio ("preencher"). */
export function emptyLanding(isHealth = false): LandingData {
  return {
    isHealth,
    whatsappMessage: "",
    seo: { title: "", description: "" },
    profile: { name: "", registry: "", city: "", state: "", online: false, whatsapp: "", instagram: "", email: "", cnpj: "" },
    theme: { template: "dark", primary: "#e11d48", accent: "#f59e0b", fontPair: "modern", radius: "lg" },
    sections: structuredClone(sections),
  };
}
