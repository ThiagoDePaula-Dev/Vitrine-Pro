// Nome da marca (provisório). Todo o app (metadados, logo, OG, sitemap) lê daqui.
export const siteConfig = {
  name: "Vitrine Pro",
  tagline: "Encontre o profissional certo, perto de você",
  description: "Personal trainers, psicólogos, barbeiros e mais. Busque por categoria e cidade e chame direto no WhatsApp.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
} as const;
