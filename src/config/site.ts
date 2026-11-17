// Nome provisório da marca. Sugestões: "Achei Pro", "Pro Perto", "Vitrine Local" — usando a 1ª.
export const NAME_SUGGESTIONS = ["Achei Pro", "Pro Perto", "Vitrine Local"] as const;

export const siteConfig = {
  name: NAME_SUGGESTIONS[0],
  tagline: "Encontre o profissional certo, perto de você",
  description: "Personal trainers, psicólogos, barbeiros e mais. Busque por categoria e cidade e chame direto no WhatsApp.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
} as const;
